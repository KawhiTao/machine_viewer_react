import {
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Store,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import MonitoringMetrics from "@/components/monitoring/MonitoringMetrics";

interface HeaderActionsProps {
  className?: string;
}

export default function HeaderActions({ className }: HeaderActionsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isAppMarketActive = location.pathname === "/app-market";

  const handleSettingsClick = () => {
    // 跳转到设置页面或打开设置对话框
    console.log("打开设置");
  };

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  // 获取用户名首字母作为头像占位符
  const getInitials = (name?: string) => {
    if (!name || typeof name !== "string" || name.trim() === "") {
      return "U";
    }
    return name
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // 安全获取用户显示名称
  const getUserDisplayName = () => {
    if (!state.user) return "用户";
    return state.user.nickname || state.user.username || "用户";
  };

  // 安全获取用户邮箱
  const getUserEmail = () => {
    if (!state.user) return "";
    return state.user.email || "";
  };

  // 获取角色显示文本
  const getRoleText = (roles: string[]) => {
    if (roles.includes("admin")) return "管理员";
    if (roles.includes("user")) return "普通用户";
    return "访客";
  };

  // 获取角色颜色
  const getRoleBadgeVariant = (roles: string[]) => {
    if (roles.includes("admin")) return "destructive" as const;
    if (roles.includes("user")) return "default" as const;
    return "secondary" as const;
  };

  const handleAppMarketClick = () => {
    // 跳转到应用市场
    navigate("/app-market");
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* 监控指标 */}
      <MonitoringMetrics />

      {/* 应用市场 */}
      <Button
        // variant="ghost"
        variant={isAppMarketActive ? "default" : "ghost"}
        size="sm"
        onClick={handleAppMarketClick}
        title="应用市场"
        // className="flex items-center space-x-2"
        className={`flex items-center space-x-2 ${
          isAppMarketActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : ""
        }`}
      >
        <Store className="h-4 w-4" />
        {/*<span className="hidden sm:inline">应用市场</span>*/}
      </Button>

      {/* 通知下拉菜单 */}
      <NotificationDropdown />

      {/* 主题切换 */}
      <ModeToggle />

      {/* 设置按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSettingsClick}
        title="设置"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* 分隔线 */}
      <div className="h-4 w-px bg-border" />

      {/* 用户菜单 */}
      {state.isAuthenticated && state.user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={state.user?.avatar}
                  alt={getUserDisplayName()}
                />
                <AvatarFallback>
                  {getInitials(getUserDisplayName())}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">
                  {getUserDisplayName()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getRoleText(state.user?.roles || [])}
                </span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {getUserEmail()}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>个人资料</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center"
              onClick={handleSettingsClick}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>账户设置</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              <span>通知设置</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <div className="px-2 py-1">
              <div className="flex flex-wrap gap-1">
                {(state.user?.roles || []).map((role) => (
                  <Badge
                    key={role}
                    variant={getRoleBadgeVariant([role])}
                    className="text-xs"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {role === "admin"
                      ? "管理员"
                      : role === "user"
                        ? "用户"
                        : role}
                  </Badge>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator />

            <AlertDialog
              open={showLogoutDialog}
              onOpenChange={setShowLogoutDialog}
            >
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-red-600 flex items-center"
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowLogoutDialog(true);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认退出</AlertDialogTitle>
                  <AlertDialogDescription>
                    您确定要退出登录吗？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    确认退出
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/login")}
          className="flex items-center space-x-2"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">登录</span>
        </Button>
      )}
    </div>
  );
}
