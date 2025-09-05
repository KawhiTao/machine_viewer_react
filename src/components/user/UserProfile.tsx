import React from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  LogOut,
  Shield,
  UserCircle,
  Mail,
  Building,
} from "lucide-react";

interface UserProfileProps {
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

export const UserProfile: React.FC<UserProfileProps> = ({
  showDetails = false,
  size = "md",
}) => {
  const { state, logout } = useAuth();

  if (!state.isAuthenticated || !state.user) {
    return null;
  }

  const { user } = state;
  const avatarSize =
    size === "sm" ? "w-6 h-6" : size === "lg" ? "w-12 h-12" : "w-8 h-8";

  // 获取用户名首字母作为头像占位符
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  const handleLogout = () => {
    const confirmed = window.confirm("确定要退出登录吗？");
    if (confirmed) {
      logout();
    }
  };

  if (showDetails) {
    // 详细信息展示模式
    return (
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage
              src={user.avatar}
              alt={user.nickname || user.username}
            />
            <AvatarFallback className="text-lg">
              {getInitials(user.nickname || user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-lg">
                {user.nickname || user.username}
              </h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
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

            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {user.email}
              </div>
              {user.department && (
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  {user.department}
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                设置
              </Button>
              <Button size="sm" variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 下拉菜单模式
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-auto p-2 hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex items-center space-x-2">
            <Avatar className={avatarSize}>
              <AvatarImage
                src={user.avatar}
                alt={user.nickname || user.username}
              />
              <AvatarFallback>
                {getInitials(user.nickname || user.username)}
              </AvatarFallback>
            </Avatar>
            {size !== "sm" && (
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium leading-none">
                  {user.nickname || user.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getRoleText(user.roles)}
                </span>
              </div>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.nickname || user.username}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <UserCircle className="mr-2 h-4 w-4" />
          <span>个人资料</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>设置</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-1">
          <div className="flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <Badge
                key={role}
                variant={getRoleBadgeVariant([role])}
                className="text-xs"
              >
                {role === "admin" ? "管理员" : role === "user" ? "用户" : role}
              </Badge>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 简单的用户头像组件
export const UserAvatar: React.FC<{ size?: "sm" | "md" | "lg" }> = ({
  size = "md",
}) => {
  const { state } = useAuth();

  if (!state.user) return null;

  const avatarSize =
    size === "sm" ? "w-6 h-6" : size === "lg" ? "w-12 h-12" : "w-8 h-8";
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={avatarSize}>
      <AvatarImage
        src={state.user.avatar}
        alt={state.user.nickname || state.user.username}
      />
      <AvatarFallback>
        {getInitials(state.user.nickname || state.user.username)}
      </AvatarFallback>
    </Avatar>
  );
};

// 用户角色标签组件
export const UserRoleBadges: React.FC = () => {
  const { state } = useAuth();

  if (!state.user) return null;

  const getRoleBadgeVariant = (role: string) => {
    if (role === "admin") return "destructive" as const;
    if (role === "user") return "default" as const;
    return "secondary" as const;
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "管理员";
      case "user":
        return "用户";
      default:
        return role;
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {state.user.roles.map((role) => (
        <Badge
          key={role}
          variant={getRoleBadgeVariant(role)}
          className="text-xs"
        >
          <Shield className="w-3 h-3 mr-1" />
          {getRoleDisplayName(role)}
        </Badge>
      ))}
    </div>
  );
};

export default UserProfile;
