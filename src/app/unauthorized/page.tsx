"use client";

import * as React from "react";
import { ChefHat, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";

export default function UnauthorizedPage() {
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
        },
      });
    } catch (error) {
      console.error("Sign out error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-red-400 border-4 border-black dark:border-white rotate-12 hidden md:block" />
      <div className="absolute top-32 right-20 w-16 h-16 bg-orange-400 border-4 border-black dark:border-white -rotate-12 hidden md:block" />
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-yellow-400 border-4 border-black dark:border-white rotate-45 hidden md:block" />
      <div className="absolute bottom-32 right-32 w-12 h-12 bg-pink-400 border-4 border-black dark:border-white -rotate-6 hidden md:block" />

      <Card className="w-full max-w-md neo-brutal neo-brutal-white relative">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="mx-auto flex items-center justify-center w-20 h-20 bg-red-400 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <ShieldX className="w-12 h-12 text-black" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight text-black dark:text-white">
              Access Denied
            </CardTitle>
            <CardDescription className="text-base font-medium text-black/70 dark:text-white/70">
              You don&apos;t have permission to access this application
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Info */}
          {!isPending && session?.user && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 border-2 border-black dark:border-white">
              <p className="text-sm text-black/60 dark:text-white/60 mb-1">
                Signed in as:
              </p>
              <p className="font-bold text-black dark:text-white">
                {session.user.email}
              </p>
              <p className="text-sm text-black/60 dark:text-white/60 mt-2">
                Current role:{" "}
                <span className="font-medium text-red-600 dark:text-red-400">
                  {session.user.role || "No role assigned"}
                </span>
              </p>
            </div>
          )}

          {/* Message */}
          <div className="text-center">
            <p className="text-sm text-black/60 dark:text-white/60">
              Please contact an administrator to request access to Dapur Bu
              Wikra management system.
            </p>
          </div>

          {/* Sign Out Button */}
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full h-14 text-lg font-bold bg-red-400 text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing out...</span>
              </div>
            ) : (
              <span>Sign Out & Try Another Account</span>
            )}
          </Button>

          {/* Footer */}
          <div className="text-center pt-4 border-t-2 border-black/20 dark:border-white/20">
            <div className="flex items-center justify-center gap-2 text-sm text-black/60 dark:text-white/60">
              <ChefHat className="w-4 h-4" />
              <span>Dapur Bu Wikra</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
