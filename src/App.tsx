import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";

import { generateRoutes } from "@/config/routes";
import { ThemeProvider } from "./components/theme-provider";
import { SidebarLayout } from "./components/layout/sidebar-layout";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <SidebarLayout>
          <Suspense
            fallback={
              <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs">
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
              {/* 404 页面 - 必须放在最后作为catch-all路由 */}
              <Route
                path="*"
                element={
                  <div className="inset-0 flex items-center justify-center">
                    <NotFound />
                  </div>
                }
              />
              {/* <Route
                path="*"
                element={<Navigate to="/404" replace></Navigate>}
              /> */}
            </Routes>
          </Suspense>
        </SidebarLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
