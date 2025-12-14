"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";

export interface PageBreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs: PageBreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ breadcrumbs, actions }: PageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b-4 border-black dark:border-white bg-white dark:bg-black px-4">
      <SidebarTrigger className="-ml-1 border-2 border-black dark:border-white hover:bg-yellow-200 dark:hover:bg-yellow-800" />
      <Separator
        orientation="vertical"
        className="mr-2 h-6 w-[3px] bg-black dark:bg-white"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                <BreadcrumbPage className="font-bold text-black dark:text-white">
                  {item.label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {actions && (
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      )}
      <div className={actions ? "" : "ml-auto"}>
        <UserMenu />
      </div>
    </header>
  );
}
