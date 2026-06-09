"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Footer from "@/components/Footer";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isValidToken, setIsValidToken] = useState(true);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for token_hash parameter from email link (new Supabase format)
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    // Also check for legacy parameters
    const tokenParam = searchParams.get("token");
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    // Also check URL hash for Supabase parameters
    let hashParams: URLSearchParams | null = null;
    if (typeof window !== "undefined" && window.location.hash) {
      hashParams = new URLSearchParams(window.location.hash.substring(1));
    }

    const hashAccessToken = hashParams?.get("access_token");
    const hashRefreshToken = hashParams?.get("refresh_token");
    const hashType = hashParams?.get("type");

    // Valid if we have token_hash with recovery type, or other valid token combinations
    const hasValidToken = Boolean(
      (tokenHash && type === "recovery") ||
        tokenParam ||
        (accessToken && refreshToken && type === "recovery") ||
        (hashAccessToken && hashRefreshToken && hashType === "recovery")
    );

    console.log("Reset password validation:", {
      tokenParam,
      accessToken: accessToken?.substring(0, 10) + "...",
      refreshToken: refreshToken?.substring(0, 10) + "...",
      type,
      hashAccessToken: hashAccessToken?.substring(0, 10) + "...",
      hashRefreshToken: hashRefreshToken?.substring(0, 10) + "...",
      hashType,
      hasValidToken,
    });

    setIsValidToken(hasValidToken);
  }, [searchParams]);

  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid:
        minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar,
    };
  };

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!passwordValidation.isValid) {
      setError("Password does not meet requirements");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // --- Supabase password update logic ---
    try {
      // Dynamically import supabase client (adjust path as needed)
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables not set");
      }
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Check for token_hash parameter (new Supabase format)
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      // Also check for legacy parameters
      let accessToken = searchParams.get("access_token");
      let refreshToken = searchParams.get("refresh_token");

      // Also check URL hash for Supabase parameters
      if (
        !accessToken &&
        typeof window !== "undefined" &&
        window.location.hash
      ) {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        accessToken = hashParams.get("access_token");
        refreshToken = hashParams.get("refresh_token");
      }

      if (tokenHash && type === "recovery") {
        // Use the new token_hash method for password reset
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (verifyError) {
          setError("Invalid or expired reset link: " + verifyError.message);
          setIsLoading(false);
          return;
        }

        // Now update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) {
          setError(updateError.message || "Failed to reset password");
          setIsLoading(false);
          return;
        }

        // Sign out after successful password reset for security
        await supabase.auth.signOut();

        setIsSuccess(true);
        setIsLoading(false);
      } else if (type === "recovery" && accessToken && refreshToken) {
        // Legacy method with access/refresh tokens
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError("Invalid or expired reset link: " + sessionError.message);
          setIsLoading(false);
          return;
        }

        // Now update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) {
          setError(updateError.message || "Failed to reset password");
          setIsLoading(false);
          return;
        }

        // Sign out after successful password reset for security
        await supabase.auth.signOut();

        setIsSuccess(true);
        setIsLoading(false);
      } else {
        // Fallback for other token formats
        const token = searchParams.get("token");
        if (!token && !tokenHash) {
          setError("Invalid or missing reset token");
          setIsLoading(false);
          return;
        }

        // For legacy tokens, try to update password directly
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) {
          setError(updateError.message || "Failed to reset password");
          setIsLoading(false);
          return;
        }
        setIsSuccess(true);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "An error occurred");
      } else {
        setError("An error occurred");
      }
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-gray-600">
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Request a new reset link
                </Link>
              </div>

              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Password Reset Successful
              </CardTitle>
              <CardDescription className="text-gray-600">
                Password reset successfully. Open the Kilax app to sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">K</span>
                  </div>
                </div>
                <h3 className="font-semibold text-orange-900 mb-2">
                  Next Steps
                </h3>
                <p className="text-orange-800 text-sm">
                  Your password has been successfully reset. Please open the
                  Kilax mobile app and sign in with your new password.
                </p>
              </div>

              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-600 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-200 mb-4">
                <Lock className="w-4 h-4 mr-2" />
                Password Reset
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text">
                  Create New Password
                </span>
              </h1>
              <p className="text-gray-600 text-lg">
                Enter your new password below to complete the reset process.
              </p>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-center">
                  Set New Password
                </CardTitle>
                <CardDescription className="text-center">
                  Choose a strong password to secure your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 pr-12"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 pr-12"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  {password && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Password Requirements:
                      </p>
                      <div className="space-y-1 text-xs">
                        <div
                          className={`flex items-center ${
                            passwordValidation.minLength
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3 mr-2" />
                          At least 8 characters
                        </div>
                        <div
                          className={`flex items-center ${
                            passwordValidation.hasUpperCase
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3 mr-2" />
                          One uppercase letter
                        </div>
                        <div
                          className={`flex items-center ${
                            passwordValidation.hasLowerCase
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3 mr-2" />
                          One lowercase letter
                        </div>
                        <div
                          className={`flex items-center ${
                            passwordValidation.hasNumbers
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3 mr-2" />
                          One number
                        </div>
                        <div
                          className={`flex items-center ${
                            passwordValidation.hasSpecialChar
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3 mr-2" />
                          One special character
                        </div>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <Button
                    type="submit"
                    disabled={isLoading || !password || !confirmPassword}
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating Password...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        Update Password
                      </div>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                  >
                    Back to Sign In
                  </Link>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Home
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
