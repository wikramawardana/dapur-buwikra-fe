"use client";

import { ChefHat } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn, useSession } from "@/lib/auth-client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = React.useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/orders";

  // Redirect if already logged in
  React.useEffect(() => {
    if (!isPending && session) {
      window.location.href = callbackUrl;
    }
  }, [session, isPending, callbackUrl]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 border-4 border-black dark:border-white rotate-12 hidden md:block" />
      <div className="absolute top-32 right-20 w-16 h-16 bg-pink-400 border-4 border-black dark:border-white -rotate-12 hidden md:block" />
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-cyan-400 border-4 border-black dark:border-white rotate-45 hidden md:block" />
      <div className="absolute bottom-32 right-32 w-12 h-12 bg-green-400 border-4 border-black dark:border-white -rotate-6 hidden md:block" />

      <Card className="w-full max-w-md neo-brutal neo-brutal-white relative">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="mx-auto flex items-center justify-center w-20 h-20 bg-blue-400 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <ChefHat className="w-12 h-12 text-black" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight text-black dark:text-white">
              Dapur Bu Wikra
            </CardTitle>
            <CardDescription className="text-base font-medium text-black/70 dark:text-white/70">
              Catering Management System
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Welcome message */}
          <div className="text-center">
            <p className="text-sm text-black/60 dark:text-white/60">
              Sign in to manage your orders and customers
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-14 text-lg font-bold bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <GoogleIcon className="w-6 h-6" />
                <span>Continue with Google</span>
              </div>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-black/20 dark:border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-black px-2 text-black/50 dark:text-white/50 font-bold">
                Secure Login
              </span>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-center text-xs text-black/50 dark:text-white/50">
            By signing in, you agree to our terms and conditions.
            <br />
            Only authorized users can access this system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md neo-brutal neo-brutal-white relative">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto flex items-center justify-center w-20 h-20 bg-blue-400 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <ChefHat className="w-12 h-12 text-black" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight text-black dark:text-white">
              Dapur Bu Wikra
            </CardTitle>
            <CardDescription className="text-base font-medium text-black/70 dark:text-white/70">
              Loading...
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
