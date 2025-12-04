"use client";

import { ChefHat, Clock, ShoppingCart, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ActionCardSkeleton,
  WelcomeCardSkeleton,
} from "@/components/ui/page-loading";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";
import { useSession } from "@/lib/auth-client";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role;
  const userName = session?.user?.name || session?.user?.email || "User";

  // Check if user has access to orders (admin or chef)
  const canAccessOrders = userRole === "admin" || userRole === "chef";

  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b-4 border-black dark:border-white bg-white dark:bg-black px-4">
        <SidebarTrigger className="-ml-1 border-2 border-black dark:border-white hover:bg-yellow-200 dark:hover:bg-yellow-800" />
        <Separator
          orientation="vertical"
          className="mr-2 h-6 w-[3px] bg-black dark:bg-white"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-bold text-black dark:text-white">
                Home
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <UserMenu />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 space-y-6 p-6">
        {/* Welcome Section - Show skeleton when loading */}
        {isPending ? (
          <WelcomeCardSkeleton />
        ) : (
          <Card className="border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 bg-yellow-400 border-4 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  <ChefHat className="w-10 h-10 text-black" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black text-black dark:text-white">
                    Welcome, {userName}!
                  </CardTitle>
                  <CardDescription className="text-lg font-medium text-black/70 dark:text-white/70">
                    Dapur Bu Wikra - Catering Management System
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
        )}

        {/* Role-based Content */}
        {isPending ? (
          /* Loading State - Using reusable ActionCardSkeleton */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ActionCardSkeleton />
            <ActionCardSkeleton />
          </div>
        ) : canAccessOrders ? (
          /* Admin/Chef View */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card
              className="border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer bg-blue-100 dark:bg-blue-900"
              onClick={() => router.push("/orders")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-400 border-2 border-black dark:border-white">
                    <ShoppingCart className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-black dark:text-white">
                      Order Management
                    </CardTitle>
                    <CardDescription className="text-black/60 dark:text-white/60">
                      Manage catering orders
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full font-bold bg-blue-400 text-black border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                  Go to Orders →
                </Button>
              </CardContent>
            </Card>

            {userRole === "admin" && (
              <Card
                className="border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer bg-yellow-100 dark:bg-yellow-900"
                onClick={() => router.push("/admin/users")}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-yellow-400 border-2 border-black dark:border-white">
                      <Users className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-black dark:text-white">
                        User Management
                      </CardTitle>
                      <CardDescription className="text-black/60 dark:text-white/60">
                        Manage user roles
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full font-bold bg-yellow-400 text-black border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
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
                successfully. An administrator will review your account and
                assign appropriate permissions.
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
    </>
  );
}
