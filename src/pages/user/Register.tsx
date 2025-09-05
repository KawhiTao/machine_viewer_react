import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/components/register-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    // 注册成功后跳转到登录页
    navigate("/login", {
      state: { message: "注册成功！请使用新账户登录" },
    });
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/login")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回登录
          </Button>
        </div>

        <Card className="w-full shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">创建新账户</CardTitle>
            <CardDescription>
              欢迎加入我们的平台！请填写以下信息创建您的账户
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onBackToLogin={handleBackToLogin}
            />
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>注册即表示您同意我们的服务条款和隐私政策</p>
        </div>
      </div>
    </div>
  );
}
