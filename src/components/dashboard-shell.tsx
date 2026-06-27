"use client";

import {
  ChefHat,
  DollarSign,
  Home,
  LayoutDashboard,
  MapPin,
  PanelLeft,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserMenu } from "@/components/user-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const dashboardItem = {
  title: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
  group: "menu" as const,
};

const menuItems = [
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    roles: ["admin", "chef", "user"],
    group: "menu" as const,
  },
];

const adminMenuItems = [
  {
    title: "Menus",
    href: "/admin/menus",
    icon: UtensilsCrossed,
    roles: ["admin", "chef"],
    group: "admin" as const,
  },
  {
    title: "Price List",
    href: "/admin/pricelist",
    icon: DollarSign,
    roles: ["admin"],
    group: "admin" as const,
  },
  {
    title: "Pickup Points",
    href: "/admin/pickup-points",
    icon: MapPin,
    roles: ["admin"],
    group: "admin" as const,
  },
  // Hidden: user management is now centralized via Auth
  // {
  //   title: "User Management",
  //   href: "/admin/users",
  //   icon: Shield,
  //   roles: ["admin"],
  //   group: "admin" as const,
  // },
];

function getPageTitle(pathname: string): string {
  const allItems = [dashboardItem, ...menuItems, ...adminMenuItems];
  const match = allItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.title ?? "Dashboard";
}

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole || ""),
  );

  const filteredAdminMenuItems = adminMenuItems.filter((item) =>
    item.roles.includes(userRole || ""),
  );

  const allNavItems = [dashboardItem, ...filteredMenuItems];
  const pageTitle = getPageTitle(pathname);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function NavLinks({ inSheet = false }: { inSheet?: boolean }) {
    const showCollapsed = collapsed && !inSheet;

    return (
      <ScrollArea className="h-full pt-4 pb-2">
        {!showCollapsed && (
          <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 border-b border-black/10 dark:border-white/10 mx-2 mb-2">
            Menu
          </p>
        )}
        <nav className="flex flex-col gap-1 px-2">
          {allNavItems.map((item) => {
            const active = isActive(item.href);
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => inSheet && setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all border-2",
                  active
                    ? "bg-yellow-400 text-black border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    : "text-black/60 dark:text-white/60 border-transparent hover:border-black dark:hover:border-white hover:bg-yellow-100 dark:hover:bg-yellow-900",
                  showCollapsed && "justify-center px-2",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!showCollapsed && <span>{item.title}</span>}
              </Link>
            );

            if (showCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        {filteredAdminMenuItems.length > 0 && (
          <>
            {!showCollapsed && (
              <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 border-b border-black/10 dark:border-white/10 mx-2 mb-2">
                Administration
              </p>
            )}
            {showCollapsed && (
              <div className="my-2 mx-2 h-px bg-black/10 dark:bg-white/10" />
            )}
            <nav className="flex flex-col gap-1 px-2">
              {filteredAdminMenuItems.map((item) => {
                const active = isActive(item.href);
                const linkContent = (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={() => inSheet && setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all border-2",
                      active
                        ? "bg-yellow-400 text-black border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        : "text-black/60 dark:text-white/60 border-transparent hover:border-black dark:hover:border-white hover:bg-yellow-100 dark:hover:bg-yellow-900",
                      showCollapsed && "justify-center px-2",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!showCollapsed && <span>{item.title}</span>}
                  </Link>
                );

                if (showCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  );
                }
                return linkContent;
              })}
            </nav>
          </>
        )}

        {/* Back to Home */}
        <div className="px-2 pt-2 mt-auto border-t border-black/10 dark:border-white/10 mx-2">
          {collapsed && !inSheet ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  prefetch={false}
                  className="flex items-center justify-center px-2 py-2.5 text-sm font-bold transition-all border-2 border-transparent text-black/60 dark:text-white/60 hover:border-black dark:hover:border-white hover:bg-yellow-100 dark:hover:bg-yellow-900"
                >
                  <Home className="h-4 w-4 shrink-0" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Back to Home</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/"
              prefetch={false}
              onClick={() => inSheet && setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all border-2 border-transparent text-black/60 dark:text-white/60 hover:border-black dark:hover:border-white hover:bg-yellow-100 dark:hover:bg-yellow-900"
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Back to Home</span>
            </Link>
          )}
        </div>
      </ScrollArea>
    );
  }

  if (isMobile) {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="flex h-screen flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b-4 border-black dark:border-white bg-white dark:bg-black px-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 border-2 border-black dark:border-white hover:bg-yellow-200 shrink-0"
              onClick={() => setMobileOpen(true)}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <div className="mr-2 h-6 w-[3px] shrink-0 bg-black dark:bg-white" />
            <h2 className="text-sm font-black text-black dark:text-white">
              {pageTitle}
            </h2>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-[#f5f5f5] dark:bg-[#1a1a1a]">
            {children}
          </main>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-72 border-r-4 border-black dark:border-white bg-white dark:bg-black p-0 [&>button]:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Main navigation menu</SheetDescription>
            </SheetHeader>
            <div className="flex h-16 items-center border-b-4 border-black dark:border-white px-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 font-black text-black dark:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <ChefHat className="h-5 w-5 text-black" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm leading-tight">Dapur Bu Wikra</span>
                  <span className="text-[10px] font-medium text-black/50 dark:text-white/50 leading-tight">
                    Catering Management
                  </span>
                </div>
              </Link>
            </div>
            <NavLinks inSheet />
          </SheetContent>
        </Sheet>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "grid h-screen grid-rows-[4rem_1fr] transition-all duration-300",
          collapsed ? "grid-cols-[60px_1fr]" : "grid-cols-[256px_1fr]",
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center border-r-4 border-b-4 border-black dark:border-white bg-white dark:bg-black px-3">
          {!collapsed ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 font-black text-black dark:text-white"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <ChefHat className="h-5 w-5 text-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm leading-tight">Dapur Bu Wikra</span>
                <span className="text-[10px] font-medium text-black/50 dark:text-white/50 leading-tight">
                  Catering Management
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/dashboard" className="mx-auto">
              <div className="flex h-9 w-9 items-center justify-center bg-blue-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <ChefHat className="h-5 w-5 text-black" />
              </div>
            </Link>
          )}
        </div>

        {/* Main header */}
        <header className="flex items-center gap-2 border-b-4 border-black dark:border-white bg-white dark:bg-black px-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 border-2 border-black dark:border-white hover:bg-yellow-200 shrink-0"
                onClick={() => setCollapsed(!collapsed)}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
          <div className="mr-2 h-6 w-[3px] shrink-0 bg-black dark:bg-white" />
          <h2 className="text-sm font-black text-black dark:text-white">
            {pageTitle}
          </h2>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>

        {/* Sidebar nav */}
        <div className="border-r-4 border-black dark:border-white bg-white dark:bg-black overflow-hidden">
          <NavLinks />
        </div>

        {/* Main content */}
        <main className="overflow-auto bg-[#f5f5f5] dark:bg-[#1a1a1a]">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
