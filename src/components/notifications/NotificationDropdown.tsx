import { useState } from "react";
import { Bell, Trash2, AlertCircle, Info, CheckCircle, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 通知类型
type NotificationType = "info" | "warning" | "success" | "error";

// 通知数据接口
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

// 通知图标映射
const notificationIcons = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  error: X,
};

// 通知颜色映射
const notificationColors = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  success: "text-green-500",
  error: "text-red-500",
};

// 模拟通知数据
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "warning",
    title: "AI检测异常",
    message: "道路施工区域检测到异常行为事件",
    time: new Date(Date.now() - 5 * 60 * 1000), // 5分钟前
    read: false,
  },
  {
    id: "2",
    type: "success",
    title: "系统更新完成",
    message: "视频解析模块已成功更新到v2.1.0",
    time: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "定期维护提醒",
    message: "系统将在今晚22:00-24:00进行例行维护",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
    read: true,
  },
  {
    id: "4",
    type: "error",
    title: "连接失败",
    message: "摄像头设备CH04连接失败，请检查网络",
    time: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3小时前
    read: false,
  },
];

interface NotificationDropdownProps {
  className?: string;
}

export default function NotificationDropdown({
  className,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  // 未读通知数量
  const unreadCount = notifications.filter((n) => !n.read).length;

  // 标记单个通知为已读
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  // 标记所有通知为已读
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  };

  // 删除单个通知
  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  // 清空所有通知
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // 格式化时间
  const formatTime = (time: Date) => {
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return time.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs text-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className="w-80 p-0">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 h-12 border-b border-border">
          <h3 className="font-semibold text-sm">通知</h3>
          <div className="h-8 flex items-center">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                全部标记为已读
              </Button>
            )}
          </div>
        </div>

        {/* 通知列表 */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">暂无通知</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const iconColor = notificationColors[notification.type];

                return (
                  <div
                    key={notification.id}
                    className={`group relative rounded-lg p-3 mb-2 transition-all duration-200 hover:bg-accent cursor-pointer ${
                      !notification.read
                        ? "bg-gradient-to-br from-primary/5 via-primary/3 to-transparent shadow-sm"
                        : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* 未读标识 - 右上角 */}
                    {!notification.read && (
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          未读
                        </span>
                      </div>
                    )}

                    {/* 删除按钮 - 右侧中间 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>

                    <div className="flex items-start gap-3">
                      {/* 通知图标 */}
                      <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* 通知内容 */}
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-start">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTime(notification.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        {notifications.length > 0 && (
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="w-full text-muted-foreground hover:text-foreground justify-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空所有通知
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
