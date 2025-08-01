"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import Bread from "@/layout/bread";
import HeaderActions from "@/layout/header/HeaderActions";
import ContextMenuDemo from "@/layout/contextMenu/index";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <SidebarProvider className="!min-h-screen !max-h-screen overflow-hidden">
      <AppSidebar />
      {/*<SidebarInset className="h-screen max-h-screen overflow-hidden flex flex-col !m-0">*/}
      <SidebarInset
        className="overflow-hidden flex flex-col m-2 ml-0 md:m-2 md:ml-0 rounded-xl shadow-sm"
        style={{
          height: "calc(100vh - 1rem)",
          maxHeight: "calc(100vh - 1rem)",
        }}
      >
        <header className="h-[73px] flex items-center pl-4 pr-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Bread />
            </div>
            <HeaderActions />
          </div>
        </header>
        <main className="flex-1 overflow-hidden bg-accent min-h-0">
          <ScrollArea className="h-full">
            <ContextMenuDemo>{children}</ContextMenuDemo>
          </ScrollArea>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
