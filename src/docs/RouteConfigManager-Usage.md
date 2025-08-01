# RouteConfigManager 使用说明

## 概述

`RouteConfigManager` 是一个强大的路由配置管理组件，允许你动态控制导航菜单的显示状态、权限设置和排序。它提供了直观的可视化界面来管理整个应用的路由配置。

## 核心功能

### 🎯 主要特性

- **动态显隐控制**: 实时控制路由的显示/隐藏
- **禁用状态管理**: 禁用路由但保持可见（显示为灰色）
- **分区域控制**: 分别控制在侧边栏和面包屑的显示
- **排序功能**: 通过权重值控制菜单顺序
- **批量配置**: 一次性设置多个路由配置
- **预设模板**: 预定义的配置模板
- **实时预览**: 配置更改立即生效

## 使用方式

### 方式一：在管理页面中使用

访问系统管理页面（`/management`），在"路由配置"标签页中使用：

```tsx
import { RouteConfigManager } from "@/components/admin/RouteConfigManager";

export default function ManagementPage() {
  return (
    <div>
      <RouteConfigManager />
    </div>
  );
}
```

### 方式二：通过弹窗快速访问

在任何页面的 Header 中点击"路由配置"按钮：

```tsx
import { RouteConfigDialog } from "@/components/admin/RouteConfigDialog";

function HeaderActions() {
  return (
    <div>
      <RouteConfigDialog />
    </div>
  );
}
```

### 方式三：开发者工具面板

在开发环境中，右下角的"开发工具"按钮：

```tsx
import { DevToolsPanel } from "@/components/admin/DevToolsPanel";

function App() {
  return (
    <div>
      {process.env.NODE_ENV === 'development' && <DevToolsPanel />}
    </div>
  );
}
```

## 配置字段说明

### meta 配置字段

每个路由可以配置以下 meta 字段：

```tsx
interface RouteMeta {
  visible?: boolean;           // 是否可见，默认为 true
  disabled?: boolean;          // 是否禁用，默认为 false
  showInSidebar?: boolean;     // 是否在侧边栏显示，默认为 true
  showInBreadcrumb?: boolean;  // 是否在面包屑显示，默认为 true
  order?: number;              // 排序权重，数字越小越靠前
  environment?: "development" | "production" | "all"; // 环境控制
  requireAuth?: boolean;       // 是否需要认证
  roles?: string[];           // 允许访问的角色
  hidden?: boolean;           // 是否隐藏（向后兼容）
  keepAlive?: boolean;        // 是否保持活跃状态
}
```

## 预设配置

### 内置预设

1. **开发模式** (`development`)
   - 显示 Demo 页面
   - 启用所有管理功能

2. **生产模式** (`production`)
   - 隐藏 Demo 页面
   - 限制管理功能访问

3. **管理员模式** (`admin`)
   - 显示所有管理功能
   - 启用平台配置

4. **普通用户模式** (`user`)
   - 隐藏管理功能
   - 限制敏感操作

### 应用预设

```tsx
import { useRouteConfig } from "@/hooks/useRouteConfig";

function MyComponent() {
  const { applyPreset } = useRouteConfig();

  const enableAdminMode = () => {
    applyPreset("admin");
  };

  return (
    <button onClick={enableAdminMode}>
      启用管理员模式
    </button>
  );
}
```

## API 使用

### useRouteConfig Hook

```tsx
import { useRouteConfig } from "@/hooks/useRouteConfig";

function MyComponent() {
  const {
    navigationRoutes,        // 当前可见的导航路由
    setRouteVisibility,      // 设置路由可见性
    setRouteDisabled,        // 设置路由禁用状态
    setShowInSidebar,        // 设置侧边栏显示
    setShowInBreadcrumb,     // 设置面包屑显示
    setRouteOrder,           // 设置路由排序
    setBatchConfig,          // 批量设置配置
    applyPreset,             // 应用预设配置
    resetConfig,             // 重置配置
    getRouteConfig,          // 获取路由配置
    getCurrentStates,        // 获取当前状态
    refreshRoutes,           // 刷新路由
  } = useRouteConfig();

  // 隐藏演示页面
  const hideDemoPage = () => {
    setRouteVisibility("/demo", false);
  };

  // 禁用管理页面
  const disableManagement = () => {
    setRouteDisabled("/management", true);
  };

  // 批量配置
  const setupMaintenanceMode = () => {
    setBatchConfig({
      "/ai": { disabled: true },
      "/apps": { disabled: true },
      "/management": { visible: false },
    });
  };

  return (
    <div>
      <button onClick={hideDemoPage}>隐藏演示页面</button>
      <button onClick={disableManagement}>禁用管理页面</button>
      <button onClick={setupMaintenanceMode}>维护模式</button>
    </div>
  );
}
```

