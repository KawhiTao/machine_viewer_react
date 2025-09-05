import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { login, state, clearError } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 从localStorage加载记住的用户名
  useEffect(() => {
    const remembered = localStorage.getItem("remember_me");
    const savedUsername = localStorage.getItem("saved_username");

    if (remembered === "true" && savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // 清除之前的错误

    // 处理"记住我"功能
    if (rememberMe) {
      localStorage.setItem("remember_me", "true");
      localStorage.setItem("saved_username", username);
    } else {
      localStorage.removeItem("remember_me");
      localStorage.removeItem("saved_username");
    }

    try {
      await login({
        username,
        password,
        grant_type: "password",
        scope: "read write",
        rememberMe, // 传递记住我状态
      });
    } catch (error) {
      // 错误已经在context和toast中处理
      console.error("登录失败:", error);
    }
  };

  // GitHub登录暂未实现
  const handleGitHubLogin = () => {
    console.log("GitHub登录功能待实现");
  };

  return (
    <form
      className={cn(
        "flex flex-col gap-6 transition-opacity duration-200",
        state.isLoading ? "opacity-95" : "opacity-100",
        className,
      )}
      {...props}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">登录您的账户</h1>
        <p className="text-muted-foreground text-sm text-balance">
          输入您的用户名和密码以登录系统
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            type="text"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={state.isLoading}
            required
            autoComplete="username"
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">密码</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              忘记密码？
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={state.isLoading}
              required
              className="pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowPassword(!showPassword)}
              disabled={state.isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* 记住密码选项 */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={state.isLoading}
          />
          <Label
            htmlFor="remember-me"
            className="text-sm font-normal cursor-pointer select-none"
          >
            记住我
            {/*<span className="text-xs text-muted-foreground ml-1">
              (保存用户名)
            </span>*/}
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={state.isLoading}>
          {state.isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current border-r-current mr-2"></div>
          )}
          {state.isLoading ? "登录中..." : "登录"}
        </Button>

        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            或继续使用
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => console.log("第三方登录待实现")}
          disabled={state.isLoading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-4 h-4 mr-2"
          >
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              fill="currentColor"
            />
          </svg>
          第三方登录
        </Button>
      </div>
      <div className="text-center text-sm">
        还没有账户？{" "}
        <Link
          to="/register"
          className="underline underline-offset-4 hover:text-primary"
        >
          立即注册
        </Link>
      </div>
    </form>
  );
}
