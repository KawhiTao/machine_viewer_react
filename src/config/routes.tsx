import { type ReactNode } from "react";
import { Navigate, Route } from "react-router-dom";
import {
  HomeIcon,
  SearchIcon,
  AlertTriangleIcon,
  FileTextIcon,
  SettingsIcon,
  UsersIcon,
  BrainCircuitIcon,
  CircleHelpIcon,
} from "lucide-react";

// 懒加载组件
import { lazy } from "react";
// import Review from "@/pages/apps/review";

const Home = lazy(() => import("@/pages/Home"));
// const Auto = lazy(() => import("@/pages/auto"));
const Demo = lazy(() => import("@/pages/demo"));
const Review = lazy(() => import("@/pages/apps/review"));
const AppMarket = lazy(() => import("@/pages/apps/AppMarket"));
const Management = lazy(() => import("@/pages/management"));

// 路由配置类型定义
export interface RouteConfig {
  path: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  component?: React.ComponentType;
  children?: RouteConfig[];
  redirect?: string;
  meta?: {
    requireAuth?: boolean;
    roles?: string[];
    hidden?: boolean;
    keepAlive?: boolean;
    // 新增显隐控制字段
    visible?: boolean; // 是否可见，默认为 true
    disabled?: boolean; // 是否禁用，默认为 false
    showInSidebar?: boolean; // 是否在侧边栏显示，默认为 true
    showInBreadcrumb?: boolean; // 是否在面包屑显示，默认为 true
    order?: number; // 排序权重，数字越小越靠前
    environment?: "development" | "production" | "all"; // 环境控制，默认为 all
  };
}

// 全局路由配置
export const routesConfig: RouteConfig[] = [
  {
    path: "/home",
    title: "系统首页",
    icon: HomeIcon,
    component: Home,
    meta: {
      keepAlive: true,
      order: 1,
    },
  },
  {
    path: "/ai",
    title: "AI文搜",
    icon: BrainCircuitIcon,
    redirect: "/ai/text",
    meta: {
      keepAlive: true,
      order: 2,
    },
    children: [
      {
        path: "/ai/text",
        title: "交通文本模型",
        icon: BrainCircuitIcon,
        // component: Demo,
        meta: {
          keepAlive: true,
        },
      },
      {
        path: "/ai/language",
        title: "交通语言模型",
        icon: SearchIcon,
        // component: Search,
        meta: {
          keepAlive: true,
          disabled: false, // 可以设置为 true 来禁用此菜单项
        },
      },
      {
        path: "/ai/video",
        title: "视频识别模型",
        icon: SearchIcon,
        // component: Search,
        meta: {
          keepAlive: true,
        },
      },
    ],
  },
  {
    path: "/apps",
    title: "我的应用",
    icon: UsersIcon,
    redirect: "/apps/preview",
    meta: {
      keepAlive: true,
      order: 3,
    },
    children: [
      {
        path: "/apps/preview",
        title: "二次图审",
        icon: BrainCircuitIcon,
        component: Review,
        meta: {
          visible: true, // 设置为 false 可隐藏
          disabled: false, // 设置为 true 可禁用
        },
      },
      {
        path: "/apps/inspection",
        title: "巡检养护",
        icon: FileTextIcon,
        // component: AiDocs, // 待创建
        meta: {
          // disabled: true, // 功能未完成，暂时禁用
        },
      },
      {
        path: "/apps/warning",
        title: "施工预警",
        icon: AlertTriangleIcon,
        // component: Warning, // 待创建
        meta: {
          // visible: false, // 暂时隐藏此功能
        },
      },
    ],
  },
  {
    path: "/app-market",
    title: "应用广场",
    icon: BrainCircuitIcon,
    component: AppMarket,
    meta: {
      keepAlive: true,
      visible: false,
      order: 4,
    },
  },
  {
    path: "/platform",
    title: "平台配置",
    icon: UsersIcon,
    // component: Online, // 待创建
    meta: {
      order: 5,
    },
  },
  {
    path: "/management",
    title: "系统管理",
    icon: SettingsIcon,
    component: Management,
    meta: {
      requireAuth: true,
      roles: ["admin"],
      order: 6,
    },
  },
  {
    path: "/demo",
    title: "Demo",
    icon: BrainCircuitIcon,
    component: Demo,
    meta: {
      hidden: true, // 在生产环境中隐藏
      environment: "development", // 只在开发环境显示
      order: 97,
    },
  },
  {
    path: "/help",
    title: "帮助",
    icon: CircleHelpIcon,
    // component: Help, // 待创建
    meta: {
      order: 98,
      showInSidebar: true, // 在侧边栏显示
      showInBreadcrumb: true, // 在面包屑显示
      disabled: false, // 不禁用
      environment: "all", // 所有环境显示
      hidden: true,
    },
  },
  {
    path: "*",
    title: "页面未找到",
    icon: CircleHelpIcon,
    // component: NotFound, // 在App.tsx中处理
    meta: {
      hidden: true, // 隐藏，不在侧边栏显示
      showInSidebar: false,
      showInBreadcrumb: true, // 在面包屑显示
      order: 9999,
    },
  },
];

