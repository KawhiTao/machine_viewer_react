import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

import { ThemeProvider } from "./components/theme-provider";
import { SidebarLayout } from "./components/layout/sidebar-layout";
import { AuthProvider } from "./contexts/AuthContext";
import {
  AdminRouteGuard,
  UserRouteGuard,
  ProtectedRoute,
  PublicRoute,
} from "./components/guards/RouteGuard";
import NotFound from "./pages/NotFound";
import { routesConfig } from "./config/routes";
import { Toaster } from "./components/ui/sonner";

// 懒加载所有页面组件
const LoginPage = lazy(() => import("@/pages/user/Login"));
const RegisterPage = lazy(() => import("@/pages/user/Register"));
const Home = lazy(() => import("@/pages/Home"));
const Demo = lazy(() => import("@/pages/demo"));
const Review = lazy(() => import("@/pages/apps/review/index"));
const AppMarket = lazy(() => import("@/pages/apps/AppMarket"));
const Management = lazy(() => import("@/pages/management"));
const AgentText = lazy(() => import("@/pages/agent/Text"));
const TokenExpiredTest = lazy(() => import("@/pages/test/TokenExpiredTest"));

// 加载中组件 - 优化减少闪烁
const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm transition-opacity duration-200">
    <div className="text-center">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-transparent border-t-primary border-r-primary mx-auto"></div>
      <p className="mt-3 text-xs text-muted-foreground/70 animate-pulse">
        加载中...
      </p>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* 登录页面 - 公开路由，无需认证 */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              {/* 注册页面 - 公开路由，无需认证 */}
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />

              {/* 主要应用页面 - 受保护的路由，需要认证 */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <SidebarLayout>
                      <Routes>
                        <Route
                          path="/"
                          element={
                            <Navigate
                              to={
                                routesConfig.find((r) => r.path === "/")
                                  ?.redirect || "/home"
                              }
                              replace
                            />
                          }
                        />

                        {/* 普通用户可访问的页面 */}
                        <Route
                          path="/home"
                          element={
                            <UserRouteGuard>
                              <Home />
                            </UserRouteGuard>
                          }
                        />
                        <Route
                          path="/ai"
                          element={
                            <UserRouteGuard>
                              <AgentText />
                            </UserRouteGuard>
                          }
                        />
                        <Route
                          path="/apps/preview"
                          element={
                            <UserRouteGuard>
                              <Review />
                            </UserRouteGuard>
                          }
                        />
                        <Route
                          path="/app-market"
                          element={
                            <UserRouteGuard>
                              <AppMarket />
                            </UserRouteGuard>
                          }
                        />
                        <Route
                          path="/demo"
                          element={
                            <UserRouteGuard>
                              <Demo />
                            </UserRouteGuard>
                          }
                        />

                        {/* 测试页面 - 仅开发环境使用 */}
                        <Route
                          path="/test/token-expired"
                          element={
                            <UserRouteGuard>
                              <TokenExpiredTest />
                            </UserRouteGuard>
                          }
                        />

                        {/* 仅管理员可访问的页面 */}
                        <Route
                          path="/management"
                          element={
                            <AdminRouteGuard>
                              <Management />
                            </AdminRouteGuard>
                          }
                        />

                        {/* 404页面 - 也需要登录后才能看到 */}
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
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
          <Toaster position="top-center" />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
