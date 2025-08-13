"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouteConfig } from "@/hooks/useRouteConfig";
import { routePresets, routesConfig } from "@/config/routes";
import { Eye, EyeOff, Lock, Unlock, Settings2, RotateCcw } from "lucide-react";

export function RouteConfigManager() {
  const {
    navigationRoutes,
    setRouteVisibility,
    setRouteDisabled,
    setShowInSidebar,
    setShowInBreadcrumb,
    setRouteOrder,
    applyPreset,
    resetConfig,
    getRouteConfig,
    getCurrentStates,
  } = useRouteConfig();

  const [selectedPreset, setSelectedPreset] = React.useState<string>("");

  // 直接获取当前状态，不使用本地 state
  const currentStates = getCurrentStates();

  // 切换路由可见性
  const toggleVisibility = (path: string) => {
    const current = getRouteConfig(path);
    const newVisible = current?.meta?.visible !== false ? false : true;
    setRouteVisibility(path, newVisible);
  };

  // 切换路由禁用状态
  const toggleDisabled = (path: string) => {
    const current = getRouteConfig(path);
    const newDisabled = current?.meta?.disabled === true ? false : true;
    setRouteDisabled(path, newDisabled);
  };

  // 切换侧边栏显示
  const toggleSidebar = (path: string) => {
    const current = getRouteConfig(path);
    const newShow = current?.meta?.showInSidebar !== false ? false : true;
    setShowInSidebar(path, newShow);
  };

  // 切换面包屑显示
  const toggleBreadcrumb = (path: string) => {
    const current = getRouteConfig(path);
    const newShow = current?.meta?.showInBreadcrumb !== false ? false : true;
    setShowInBreadcrumb(path, newShow);
  };

  // 应用预设
  const handleApplyPreset = () => {
    if (selectedPreset) {
      applyPreset(selectedPreset as keyof typeof routePresets);
    }
  };

  // 重置配置
  const handleReset = () => {
    resetConfig();
    setSelectedPreset("");
  };

  // 更新排序
  const handleOrderChange = (path: string, order: string) => {
    const orderNum = parseInt(order, 10);
    if (!isNaN(orderNum)) {
      setRouteOrder(path, orderNum);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            路由配置管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 预设配置 */}
          <div className="space-y-2">
            <Label>预设配置</Label>
            <div className="flex gap-2">
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="选择预设配置" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">开发模式</SelectItem>
                  <SelectItem value="production">生产模式</SelectItem>
                  <SelectItem value="admin">管理员模式</SelectItem>
                  <SelectItem value="user">普通用户模式</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleApplyPreset} disabled={!selectedPreset}>
                应用预设
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                重置配置
              </Button>
            </div>
          </div>

          <Separator />

          {/* 当前状态统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {navigationRoutes.length}
              </div>
              <div className="text-sm text-muted-foreground">可见路由</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {
                  routesConfig.filter(
                    (route) => getRouteConfig(route.path)?.meta?.disabled,
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">禁用路由</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {
                  routesConfig.filter(
                    (route) =>
                      getRouteConfig(route.path)?.meta?.showInSidebar !== false,
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">侧边栏显示</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(currentStates).length}
              </div>
              <div className="text-sm text-muted-foreground">自定义配置</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 路由配置列表 */}
      <Card>
        <CardHeader>
          <CardTitle>路由配置详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routesConfig.map((route) => {
              const currentConfig = getRouteConfig(route.path);
              const isVisible = currentConfig?.meta?.visible !== false;
              const isDisabled = currentConfig?.meta?.disabled === true;
              const showInSidebar =
                currentConfig?.meta?.showInSidebar !== false;
              const showInBreadcrumb =
                currentConfig?.meta?.showInBreadcrumb !== false;
              const order = currentConfig?.meta?.order || 50;

              return (
                <div
                  key={route.path}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {route.icon && <route.icon className="h-5 w-5" />}
                      <div>
                        <div className="font-medium">{route.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {route.path}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isVisible ? (
                        <Badge variant="default">可见</Badge>
                      ) : (
                        <Badge variant="secondary">隐藏</Badge>
                      )}
                      {isDisabled && <Badge variant="destructive">禁用</Badge>}
                      {route.children && (
                        <Badge variant="outline">
                          {route.children.length} 个子菜单
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 可见性控制 */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`visible-${route.path}`}
                        checked={isVisible}
                        onCheckedChange={() => toggleVisibility(route.path)}
                      />
                      <Label
                        htmlFor={`visible-${route.path}`}
                        className="text-sm"
                      >
                        {isVisible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                        可见
                      </Label>
                    </div>

                    {/* 禁用状态控制 */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`disabled-${route.path}`}
                        checked={isDisabled}
                        onCheckedChange={() => toggleDisabled(route.path)}
                      />
                      <Label
                        htmlFor={`disabled-${route.path}`}
                        className="text-sm"
                      >
                        {isDisabled ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                        禁用
                      </Label>
                    </div>

                    {/* 侧边栏显示控制 */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`sidebar-${route.path}`}
                        checked={showInSidebar}
                        onCheckedChange={() => toggleSidebar(route.path)}
                      />
                      <Label
                        htmlFor={`sidebar-${route.path}`}
                        className="text-sm"
                      >
                        侧边栏
                      </Label>
                    </div>

                    {/* 面包屑显示控制 */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`breadcrumb-${route.path}`}
                        checked={showInBreadcrumb}
                        onCheckedChange={() => toggleBreadcrumb(route.path)}
                      />
                      <Label
                        htmlFor={`breadcrumb-${route.path}`}
                        className="text-sm"
                      >
                        面包屑
                      </Label>
                    </div>
                  </div>

                  {/* 排序控制 */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`order-${route.path}`} className="text-sm">
                      排序权重:
                    </Label>
                    <Input
                      id={`order-${route.path}`}
                      type="number"
                      value={order}
                      onChange={(e) =>
                        handleOrderChange(route.path, e.target.value)
                      }
                      className="w-20"
                      min="0"
                      max="100"
                    />
                    <span className="text-xs text-muted-foreground">
                      (数字越小越靠前)
                    </span>
                  </div>

                  {/* 子路由 */}
                  {route.children && route.children.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-muted">
                      <div className="text-sm font-medium mb-2">子菜单：</div>
                      <div className="space-y-2">
                        {route.children.map((child) => {
                          const childConfig = getRouteConfig(child.path);
                          const childVisible =
                            childConfig?.meta?.visible !== false;
                          const childDisabled =
                            childConfig?.meta?.disabled === true;

                          return (
                            <div
                              key={child.path}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                {child.icon && (
                                  <child.icon className="h-4 w-4" />
                                )}
                                <span className="text-sm">{child.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {child.path}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Switch
                                  checked={childVisible}
                                  onCheckedChange={() =>
                                    toggleVisibility(child.path)
                                  }
                                />
                                <Switch
                                  checked={childDisabled}
                                  onCheckedChange={() =>
                                    toggleDisabled(child.path)
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 当前配置状态 */}
      <Card>
        <CardHeader>
          <CardTitle>当前配置状态</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(currentStates, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
