import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { post } from "@/utils/request";
import { API_ENDPOINTS } from "@/config/api";

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  firstname?: string;
  lastname?: string;
}

export function RegisterForm({
  className,
  onSuccess,
  onBackToLogin,
  ...props
}: React.ComponentProps<"form"> & {
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}) {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    password: "",
    confirmPassword: "",
    firstname: "",
    lastname: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({});

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    // 用户名验证
    if (!formData.username.trim()) {
      newErrors.username = "用户名不能为空";
    } else if (formData.username.length < 3) {
      newErrors.username = "用户名至少需要3个字符";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "用户名只能包含字母、数字和下划线";
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = "密码不能为空";
    } else if (formData.password.length < 6) {
      newErrors.password = "密码至少需要6个字符";
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "请确认密码";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不匹配";
    }

    // 姓名验证（可选）
    if (formData.firstname && formData.firstname.length > 20) {
      newErrors.firstname = "姓氏不能超过20个字符";
    }
    if (formData.lastname && formData.lastname.length > 20) {
      newErrors.lastname = "名字不能超过20个字符";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // 提交注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    const loadingToastId = toast.loading("正在注册账户...");

    try {
      // 准备注册数据
      const registerData = {
        username: formData.username.trim(),
        password: formData.password,
        firstname: formData.firstname?.trim() || undefined,
        lastname: formData.lastname?.trim() || undefined,
      };

      // 调用注册API
      await post(API_ENDPOINTS.AUTH.REGISTER, registerData, {
        withAuth: false,
        showError: false,
      });

      // 注册成功
      toast.dismiss(loadingToastId);

      // 重置表单
      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        firstname: "",
        lastname: "",
      });

      // 调用成功回调
      onSuccess?.();
    } catch (error: unknown) {
      toast.dismiss(loadingToastId);

      let errorMessage = "注册失败，请稍后重试";

      if (error instanceof Error) {
        if ("response" in error && (error as any).response?.status === 400) {
          errorMessage = "用户名已存在或输入信息有误";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage, {
        duration: 5000,
      });

      console.error("注册失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={handleSubmit}
    >
      {/*<div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">创建新账户</h1>
        <p className="text-muted-foreground text-sm text-balance">
          填写以下信息创建您的账户
        </p>
      </div>*/}

      <div className="grid gap-4">
        {/* 用户名 */}
        <div className="grid gap-2">
          <Label htmlFor="register-username">
            用户名 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-username"
              type="text"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              disabled={isLoading}
              className={cn("pl-10", errors.username && "border-red-500")}
              autoComplete="username"
            />
          </div>
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username}</p>
          )}
        </div>

        {/* 姓名 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="register-firstname">姓氏</Label>
            <Input
              id="register-firstname"
              type="text"
              placeholder="请输入姓氏"
              value={formData.firstname}
              onChange={(e) => handleInputChange("firstname", e.target.value)}
              disabled={isLoading}
              className={cn(errors.firstname && "border-red-500")}
            />
            {errors.firstname && (
              <p className="text-sm text-red-500">{errors.firstname}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="register-lastname">名字</Label>
            <Input
              id="register-lastname"
              type="text"
              placeholder="请输入名字"
              value={formData.lastname}
              onChange={(e) => handleInputChange("lastname", e.target.value)}
              disabled={isLoading}
              className={cn(errors.lastname && "border-red-500")}
            />
            {errors.lastname && (
              <p className="text-sm text-red-500">{errors.lastname}</p>
            )}
          </div>
        </div>

        {/* 密码 */}
        <div className="grid gap-2">
          <Label htmlFor="register-password">
            密码 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="请输入密码（至少6位）"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              disabled={isLoading}
              className={cn("pl-10 pr-10", errors.password && "border-red-500")}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        {/* 确认密码 */}
        <div className="grid gap-2">
          <Label htmlFor="register-confirm-password">
            确认密码 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              disabled={isLoading}
              className={cn(
                "pl-10 pr-10",
                errors.confirmPassword && "border-red-500",
              )}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "注册中..." : "创建账户"}
        </Button>
      </div>

      <div className="text-center text-sm">
        已有账户？{" "}
        <button
          type="button"
          className="underline underline-offset-4 hover:text-primary"
          onClick={onBackToLogin}
          disabled={isLoading}
        >
          立即登录
        </button>
      </div>
    </form>
  );
}
