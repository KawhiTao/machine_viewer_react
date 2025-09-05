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
import { Button } from "@/components/ui/button";
import Bread from "@/layout/bread";
import HeaderActions from "@/layout/header/HeaderActions";
import { motion, AnimatePresence } from "motion/react";
// import ContextMenuDemo from "@/layout/contextMenu/index";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  // 返回顶部相关状态和引用
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [showScrollToTop, setShowScrollToTop] = React.useState(false);

  // 返回顶部函数
  const scrollToTop = React.useCallback(() => {
    try {
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement;
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } catch (error) {
      console.warn("滚动到顶部失败:", error);
    }
  }, []);

  // 监听滚动位置，控制返回顶部按钮显示
  React.useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement;
    if (!scrollContainer) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = scrollContainer.scrollTop;
          const shouldShow = scrollTop > 300;
          setShowScrollToTop(shouldShow);
          ticking = false;
        });
        ticking = true;
      }
    };

    // 初始检查
    handleScroll();

    // 添加滚动事件监听器
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <SidebarProvider
      defaultOpen={true}
      className="!min-h-screen !max-h-screen overflow-hidden"
    >
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
        <main className="flex-1 overflow-hidden bg-accent min-h-0 relative">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            {/*<ContextMenuDemo>{children}</ContextMenuDemo>*/}
            {children}
          </ScrollArea>

          {/* 返回顶部按钮 */}
          <AnimatePresence>
            {showScrollToTop && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="fixed bottom-12 right-12 z-50"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={scrollToTop}
                  className="h-12 w-12 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
