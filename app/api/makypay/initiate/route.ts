import { NextRequest, NextResponse } from 'next/server';
import { MakyPayService } from '@/lib/makypay';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, phoneNumber, amount, description, paymentMethod = 'mobile_money' } = await request.json();

    if (!userId || !amount || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/makypay/webhook`;

    let result;
    
    if (paymentMethod === 'card') {
      result = await MakyPayService.collectCard({
        userId,
        amount,
        description,
        callbackUrl,
      });
    } else {
      if (!phoneNumber) {
        return NextResponse.json({ error: 'Phone number required for mobile money' }, { status: 400 });
      }
      
      result = await MakyPayService.collectMobileMoney({
        userId,
        phoneNumber,
        amount,
        description,
        callbackUrl,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment initiation failed' },
      { status: 500 }
    );
  }
}
