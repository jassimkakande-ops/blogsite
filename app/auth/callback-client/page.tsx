"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getRedirectCookie, clearRedirectCookie } from "@/lib/utils"

export default function AuthCallbackClientPage() {
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = () => {
      // Read redirect path from cookie or query param
      let redirectPath = getRedirectCookie();
      if (!redirectPath) {
        const urlParams = new URLSearchParams(window.location.search);
        redirectPath = urlParams.get('redirect');
      }
      
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        // Clear the cookie
        if (redirectPath) {
          clearRedirectCookie();
          console.log('Callback-client: Redirecting to:', redirectPath);
          router.push(redirectPath);
        } else {
          console.log('Callback-client: No redirect path, going to home');
          router.push('/');
        }
      }, 200); // 200ms delay
    }

    handleRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  )
}
