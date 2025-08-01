import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, useState } from "react";
import { motion } from "motion/react";

import { generateRoutes } from "@/config/routes";
import { NavigationMenuDemo } from "@/layout/navigator/index";
import { ThemeProvider } from "./components/theme-provider";
import ContextMenuDemo from "./layout/contextMenu/index";
import HeaderActions from "./layout/header/HeaderActions";

import Bread from "./layout/bread";

function App() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <div className="h-screen flex flex-row">
          <motion.header
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            className="flex-shrink-0"
          >
            <NavigationMenuDemo
              isCollapsed={isNavCollapsed}
              onToggleCollapse={setIsNavCollapsed}
            />
          </motion.header>

          {/* <ModeToggle /> */}
          <div className="flex flex-col w-full">
            <header className="h-[73px] flex items-center pl-8 pr-4 border-b border-border">
              <div className="flex items-center justify-between w-full">
                <Bread />
                <HeaderActions />
              </div>
            </header>
            <main className="flex-1 overflow-auto bg-accent">
              <ContextMenuDemo>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          页面加载中...
                        </p>
                      </div>
                    </div>
                  }
                >
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/home" replace></Navigate>}
                    />
                    {generateRoutes()}
                    {/* 404 页面可以在这里添加 */}
                  </Routes>
                </Suspense>
              </ContextMenuDemo>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
