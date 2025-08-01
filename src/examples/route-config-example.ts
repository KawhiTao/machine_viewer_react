// 路由配置使用示例
import { useRouteConfig, useRoutePermissions, useRouteState } from "@/hooks/useRouteConfig";
import { routeConfigManager, applyRoutePreset } from "@/config/routes";

/**
 * 示例 1: 基本使用 - 在组件中动态控制路由显隐
 */
export const BasicUsageExample = () => {
  const {
    navigationRoutes,
    setRouteVisibility,
    setRouteDisabled,
    setShowInSidebar,
    applyPreset,
    resetConfig,
  } = useRouteConfig();

  // 隐藏演示页面
  const hideDemoPage = () => {
    setRouteVisibility("/demo", false);
  };

  // 禁用管理页面
  const disableManagement = () => {
    setRouteDisabled("/management", true);
  };

  // 从侧边栏隐藏帮助页面
  const hideHelpFromSidebar = () => {
    setShowInSidebar("/help", false);
  };

  // 应用管理员配置
  const enableAdminMode = () => {
    applyPreset("admin");
  };

  // 应用普通用户配置
  const enableUserMode = () => {
    applyPreset("user");
  };

  // 重置所有配置
  const resetAllConfig = () => {
    resetConfig();
  };

  return {
    navigationRoutes,
    actions: {
      hideDemoPage,
      disableManagement,
      hideHelpFromSidebar,
      enableAdminMode,
      enableUserMode,
      resetAllConfig,
    },
  };
};

/**
 * 示例 2: 权限控制 - 根据用户角色自动配置路由
 */
export const PermissionControlExample = () => {
  // 模拟用户数据
  const currentUser = {
    roles: ["admin"], // 或者 ["user"]
    permissions: ["read", "write", "admin"],
  };

  // 使用权限相关的路由配置
  const routeConfig = useRoutePermissions(currentUser.roles);

  // 根据具体权限进一步自定义
  if (currentUser.permissions.includes("admin")) {
    routeConfig.setRouteVisibility("/management", true);
    routeConfig.setRouteDisabled("/management", false);
  } else {
    routeConfig.setRouteVisibility("/management", false);
  }

  return routeConfig;
};

/**
 * 示例 3: 批量配置 - 一次性设置多个路由
 */
export const BatchConfigExample = () => {
  const { setBatchConfig } = useRouteConfig();

  // 维护模式配置
  const enableMaintenanceMode = () => {
    setBatchConfig({
      "/ai": { disabled: true },
      "/apps": { disabled: true },
      "/platform": { disabled: true },
      "/management": { visible: false },
      "/help": { visible: true, disabled: false },
    });
  };

  // 演示模式配置
  const enableDemoMode = () => {
    setBatchConfig({
      "/demo": { visible: true, showInSidebar: true },
      "/management": { visible: false },
      "/platform": { visible: false },
      "/help": { showInSidebar: false },
    });
  };

  // 生产模式配置
  const enableProductionMode = () => {
    setBatchConfig({
      "/demo": { visible: false, showInSidebar: false },
      "/management": { visible: true, disabled: false },
      "/platform": { visible: true, disabled: false },
    });
  };

  return {
    enableMaintenanceMode,
    enableDemoMode,
    enableProductionMode,
  };
};

/**
 * 示例 4: 单个路由状态管理
 */
export const SingleRouteExample = (routePath: string) => {
  const {
    routeConfig,
    setVisible,
    setDisabled,
    setShowInSidebar,
    isVisible,
    isDisabled,
    showInSidebar,
  } = useRouteState(routePath);

  return {
    routeConfig,
    state: {
      isVisible,
      isDisabled,
      showInSidebar,
    },
    actions: {
      show: () => setVisible(true),
      hide: () => setVisible(false),
      enable: () => setDisabled(false),
      disable: () => setDisabled(true),
      showInSidebar: () => setShowInSidebar(true),
      hideFromSidebar: () => setShowInSidebar(false),
    },
  };
};

/**
 * 示例 5: 环境相关配置
 */
