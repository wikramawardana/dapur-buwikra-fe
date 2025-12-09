"use client";

import {
  ChefHat,
  DollarSign,
  Home,
  Shield,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

// Dashboard is accessible to all authenticated users
const dashboardItem = {
  title: "Dashboard",
  url: "/dashboard",
  icon: Home,
};

// Orders accessible to all authenticated users (backend filters by email for users)
const menuItems = [
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
    roles: ["admin", "chef", "user"],
  },
];

const adminMenuItems = [
  {
    title: "Menus",
    url: "/admin/menus",
    icon: UtensilsCrossed,
    roles: ["admin", "chef"],
  },
  {
    title: "Price List",
    url: "/admin/pricelist",
    icon: DollarSign,
    roles: ["admin"],
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: Shield,
    roles: ["admin"],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole || ""),
  );

  const filteredAdminMenuItems = adminMenuItems.filter((item) =>
    item.roles.includes(userRole || ""),
  );

  return (
    <Sidebar collapsible="icon" className="bg-white dark:bg-black">
      <SidebarHeader className="border-b-2 border-black dark:border-white pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent hover:border-transparent"
            >
              <a href="/">
                <div className="flex aspect-square size-10 items-center justify-center border-2 border-black dark:border-white bg-blue-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                  <ChefHat className="size-6 text-black" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-black dark:text-white">
                    Dapur Bu Wikra
                  </span>
                  <span className="truncate text-xs font-medium text-black/70 dark:text-white/70">
                    Catering Management
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-white dark:bg-black">
        <SidebarGroup>
          <SidebarGroupLabel className="border-b border-black/20 dark:border-white/20 mb-2">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {/* Dashboard - always visible */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === dashboardItem.url ||
                    pathname.startsWith(`${dashboardItem.url}/`)
                  }
                  className={
                    pathname === dashboardItem.url ||
                    pathname.startsWith(`${dashboardItem.url}/`)
                      ? "border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
                      : "border-2 border-transparent hover:border-black dark:hover:border-white"
                  }
                >
                  <a href={dashboardItem.url}>
                    <dashboardItem.icon className="size-4" />
                    <span className="font-semibold">{dashboardItem.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Role-restricted menu items */}
              {filteredMenuItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={
                        isActive
                          ? "border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
                          : "border-2 border-transparent hover:border-black dark:hover:border-white"
                      }
                    >
                      <a href={item.url}>
                        <item.icon className="size-4" />
                        <span className="font-semibold">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdminMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="border-b border-black/20 dark:border-white/20 mb-2">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {filteredAdminMenuItems.map((item) => {
                  const isActive =
                    pathname === item.url ||
                    pathname.startsWith(`${item.url}/`);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={
                          isActive
                            ? "border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
                            : "border-2 border-transparent hover:border-black dark:hover:border-white"
                        }
                      >
                        <a href={item.url}>
                          <item.icon className="size-4" />
                          <span className="font-semibold">{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarRail className="hover:after:bg-black dark:hover:after:bg-white after:w-[3px]" />
    </Sidebar>
  );
}
