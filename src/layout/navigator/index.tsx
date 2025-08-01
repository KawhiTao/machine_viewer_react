"use client";

import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { CircleHelpIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { getNavigationRoutes } from "@/config/routes";
import { Button } from "@/components/ui/button";

interface NavigationMenuDemoProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export function NavigationMenuDemo({
  isCollapsed = false,
  onToggleCollapse,
}: NavigationMenuDemoProps) {
  const [internalCollapsed, setInternalCollapsed] = React.useState(isCollapsed);

  const collapsed = onToggleCollapse ? isCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  };
  const location = useLocation();
  const navigationItems = getNavigationRoutes();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div
      className={`${collapsed ? "w-20" : "w-64"} bg-card border-r border-border flex flex-col h-full transition-all duration-300 relative`}
      style={{
        boxShadow:
          "2px 0 8px rgba(0, 0, 0, 0.04), 1px 0 4px rgba(0, 0, 0, 0.03), 0px 0 2px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* 标题区域 */}
      <div className="h-[73px] flex items-center px-4 border-b border-border">
        {collapsed ? (
          <div className="flex justify-center w-full">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                视
              </span>
            </div>
          </div>
        ) : (
          <h1 className="text-xl font-bold text-foreground">视图一体化系统</h1>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-2">
        <ul className="space-y-0">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center rounded-md text-sm font-medium transition-colors group relative",
                    "hover:bg-accent hover:text-accent-foreground",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                    collapsed
                      ? "w-12 h-12 p-0 justify-center items-center flex"
                      : "gap-3 px-4 py-4",
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.title}</span>}

                  {/* 折叠状态下的悬浮提示 */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 底部区域 */}
      <div className="p-2 border-t border-border">
        {collapsed ? (
          <div className="flex flex-col items-center space-y-1">
            <Link
              to="/help"
              className={cn(
                "flex items-center justify-center w-12 h-12 p-0 rounded-md text-sm font-medium transition-colors group relative",
                "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
              )}
              title="帮助"
            >
              <CircleHelpIcon className="h-5 w-5" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                帮助
              </div>
            </Link>
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleCollapse}
                title="展开导航栏"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Link
              to="/help"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
              )}
            >
              <CircleHelpIcon className="h-5 w-5" />
              帮助
            </Link>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleCollapse}
                title="折叠导航栏"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 导出兼容性组件和工具
export { getNavigationRoutes };
