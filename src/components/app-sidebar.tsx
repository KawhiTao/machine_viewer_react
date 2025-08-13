"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  type RouteConfig,
  isRouteDisabled,
  shouldShowInSidebar,
  getMergedRouteConfig,
} from "@/config/routes";
import { cn } from "@/lib/utils";
import { CircleHelpIcon } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import { useRouteConfig } from "@/hooks/useRouteConfig";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { navigationRoutes } = useRouteConfig();

  // 处理点击展开（只展开，不关闭）
  const handleClick = React.useCallback(() => {
    if (state === "collapsed") {
      toggleSidebar();
    }
  }, [state, toggleSidebar]);

  // 缓存当前路径，避免每次渲染都重新计算
  const currentPath = React.useMemo(
    () => location.pathname,
    [location.pathname],
  );

  const isActive = React.useCallback(
    (path: string) => {
      return currentPath === path;
    },
    [currentPath],
  );

  const isParentActive = React.useCallback(
    (item: RouteConfig) => {
      if (isActive(item.path)) return true;
      if (item.children) {
        return item.children.some((child) => isActive(child.path));
      }
      return false;
    },
    [isActive],
  );

  const renderMenuItem = React.useCallback(
    (item: RouteConfig) => {
      // 获取合并后的路由配置（包含动态设置）
      const mergedConfig = getMergedRouteConfig(item.path) || item;

      // 检查是否应该在侧边栏显示
      if (!shouldShowInSidebar(mergedConfig)) {
        return null;
      }

      const Icon = mergedConfig.icon;
      const hasChildren =
        mergedConfig.children && mergedConfig.children.length > 0;
      const active = isActive(mergedConfig.path);
      const parentActive = isParentActive(mergedConfig);
      const disabled = isRouteDisabled(mergedConfig);

      // 过滤可见的子菜单
      const visibleChildren = hasChildren
        ? mergedConfig.children?.filter((child) => {
            const childConfig = getMergedRouteConfig(child.path) || child;
            return shouldShowInSidebar(childConfig);
          })
        : [];
      const hasVisibleChildren = visibleChildren && visibleChildren.length > 0;

      if (hasVisibleChildren && state === "expanded") {
        return (
          <Collapsible
            key={item.path}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={mergedConfig.title}
                  disabled={disabled}
                  isActive={parentActive}
                  hasChildren={true}
                  className={cn(
                    "w-full justify-between",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{mergedConfig.title}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {visibleChildren?.map((child) => {
                    const childConfig =
                      getMergedRouteConfig(child.path) || child;
                    const ChildIcon = childConfig.icon;
                    const childActive = isActive(childConfig.path);
                    const childDisabled = isRouteDisabled(childConfig);

                    return (
                      <SidebarMenuSubItem key={childConfig.path}>
                        <SidebarMenuSubButton asChild isActive={childActive}>
                          <Link
                            to={childConfig.path}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1 text-sm",
                              childDisabled &&
                                "opacity-50 cursor-not-allowed pointer-events-none",
                            )}
                          >
                            {ChildIcon && <ChildIcon className="h-4 w-4" />}
                            <span>{childConfig.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      }

      // 在折叠状态下或没有子菜单时，将带子菜单的项目当作普通菜单项处理
      if (hasVisibleChildren && state === "collapsed") {
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              asChild
              tooltip={mergedConfig.title}
              isActive={parentActive}
              disabled={disabled}
              hasChildren={true}
              className=""
            >
              <Link
                to={mergedConfig.path}
                className={cn(
                  "flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center",
                  disabled &&
                    "opacity-50 cursor-not-allowed pointer-events-none",
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="group-data-[collapsible=icon]:sr-only">
                  {mergedConfig.title}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      }

      return (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton
            asChild
            tooltip={mergedConfig.title}
            isActive={active}
            disabled={disabled}
            hasChildren={false}
            className=""
          >
            <Link
              to={mergedConfig.path}
              className={cn(
                "flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none",
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span className="group-data-[collapsible=icon]:sr-only">
                {mergedConfig.title}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    },
    [state, isActive, isParentActive],
  );

  const memoizedNavigationItems = React.useMemo(
    () => navigationRoutes.map(renderMenuItem),
    [navigationRoutes, renderMenuItem],
  );

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      onClick={handleClick}
      className="transition-[width] duration-300 ease-out"
      {...props}
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground group-data-[collapsible=icon]:shrink-0">
            <span className="text-sm font-bold">视</span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">视图一体化系统</span>
            <span className="truncate text-xs text-muted-foreground">
              管理平台
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航菜单</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{memoizedNavigationItems}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild hasChildren={false} className="">
              <Link
                to="/help"
                className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center"
              >
                <CircleHelpIcon className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:sr-only">
                  帮助
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
