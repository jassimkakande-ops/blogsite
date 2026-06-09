import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const type = requestUrl.searchParams.get("type");

  console.log("Auth callback received:", {
    code: code?.substring(0, 10) + "...",
    error,
    errorDescription,
    type,
    fullUrl: request.url,
  });

  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/signin?error=${encodeURIComponent(error)}`
    );
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/signin?error=${encodeURIComponent(
            exchangeError.message
          )}`
        );
      }

      console.log("Code exchange successful:", data.session?.user?.email);

      // Check if this is a password reset callback
      if (type === 'recovery') {
        return NextResponse.redirect(
          `${requestUrl.origin}/reset-password?session=active`
        );
      }

      // For OAuth sign-in/sign-up, redirect to intended page or home
      return NextResponse.redirect(`${requestUrl.origin}/auth/callback-client`);
    } catch (err) {
      console.error("Callback processing error:", err);
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=callback_failed`
      );
    }
  }

  // If no code or error, redirect to sign in page
  return NextResponse.redirect(`${requestUrl.origin}/signin`);
}
