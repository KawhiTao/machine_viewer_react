import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

import { ThemeProvider } from "./components/theme-provider";
import { SidebarLayout } from "./components/layout/sidebar-layout";
import NotFound from "./pages/NotFound";
import { routesConfig } from "./config/routes";

// 懒加载所有页面组件
const LoginPage = lazy(() => import("@/pages/user/Login"));
const Home = lazy(() => import("@/pages/Home"));
const Demo = lazy(() => import("@/pages/demo"));
const Review = lazy(() => import("@/pages/apps/review/Index"));
const AppMarket = lazy(() => import("@/pages/apps/AppMarket"));
const Management = lazy(() => import("@/pages/management"));
const AgentText = lazy(() => import("@/pages/agent/Text"));

// 加载中组件
const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="mt-2 text-sm text-muted-foreground">页面加载中...</p>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* 登录页面 - 独立布局 */}
            <Route path="/login" element={<LoginPage />} />

            {/* 主要应用页面 - 使用侧边栏布局 */}
            <Route
              path="/*"
              element={
                <SidebarLayout>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <Navigate
                          to={
                            routesConfig.find((r) => r.path === "/")
                              ?.redirect || "/login"
                          }
                          replace
                        />
                      }
                    />
                    <Route path="/home" element={<Home />} />
                    <Route path="/ai" element={<AgentText />} />
                    <Route path="/apps/preview" element={<Review />} />
                    <Route path="/app-market" element={<AppMarket />} />
                    <Route path="/management" element={<Management />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route
                      path="*"
                      element={
                        <div className="inset-0 flex items-center justify-center">
                          <NotFound />
                        </div>
                      }
                    />
                  </Routes>
                </SidebarLayout>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
