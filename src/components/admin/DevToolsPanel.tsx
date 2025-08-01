"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Code2,
  ChevronDown,
  ChevronRight,
  Settings2,
  Monitor,
  Layers,
  Database,
  Network,
  Bug,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouteConfig } from "@/hooks/useRouteConfig";
import { RouteConfigManager } from "./RouteConfigManager";

interface DevToolsPanelProps {
  children?: React.ReactNode;
}

export function DevToolsPanel({ children }: DevToolsPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("routes");
  const [expandedSections, setExpandedSections] = React.useState<string[]>([
    "environment",
    "routes-summary",
  ]);

  const { navigationRoutes, getCurrentStates } = useRouteConfig();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const currentStates = getCurrentStates();
  const environment = process.env.NODE_ENV;

  // 系统信息
  const systemInfo = {
    environment,
    timestamp: new Date().toLocaleString(),
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "SSR",
    screen: typeof window !== "undefined"
      ? `${window.screen.width}x${window.screen.height}`
      : "Unknown",
    viewport: typeof window !== "undefined"
      ? `${window.innerWidth}x${window.innerHeight}`
      : "Unknown",
  };

  const tabs = [
    { id: "routes", label: "路由配置", icon: Settings2 },
    { id: "system", label: "系统信息", icon: Monitor },
    { id: "performance", label: "性能监控", icon: Database },
    { id: "debug", label: "调试工具", icon: Bug },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-50 shadow-lg"
          >
            <Code2 className="h-4 w-4 mr-2" />
            开发工具
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            开发者工具面板
          </SheetTitle>
          <SheetDescription>
            开发和调试工具集合，包括路由配置、系统信息和性能监控
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {/* 标签页导航 */}
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 标签页内容 */}
          <div className="mt-6 space-y-6">
            {activeTab === "routes" && (
              <div className="space-y-4">
                <RouteConfigManager />
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-4">
                {/* 环境信息 */}
                <Collapsible
                  open={expandedSections.includes("environment")}
                  onOpenChange={() => toggleSection("environment")}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between text-lg">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            环境信息
                          </div>
                          {expandedSections.includes("environment") ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium">运行环境</div>
                            <Badge
                              variant={
                                environment === "development"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {environment}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm font-medium">时间戳</div>
                            <div className="text-sm text-muted-foreground">
                              {systemInfo.timestamp}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">屏幕分辨率</div>
                            <div className="text-sm text-muted-foreground">
                              {systemInfo.screen}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">视窗大小</div>
                            <div className="text-sm text-muted-foreground">
                              {systemInfo.viewport}
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <div className="text-sm font-medium mb-2">用户代理</div>
                          <div className="text-xs text-muted-foreground break-all p-2 bg-muted rounded">
                            {systemInfo.userAgent}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* 路由状态摘要 */}
                <Collapsible
                  open={expandedSections.includes("routes-summary")}
                  onOpenChange={() => toggleSection("routes-summary")}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between text-lg">
                          <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            路由状态摘要
                          </div>
                          {expandedSections.includes("routes-summary") ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {navigationRoutes.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              可见路由
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {Object.keys(currentStates).length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              自定义配置
                            </div>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div>
                          <div className="text-sm font-medium mb-2">
                            当前路由配置
                          </div>
                          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                            {JSON.stringify(currentStates, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* 本地存储 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="h-5 w-5" />
                      本地存储
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const data = localStorage.getItem("routeConfig");
                          if (data) {
                            console.log("Route Config:", JSON.parse(data));
                          } else {
                            console.log("No route config found");
                          }
                        }}
                      >
                        查看路由配置
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          localStorage.clear();
                          console.log("Local storage cleared");
                        }}
                      >
                        清空本地存储
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "performance" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      性能监控
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        性能监控功能开发中...
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 border rounded">
                          <div className="text-lg font-bold">
                            {typeof window !== "undefined"
                              ? `${Math.round(performance.now())}ms`
                              : "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            页面加载时间
                          </div>
                        </div>
                        <div className="text-center p-4 border rounded">
                          <div className="text-lg font-bold">
                            {navigationRoutes.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            渲染组件数
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "debug" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bug className="h-5 w-5" />
                      调试工具
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => console.log("Navigation Routes:", navigationRoutes)}
                      >
                        打印路由信息
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => console.log("Current States:", currentStates)}
                      >
                        打印配置状态
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => console.log("System Info:", systemInfo)}
                      >
                        打印系统信息
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const debug = {
                            routes: navigationRoutes,
                            states: currentStates,
                            system: systemInfo,
                            localStorage: localStorage.getItem("routeConfig"),
                          };
                          console.log("Debug Info:", debug);
                        }}
                      >
                        完整调试信息
                      </Button>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium mb-2">快速操作</div>
                      <div className="space-y-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            window.location.reload();
                          }}
                        >
                          刷新页面
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              window.history.back();
                            }
                          }}
                        >
                          返回上一页
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
