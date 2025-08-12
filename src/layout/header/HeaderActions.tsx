import { Bell, Settings, User, LogOut, ChevronDown, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";

import { ModeToggle } from "@/components/mode-toggle";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import MonitoringMetrics from "@/components/monitoring/MonitoringMetrics";

interface HeaderActionsProps {
  className?: string;
}

export default function HeaderActions({ className }: HeaderActionsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isAppMarketActive = location.pathname === "/app-market";
  const handleSettingsClick = () => {
    // 跳转到设置页面或打开设置对话框
    console.log("打开设置");
  };

  const handleLogout = () => {
    // 处理退出登录逻辑
    console.log("退出登录");
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center space-x-2 hover:bg-accent"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="/api/placeholder/32/32" alt="用户头像" />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium">中控信息</span>
              <span className="text-xs text-muted-foreground">管理员</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>我的账户</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>个人资料</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>账户设置</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            <span>通知设置</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-red-600 flex items-center"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
