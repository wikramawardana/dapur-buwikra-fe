"use client";

import { ChefHat, Clock, ShoppingCart, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role;
  const userName = session?.user?.name || session?.user?.email || "User";

  const canAccessOrders = userRole === "admin" || userRole === "chef";

  if (isPending || !session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-3 sm:space-y-6 sm:p-6">
      {/* Welcome Section */}
      <Card className="border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 border-4 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
              <ChefHat className="w-7 h-7 sm:w-10 sm:h-10 text-black" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-3xl font-black text-black dark:text-white">
                Welcome, {userName}!
              </CardTitle>
              <CardDescription className="text-sm sm:text-lg font-medium text-black/70 dark:text-white/70">
                Dapur Bu Wikra - Catering Management System
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-medium text-black/60 dark:text-white/60">
              Your role:
            </span>
            <span
              className={`px-3 py-1 text-sm font-bold border-2 border-black dark:border-white ${
                userRole === "admin"
                  ? "bg-red-400"
                  : userRole === "chef"
                    ? "bg-green-400"
                    : "bg-gray-300"
              } text-black`}
            >
              {userRole || "user"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Role-based Content */}
      {canAccessOrders ? (
        /* Admin/Chef View */
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
          <Card
            className="border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer bg-blue-100 dark:bg-blue-900"
            onClick={() => router.push("/orders")}
          >
            <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-400 border-2 border-black dark:border-white">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-black dark:text-white">
                    Order Management
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                    Manage catering orders
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <Button className="w-full font-bold text-sm sm:text-base bg-blue-400 text-black border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                Go to Orders →
              </Button>
            </CardContent>
          </Card>

          {userRole === "admin" && (
            <Card
              className="border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer bg-yellow-100 dark:bg-yellow-900"
              onClick={() => router.push("/admin/users")}
            >
              <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 border-2 border-black dark:border-white">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-black dark:text-white">
                      User Management
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                      Manage user roles
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                <Button className="w-full font-bold text-sm sm:text-base bg-yellow-400 text-black border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                  Manage Users →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Regular User View - Pending Access */
        <Card className="border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-orange-100 dark:bg-orange-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-400 border-2 border-black dark:border-white">
                <Clock className="w-6 h-6 text-black" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-black dark:text-white">
                  Access Pending
                </CardTitle>
                <CardDescription className="text-black/60 dark:text-white/60">
                  Your account is awaiting role assignment
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-black/70 dark:text-white/70">
              Thank you for signing up! Your account has been created
              successfully. An administrator will review your account and assign
              appropriate permissions.
            </p>
            <div className="p-4 bg-yellow-200 dark:bg-yellow-800 border-2 border-black dark:border-white">
              <p className="text-sm font-medium text-black dark:text-white">
                💡 <strong>What happens next?</strong>
              </p>
              <ul className="mt-2 text-sm text-black/80 dark:text-white/80 list-disc list-inside space-y-1">
                <li>An admin will review your account</li>
                <li>
                  You&apos;ll be assigned as &quot;chef&quot; or
                  &quot;admin&quot; role
                </li>
                <li>
                  Once assigned, you&apos;ll have access to order management
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
