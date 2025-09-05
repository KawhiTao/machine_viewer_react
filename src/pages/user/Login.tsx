import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GalleryVerticalEnd } from "lucide-react";
import { toast } from "sonner";

import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const location = useLocation();
  const { state } = useAuth();

  // 处理来自注册页面或登录时效的消息
  useEffect(() => {
    if (location.state?.message) {
      // 如果消息包含"过期"，使用警告提示，否则使用成功提示
      if (location.state.message.includes("过期")) {
        toast.warning(location.state.message, {
          duration: 5000,
        });
      } else {
        toast.success(location.state.message, {
          duration: 4000,
        });
      }
    }
  }, [location.state]);
  return (
    <div className="grid min-h-svh lg:grid-cols-2 relative">
      {/* 登录加载状态覆盖层 */}
      {state.isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-primary border-r-primary mx-auto"></div>
            <p className="mt-3 text-sm text-muted-foreground animate-pulse">
              正在登录...
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            视图一体化系统
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/images/background.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-contain dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
