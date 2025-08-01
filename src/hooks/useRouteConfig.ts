import { useState, useEffect, useCallback, useMemo } from "react";
import {
  type RouteConfig,
  type BatchRouteConfig,
  routeConfigManager,
  getNavigationRoutes,
  applyRoutePreset,
  getCurrentRouteStates,
  routePresets,
  setBatchRouteConfig,
} from "@/config/routes";

// Hook 返回值类型定义
export interface UseRouteConfigReturn {
  // 当前导航路由
  navigationRoutes: RouteConfig[];
  // 设置路由可见性
  setRouteVisibility: (path: string, visible: boolean) => void;
  // 设置路由禁用状态
  setRouteDisabled: (path: string, disabled: boolean) => void;
  // 设置路由在侧边栏显示
  setShowInSidebar: (path: string, show: boolean) => void;
  // 设置路由在面包屑显示
  setShowInBreadcrumb: (path: string, show: boolean) => void;
  // 设置路由排序
  setRouteOrder: (path: string, order: number) => void;
  // 批量设置路由配置
  setBatchConfig: (config: BatchRouteConfig) => void;
  // 应用预设配置
  applyPreset: (presetName: keyof typeof routePresets) => void;
  // 重置配置
  resetConfig: () => void;
  // 获取单个路由配置
  getRouteConfig: (path: string) => RouteConfig | undefined;
  // 获取当前所有路由状态
  getCurrentStates: () => Record<string, any>;
  // 强制刷新路由
  refreshRoutes: () => void;
}

/**
 * 路由配置管理 Hook
 * 提供动态控制路由显隐、禁用状态等功能
 */
export const useRouteConfig = (): UseRouteConfigReturn => {
  const [routeVersion, setRouteVersion] = useState(0);

  // 监听路由配置变化事件
  useEffect(() => {
    const handleRouteConfigChange = () => {
      setRouteVersion((prev) => prev + 1);
    };

    window.addEventListener("routeConfigChanged", handleRouteConfigChange);
    return () => {
      window.removeEventListener("routeConfigChanged", handleRouteConfigChange);
    };
  }, []);

  // 强制刷新路由的函数
  const refreshRoutes = useCallback(() => {
    setRouteVersion((prev) => prev + 1);
  }, []);

  // 获取当前导航路由（使用 useMemo 缓存）
  const navigationRoutes = useMemo(() => {
    // 依赖 routeVersion 来触发重新计算
    return getNavigationRoutes();
  }, [routeVersion]);

  // 设置路由可见性
  const setRouteVisibility = useCallback((path: string, visible: boolean) => {
    routeConfigManager.setRouteVisibility(path, visible);
  }, []);

  // 设置路由禁用状态
  const setRouteDisabled = useCallback((path: string, disabled: boolean) => {
    routeConfigManager.setRouteDisabled(path, disabled);
  }, []);

  // 设置路由在侧边栏显示
  const setShowInSidebar = useCallback((path: string, show: boolean) => {
    routeConfigManager.setShowInSidebar(path, show);
  }, []);

  // 设置路由在面包屑显示
  const setShowInBreadcrumb = useCallback((path: string, show: boolean) => {
    routeConfigManager.setShowInBreadcrumb(path, show);
  }, []);

  // 设置路由排序
  const setRouteOrder = useCallback((path: string, order: number) => {
    routeConfigManager.setRouteOrder(path, order);
  }, []);

  // 批量设置路由配置
  const setBatchConfig = useCallback((config: BatchRouteConfig) => {
    setBatchRouteConfig(config);
  }, []);

  // 应用预设配置
  const applyPreset = useCallback((presetName: keyof typeof routePresets) => {
    applyRoutePreset(presetName);
  }, []);

  // 重置配置
  const resetConfig = useCallback(() => {
    routeConfigManager.resetConfig();
  }, []);

  // 获取单个路由配置
  const getRouteConfig = useCallback((path: string) => {
    return routeConfigManager.getRouteConfig(path);
  }, []);

  // 获取当前所有路由状态
  const getCurrentStates = useCallback(() => {
    return getCurrentRouteStates();
  }, []);

  return {
    navigationRoutes,
    setRouteVisibility,
    setRouteDisabled,
    setShowInSidebar,
    setShowInBreadcrumb,
    setRouteOrder,
    setBatchConfig,
    applyPreset,
    resetConfig,
    getRouteConfig,
    getCurrentStates,
    refreshRoutes,
  };
};

/**
 * 权限相关的路由配置 Hook
 * 根据用户角色自动应用路由配置
 */
export const useRoutePermissions = (userRoles: string[] = []) => {
  const routeConfig = useRouteConfig();

  // 使用 useMemo 来避免不必要的重新计算
  const userRolesString = useMemo(() => userRoles.join(","), [userRoles]);

  useEffect(() => {
    // 防止在初始渲染时触发
    const timer = setTimeout(() => {
      // 根据用户角色应用不同的路由配置
      if (userRoles.includes("admin")) {
        routeConfig.applyPreset("admin");
      } else {
        routeConfig.applyPreset("user");
      }

      // 根据环境应用配置
      const env = process.env.NODE_ENV as "development" | "production";
      if (env === "development") {
        routeConfig.setBatchConfig(routePresets.development);
      } else {
        routeConfig.setBatchConfig(routePresets.production);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [userRolesString, routeConfig]);

  return routeConfig;
};

/**
 * 单个路由状态管理 Hook
 * 用于管理特定路由的显隐状态
 */
export const useRouteState = (path: string) => {
  const [version, setVersion] = useState(0);

  // 使用 useMemo 缓存路由配置
  const routeConfig = useMemo(() => {
    return routeConfigManager.getRouteConfig(path);
  }, [path, version]);

  const forceUpdate = useCallback(() => {
    setVersion((prev) => prev + 1);
  }, []);

  const setVisible = useCallback(
    (visible: boolean) => {
      routeConfigManager.setRouteVisibility(path, visible);
      forceUpdate();
    },
    [path, forceUpdate],
  );

  const setDisabled = useCallback(
    (disabled: boolean) => {
      routeConfigManager.setRouteDisabled(path, disabled);
      forceUpdate();
    },
    [path, forceUpdate],
  );

  const setShowInSidebar = useCallback(
    (show: boolean) => {
      routeConfigManager.setShowInSidebar(path, show);
      forceUpdate();
    },
    [path, forceUpdate],
  );

  // 使用 useMemo 缓存计算结果
  const computedState = useMemo(
    () => ({
      isVisible: routeConfig?.meta?.visible !== false,
      isDisabled: routeConfig?.meta?.disabled === true,
      showInSidebar: routeConfig?.meta?.showInSidebar !== false,
    }),
    [routeConfig],
  );

  return {
    routeConfig,
    setVisible,
    setDisabled,
    setShowInSidebar,
    ...computedState,
  };
};