// 工具函数：根据路径获取路由配置
export const getRouteByPath = (path: string): RouteConfig | undefined => {
  return routesConfig.find((route) => route.path === path);
};

// 工具函数：获取路由标题
export const getRouteTitleByPath = (path: string): string => {
  const route = getRouteByPath(path);
  return route?.title || path;
};

// 工具函数：获取所有可导航的路由（排除隐藏的）
export const getNavigationRoutes = (): RouteConfig[] => {
  return routesConfig
    .map((route) => {
      // 获取合并后的配置
      const mergedConfig = getMergedRouteConfig(route.path) || route;
      return mergedConfig;
    })
    .filter((route) => {
      // 检查是否隐藏
      if (route.meta?.hidden) return false;
      // 检查是否可见
      if (route.meta?.visible === false) return false;
      // 检查是否在侧边栏显示
      if (route.meta?.showInSidebar === false) return false;
      // 检查环境配置
      if (route.meta?.environment && route.meta.environment !== "all") {
        const currentEnv = process.env.NODE_ENV as "development" | "production";
        if (route.meta.environment !== currentEnv) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // 按照 order 字段排序
      const orderA = a.meta?.order ?? 50;
      const orderB = b.meta?.order ?? 50;
      return orderA - orderB;
    });
};

// 工具函数：生成路由到标题的映射对象（用于面包屑）
export const getRoutePathTitleMap = (): Record<string, string> => {
  const map: Record<string, string> = {};

  const addRouteToMap = (route: RouteConfig) => {
    map[route.path] = route.title;
    // 处理子路由
    if (route.children) {
      route.children.forEach((child) => {
        addRouteToMap(child);
      });
    }
  };

  routesConfig.forEach(addRouteToMap);
  return map;
};

// 工具函数：检查路由是否需要认证
export const routeRequiresAuth = (path: string): boolean => {
  const route = getRouteByPath(path);
  return route?.meta?.requireAuth || false;
};

// 工具函数：检查用户是否有访问路由的权限
export const hasRoutePermission = (
  path: string,
  userRoles: string[] = [],
): boolean => {
  const route = getRouteByPath(path);
  if (!route?.meta?.roles) return true;
  return route.meta.roles.some((role) => userRoles.includes(role));
};

// 工具函数：生成React Router路由组件
export const generateRoutes = (): ReactNode[] => {
  const routes: ReactNode[] = [];

  const addRouteComponents = (route: RouteConfig) => {
    if (route.redirect) {
      routes.push(
        <Route
          key={route.path}
          path={route.path}
          element={<Navigate to={route.redirect} replace />}
        />,
      );
    } else if (route.component) {
      const Component = route.component;
      routes.push(
        <Route key={route.path} path={route.path} element={<Component />} />,
      );
    }

    // 处理子路由
    if (route.children) {
      route.children.forEach((child) => {
        addRouteComponents(child);
      });
    }
  };

  routesConfig.forEach(addRouteComponents);
  return routes;
};

// 工具函数：获取所有可用的路由路径（用于路由守卫等）
export const getAllRoutePaths = (): string[] => {
  const paths: string[] = [];

  const addRoutePaths = (route: RouteConfig) => {
    paths.push(route.path);
    if (route.children) {
      route.children.forEach((child) => {
        addRoutePaths(child);
      });
    }
  };

  routesConfig.forEach(addRoutePaths);
  return paths;
};

// 新增工具函数：检查路由是否可见
export const isRouteVisible = (route: RouteConfig): boolean => {
  // 检查是否隐藏
  if (route.meta?.hidden) return false;
  // 检查是否可见
  if (route.meta?.visible === false) return false;
  // 检查环境配置
  if (route.meta?.environment && route.meta.environment !== "all") {
    const currentEnv = process.env.NODE_ENV as "development" | "production";
    if (route.meta.environment !== currentEnv) return false;
  }
  return true;
};

// 新增工具函数：检查路由是否禁用
export const isRouteDisabled = (route: RouteConfig): boolean => {
  return route.meta?.disabled === true;
};

// 新增工具函数：检查路由是否在侧边栏显示
export const shouldShowInSidebar = (route: RouteConfig): boolean => {
  if (!isRouteVisible(route)) return false;
  return route.meta?.showInSidebar !== false;
};

// 新增工具函数：检查路由是否在面包屑显示
export const shouldShowInBreadcrumb = (route: RouteConfig): boolean => {
  if (!isRouteVisible(route)) return false;
  return route.meta?.showInBreadcrumb !== false;
};

// 新增工具函数：获取可见的路由（包含子路由的过滤）
export const getVisibleRoutes = (): RouteConfig[] => {
  const filterRoutes = (routes: RouteConfig[]): RouteConfig[] => {
    return routes
      .filter(isRouteVisible)
      .map((route) => ({
        ...route,
        children: route.children ? filterRoutes(route.children) : undefined,
      }))
      .sort((a, b) => {
        const orderA = a.meta?.order ?? 50;
        const orderB = b.meta?.order ?? 50;
        return orderA - orderB;
      });
  };

  return filterRoutes(routesConfig);
};

// 新增类型定义：路由配置管理器
export interface RouteConfigManager {
  // 动态设置路由可见性
  setRouteVisibility: (path: string, visible: boolean) => void;
  // 动态设置路由禁用状态
  setRouteDisabled: (path: string, disabled: boolean) => void;
  // 动态设置路由在侧边栏显示
  setShowInSidebar: (path: string, show: boolean) => void;
  // 动态设置路由在面包屑显示
  setShowInBreadcrumb: (path: string, show: boolean) => void;
  // 动态设置路由排序
  setRouteOrder: (path: string, order: number) => void;
  // 获取当前配置
  getRouteConfig: (path: string) => RouteConfig | undefined;
  // 重置所有配置到默认状态
  resetConfig: () => void;
}

// 路由配置状态管理
const routeConfigState: Map<string, Partial<RouteConfig["meta"]>> = new Map();

// 实现路由配置管理器
export const routeConfigManager: RouteConfigManager = {
  setRouteVisibility: (path: string, visible: boolean) => {
    const current = routeConfigState.get(path) || {};
    routeConfigState.set(path, { ...current, visible });
    // 触发更新事件
    window.dispatchEvent(new CustomEvent("routeConfigChanged"));
  },

  setRouteDisabled: (path: string, disabled: boolean) => {
    const current = routeConfigState.get(path) || {};
    routeConfigState.set(path, { ...current, disabled });
    // 触发更新事件
    window.dispatchEvent(new CustomEvent("routeConfigChanged"));
  },

  setShowInSidebar: (path: string, show: boolean) => {
    const current = routeConfigState.get(path) || {};
    routeConfigState.set(path, { ...current, showInSidebar: show });
    // 触发更新事件
    window.dispatchEvent(new CustomEvent("routeConfigChanged"));
  },

  setShowInBreadcrumb: (path: string, show: boolean) => {
    const current = routeConfigState.get(path) || {};
    routeConfigState.set(path, { ...current, showInBreadcrumb: show });
    // 触发更新事件
    window.dispatchEvent(new CustomEvent("routeConfigChanged"));
  },

  setRouteOrder: (path: string, order: number) => {
    const current = routeConfigState.get(path) || {};
    routeConfigState.set(path, { ...current, order });
    // 触发更新事件
    window.dispatchEvent(new CustomEvent("routeConfigChanged"));
  },

  getRouteConfig: (path: string) => {
    const baseRoute = routesConfig.find((route) => route.path === path);
    if (!baseRoute) return undefined;

    const overrides = routeConfigState.get(path);
    if (!overrides) return baseRoute;

    return {
      ...baseRoute,
      meta: {
        ...baseRoute.meta,
        ...overrides,
      },
    };
  },

  resetConfig: () => {
    routeConfigState.clear();
    // 触发更新事件
    window.dispatchEvent(new CustomEvent("routeConfigChanged"));
  },
};

// 获取合并后的路由配置（包含动态设置）
export const getMergedRouteConfig = (path: string): RouteConfig | undefined => {
  return routeConfigManager.getRouteConfig(path);
};

// 批量路由配置管理
export interface BatchRouteConfig {
  [path: string]: Partial<RouteConfig["meta"]>;
}

// 批量设置路由配置
export const setBatchRouteConfig = (config: BatchRouteConfig) => {
  // 批量更新，避免多次触发更新
  const entries = Object.entries(config);
  entries.forEach(([path, meta]) => {
    const current = routeConfigState.get(path) || {};
    routeConfigState.set(path, { ...current, ...meta });
  });

  // 触发一次全局更新事件
  if (entries.length > 0) {
    window.dispatchEvent(new CustomEvent("routeConfigChanged"));
  }
};

// 预设配置模板
export const routePresets = {
  // 开发模式配置
  development: {
    "/demo": { visible: true, showInSidebar: true },
    "/management": { visible: true, disabled: false },
  } as BatchRouteConfig,

  // 生产模式配置
  production: {
    "/demo": { visible: false, showInSidebar: false },
    "/management": { visible: true, disabled: false },
  } as BatchRouteConfig,

  // 管理员配置
  admin: {
    "/management": { visible: true, disabled: false },
    "/platform": { visible: true, disabled: false },
  } as BatchRouteConfig,

  // 普通用户配置
  user: {
    "/management": { visible: false, showInSidebar: false },
    "/platform": { visible: false, showInSidebar: false },
  } as BatchRouteConfig,
};

// 应用预设配置
export const applyRoutePreset = (presetName: keyof typeof routePresets) => {
  const preset = routePresets[presetName];
  if (preset) {
    setBatchRouteConfig(preset);
  }
};

// 获取当前应用的路由状态
export const getCurrentRouteStates = () => {
  return Object.fromEntries(routeConfigState);
};