export const EnvironmentConfigExample = () => {
  const { setBatchConfig, applyPreset } = useRouteConfig();

  const setupForEnvironment = (env: "development" | "production") => {
    if (env === "development") {
      // 开发环境配置
      setBatchConfig({
        "/demo": { visible: true, showInSidebar: true },
        "/management": { visible: true, disabled: false },
        "/platform": { disabled: false },
      });
    } else {
      // 生产环境配置
      setBatchConfig({
        "/demo": { visible: false, showInSidebar: false },
        "/management": {
          visible: true,
          disabled: false,
          requireAuth: true,
          roles: ["admin"]
        },
      });
    }
  };

  return { setupForEnvironment };
};

/**
 * 示例 6: 动态菜单排序
 */
export const MenuOrderingExample = () => {
  const { setRouteOrder, setBatchConfig } = useRouteConfig();

  // 设置菜单优先级
  const setPriorityOrder = () => {
    setBatchConfig({
      "/home": { order: 1 },      // 首页最优先
      "/ai": { order: 2 },        // AI功能次之
      "/apps": { order: 3 },      // 应用广场
      "/platform": { order: 4 },  // 平台配置
      "/management": { order: 5 }, // 系统管理
      "/help": { order: 99 },     // 帮助最后
    });
  };

  // 调整单个路由顺序
  const moveToTop = (path: string) => {
    setRouteOrder(path, 0);
  };

  const moveToBottom = (path: string) => {
    setRouteOrder(path, 999);
  };

  return {
    setPriorityOrder,
    moveToTop,
    moveToBottom,
  };
};

/**
 * 示例 7: 条件显示路由
 */
export const ConditionalRoutesExample = () => {
  const { setRouteVisibility, setRouteDisabled } = useRouteConfig();

  // 根据功能开关控制路由
  const featureFlags = {
    enableAI: true,
    enableApps: true,
    enablePlatform: false,
    enableManagement: true,
  };

  const applyFeatureFlags = () => {
    setRouteVisibility("/ai", featureFlags.enableAI);
    setRouteVisibility("/apps", featureFlags.enableApps);
    setRouteVisibility("/platform", featureFlags.enablePlatform);
    setRouteVisibility("/management", featureFlags.enableManagement);
  };

  // 根据用户订阅级别控制功能
  const userSubscription = "premium"; // "basic" | "premium" | "enterprise"

  const applySubscriptionLimits = () => {
    switch (userSubscription) {
      case "basic":
        setRouteDisabled("/ai", true);
        setRouteDisabled("/platform", true);
        setRouteVisibility("/management", false);
        break;
      case "premium":
        setRouteDisabled("/ai", false);
        setRouteDisabled("/platform", true);
        setRouteVisibility("/management", false);
        break;
      case "enterprise":
        setRouteDisabled("/ai", false);
        setRouteDisabled("/platform", false);
        setRouteVisibility("/management", true);
        break;
    }
  };

  return {
    applyFeatureFlags,
    applySubscriptionLimits,
  };
};

/**
 * 示例 8: 路由配置持久化
 */
export const PersistenceExample = () => {
  const { getCurrentStates, setBatchConfig } = useRouteConfig();

  // 保存配置到本地存储
  const saveConfigToLocalStorage = () => {
    const currentConfig = getCurrentStates();
    localStorage.setItem("routeConfig", JSON.stringify(currentConfig));
  };

  // 从本地存储恢复配置
  const loadConfigFromLocalStorage = () => {
    const saved = localStorage.getItem("routeConfig");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setBatchConfig(config);
      } catch (error) {
        console.error("Failed to load route config:", error);
      }
    }
  };

  // 导出配置
  const exportConfig = () => {
    const config = getCurrentStates();
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "route-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入配置
  const importConfig = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        setBatchConfig(config);
      } catch (error) {
        console.error("Failed to import route config:", error);
      }
    };
    reader.readAsText(file);
  };

  return {
    saveConfigToLocalStorage,
    loadConfigFromLocalStorage,
    exportConfig,
    importConfig,
  };
};

// 使用方式示例：
/*
// 在组件中使用
import { BasicUsageExample } from "@/examples/route-config-example";

const MyComponent = () => {
  const { navigationRoutes, actions } = BasicUsageExample();

  return (
    <div>
      <button onClick={actions.hideDemoPage}>隐藏演示页面</button>
      <button onClick={actions.enableAdminMode}>启用管理员模式</button>
      <button onClick={actions.resetAllConfig}>重置配置</button>
    </div>
  );
};
*/