### useRoutePermissions Hook

根据用户角色自动配置路由：

```tsx
import { useRoutePermissions } from "@/hooks/useRouteConfig";

function App() {
  const userRoles = ["admin"]; // 从用户状态获取
  const routeConfig = useRoutePermissions(userRoles);

  // 路由会根据用户角色自动配置
  return <AppRouter />;
}
```

### useRouteState Hook

管理单个路由的状态：

```tsx
import { useRouteState } from "@/hooks/useRouteConfig";

function RouteControl({ path }: { path: string }) {
  const {
    routeConfig,
    setVisible,
    setDisabled,
    setShowInSidebar,
    isVisible,
    isDisabled,
    showInSidebar,
  } = useRouteState(path);

  return (
    <div>
      <button onClick={() => setVisible(!isVisible)}>
        {isVisible ? "隐藏" : "显示"}
      </button>
      <button onClick={() => setDisabled(!isDisabled)}>
        {isDisabled ? "启用" : "禁用"}
      </button>
    </div>
  );
}
```

## 实际使用场景

### 1. 根据用户权限控制菜单

```tsx
// 在应用初始化时
const userRoles = getCurrentUser().roles;

if (userRoles.includes("admin")) {
  applyPreset("admin");
} else {
  applyPreset("user");
}
```

### 2. 功能开关控制

```tsx
// 根据功能开关显示/隐藏功能
const featureFlags = getFeatureFlags();

setBatchConfig({
  "/ai": { visible: featureFlags.enableAI },
  "/apps": { visible: featureFlags.enableApps },
  "/platform": { visible: featureFlags.enablePlatform },
});
```

### 3. 维护模式

```tsx
// 系统维护时禁用某些功能
const enableMaintenanceMode = () => {
  setBatchConfig({
    "/ai": { disabled: true },
    "/apps": { disabled: true },
    "/platform": { disabled: true },
  });
};
```

### 4. 环境相关配置

```tsx
// 根据环境自动配置
const env = process.env.NODE_ENV;

if (env === "development") {
  setBatchConfig({
    "/demo": { visible: true, showInSidebar: true },
    "/debug": { visible: true },
  });
} else {
  setBatchConfig({
    "/demo": { visible: false },
    "/debug": { visible: false },
  });
}
```

## 配置持久化

### 保存配置

```tsx
const { getCurrentStates } = useRouteConfig();

// 保存到 localStorage
const saveConfig = () => {
  const config = getCurrentStates();
  localStorage.setItem("routeConfig", JSON.stringify(config));
};
```

### 恢复配置

```tsx
const { setBatchConfig } = useRouteConfig();

// 从 localStorage 恢复
const loadConfig = () => {
  const saved = localStorage.getItem("routeConfig");
  if (saved) {
    const config = JSON.parse(saved);
    setBatchConfig(config);
  }
};
```

## 最佳实践

### 1. 配置原则

- 使用语义化的路由路径
- 合理设置排序权重（1-99）
- 谨慎使用 `visible: false`，优先使用 `showInSidebar: false`

### 2. 性能考虑

- 批量操作使用 `setBatchConfig` 而不是多次单独调用
- 避免在渲染过程中频繁更改配置

### 3. 用户体验

- 提供清晰的状态反馈
- 重要功能变更要有确认提示
- 保持配置的一致性

### 4. 开发建议

- 在开发环境启用所有调试功能
- 为不同环境准备预设配置
- 定期备份重要的路由配置

## 故障排除

### 常见问题

1. **路由不显示**
   - 检查 `visible` 和 `showInSidebar` 设置
   - 确认环境配置是否匹配

2. **配置不生效**
   - 确保调用了 `refreshRoutes()`
   - 检查是否有缓存问题

3. **性能问题**
   - 减少频繁的配置更改
   - 使用批量操作

### 调试方法

```tsx
// 查看当前配置
console.log("Current States:", getCurrentStates());

// 查看可见路由
console.log("Navigation Routes:", navigationRoutes);

// 查看特定路由配置
console.log("Route Config:", getRouteConfig("/demo"));
```

## 更新日志

### v1.0.0
- 初始版本发布
- 基础的显隐控制功能
- 预设配置支持
- React Hooks 集成
