import { NextRequest, NextResponse } from 'next/server';
import { YoPaymentsService } from '@/lib/yopayments';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();
  const { userId, phoneNumber, amount, description, externalReference, accessToken } = body;

    // Validate required fields
    if (!userId || !phoneNumber || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, phoneNumber, amount, description' },
        { status: 400 }
      );
    }

    // Try resolving user from provided session access token (client is signed in)
    let resolvedUserId: string | null = userId ?? null;
    if (!resolvedUserId && accessToken) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          }
        });
        if (res.ok) {
          const userJson = await res.json();
          if (userJson && userJson.id) resolvedUserId = userJson.id;
        }
      } catch (e) {
        console.error('Session-based user resolution failed:', e);
      }
    }

    // Verify user exists.
    // On the server we should prefer using the Supabase service role key if available
    // because `supabase` exported from `lib/supabase` uses the public anon key and
    // cannot call admin APIs. If `SUPABASE_SERVICE_ROLE_KEY` is set, use it to
    // create an admin client and call `auth.admin.getUserById`. Otherwise fall
    // back to checking the `profiles` table for the user id.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let userExists = false;

    const userIdToValidate = resolvedUserId || userId;

    if (serviceRoleKey) {
      try {
        const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', serviceRoleKey, {
          auth: { persistSession: false }
        });

        const { data: adminUser, error: adminError } = await adminClient.auth.admin.getUserById(userIdToValidate as string);
        if (!adminError && adminUser && adminUser.user) {
          userExists = true;
        }
      } catch (e) {
        console.error('Service-role user lookup failed:', e);
      }
    }

    if (!userExists) {
      try {
        // Fallback: check `profiles` table for the user id. This works when the
        // anon key or RLS allows reading profiles via server-side route.
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userIdToValidate)
          .single();

        if (profile && !profileError) {
          userExists = true;
        }
      } catch (e) {
        console.error('Profiles lookup failed:', e);
      }
    }

    if (!userExists) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Initiate payment with YoPayments
    const result = await YoPaymentsService.initiateDeposit({
      userId: userIdToValidate as string,
      phoneNumber,
      amount: parseFloat(amount),
      description,
      externalReference,
    });

    return NextResponse.json({
      success: true,
      transaction: result,
    });

  } catch (error) {
    console.error('YoPayments API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Payment initiation failed',
        success: false
      },
      { status: 500 }
    );
  }
}