"use client";

import {
  DollarSign,
  Home,
  LayoutDashboard,
  MapPin,
  PanelLeft,
  Receipt,
  ShoppingCart,
  Smartphone,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navigation = [
  {
    title: "Ringkasan",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "Operasional",
    roles: ["admin", "chef", "user"],
  },
  {
    title: "Pesanan",
    href: "/orders",
    icon: ShoppingCart,
    group: "Operasional",
    roles: ["admin", "chef", "user"],
  },
  {
    title: "Biaya belanja",
    href: "/shopping-costs",
    icon: Receipt,
    group: "Operasional",
    roles: ["admin", "chef"],
  },
  {
    title: "Menu & Jejak Rasa",
    href: "/admin/menus",
    icon: UtensilsCrossed,
    group: "Konten & pengaturan",
    roles: ["admin", "chef"],
  },
  {
    title: "Paket & harga",
    href: "/admin/pricelist",
    icon: DollarSign,
    group: "Konten & pengaturan",
    roles: ["admin"],
  },
  {
    title: "Lokasi pengantaran",
    href: "/admin/pickup-points",
    icon: MapPin,
    group: "Konten & pengaturan",
    roles: ["admin"],
  },
  {
    title: "ShopeePay",
    href: "/admin/shopeepay",
    icon: Smartphone,
    group: "Konten & pengaturan",
    roles: ["admin"],
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Dapur Bu Wikra — Ringkasan"
      className="cms-brand"
    >
      {compact ? (
        <span>
          BW<span className="text-primary">.</span>
        </span>
      ) : (
        <>
          <span className="text-xs font-semibold text-muted-foreground">
            Dapur
          </span>
          <span className="text-xl font-black tracking-tight">
            Bu Wikra<span className="text-primary">.</span>
          </span>
        </>
      )}
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const items = navigation.filter((item) =>
    item.roles.includes(session?.user?.role || ""),
  );
  const pageTitle =
    navigation.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.title ?? "Dapur Bu Wikra";

  function Nav({ mobile = false }: { mobile?: boolean }) {
    const compact = collapsed && !mobile;
    return (
      <nav aria-label="Navigasi utama" className="cms-navigation">
        {["Operasional", "Konten & pengaturan"].map((group) => (
          <div key={group} className="space-y-2">
            {!compact && items.some((item) => item.group === group) && (
              <p className="cms-nav-group">{group}</p>
            )}
            {items
              .filter((item) => item.group === group)
              .map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    aria-label={item.title}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "cms-nav-link",
                      active && "cms-nav-active",
                      compact && "justify-center",
                    )}
                  >
                    <item.icon size={20} strokeWidth={1.8} aria-hidden="true" />
                    {!compact && <span>{item.title}</span>}
                  </Link>
                );
                return compact ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={item.href}>{link}</div>
                );
              })}
          </div>
        ))}
        <Link
          href="/"
          prefetch={false}
          aria-label="Buka halaman utama"
          className={cn("cms-nav-link mt-auto", compact && "justify-center")}
        >
          <Home size={20} strokeWidth={1.8} aria-hidden="true" />
          {!compact && <span>Halaman utama</span>}
        </Link>
      </nav>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("cms-shell", collapsed && "cms-collapsed")}>
        <a href="#cms-content" className="cms-skip-link">
          Lewati ke konten
        </a>
        <aside className="cms-sidebar hidden md:flex">
          <div className="cms-brand-area">
            <Brand compact={collapsed} />
          </div>
          <Nav />
        </aside>
        <div className="cms-workspace">
          <header className="cms-header">
            <Button
              variant="outline"
              size="icon"
              className="hidden md:inline-flex"
              aria-label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(!collapsed)}
            >
              <PanelLeft aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-label="Buka navigasi"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <PanelLeft aria-hidden="true" />
            </Button>
            <span className="font-bold text-sm sm:text-base">{pageTitle}</span>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </header>
          <main id="cms-content" tabIndex={-1} className="cms-content">
            {children}
          </main>
        </div>
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="cms-mobile-sidebar w-72 p-0 [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigasi</SheetTitle>
            <SheetDescription>Menu pengelolaan Dapur Bu Wikra</SheetDescription>
          </SheetHeader>
          <div className="cms-brand-area justify-between">
            <Brand />
            <Button
              variant="outline"
              size="icon"
              aria-label="Tutup navigasi"
              onClick={() => setMobileOpen(false)}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <Nav mobile />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
