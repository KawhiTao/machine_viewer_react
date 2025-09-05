import { useAuth } from "@/hooks/useAuth";
import { routeRequiresAuth, hasRoutePermission } from "@/config/routes";

// Hook: 检查当前用户是否可以访问指定路径
export const useCanAccess = (path: string, additionalRoles: string[] = []) => {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return false;
  }

  const needsAuth = routeRequiresAuth(path);
  if (needsAuth && !state.isAuthenticated) {
    return false;
  }

  const userRoles = state.user?.roles || [];
  const hasPathPermission = hasRoutePermission(path, userRoles);
  const hasAdditionalPermission =
    additionalRoles.length === 0 ||
    additionalRoles.some((role) => userRoles.includes(role));

  return hasPathPermission && hasAdditionalPermission;
};

// Hook: 检查多个路径的访问权限
export const useCanAccessMultiple = (paths: string[]) => {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return paths.reduce(
      (acc, path) => {
        acc[path] = false;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }

  const userRoles = state.user?.roles || [];

  return paths.reduce(
    (acc, path) => {
      const needsAuth = routeRequiresAuth(path);
      const hasPathPermission = hasRoutePermission(path, userRoles);
      acc[path] = !needsAuth || hasPathPermission;
      return acc;
    },
    {} as Record<string, boolean>,
  );
};

// Hook: 获取用户可访问的路径列表
export const useAccessiblePaths = (paths: string[]) => {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return [];
  }

  const userRoles = state.user?.roles || [];

  return paths.filter((path) => {
    const needsAuth = routeRequiresAuth(path);
    if (!needsAuth) return true;
    return hasRoutePermission(path, userRoles);
  });
};

// Hook: 检查是否有特定角色权限
export const useHasRole = (role: string) => {
  const { state } = useAuth();
  return state.user?.roles.includes(role) || false;
};

// Hook: 检查是否有任意一个角色权限
export const useHasAnyRole = (roles: string[]) => {
  const { state } = useAuth();
  return roles.some((role) => state.user?.roles.includes(role)) || false;
};

// Hook: 检查是否有所有角色权限
export const useHasAllRoles = (roles: string[]) => {
  const { state } = useAuth();
  return roles.every((role) => state.user?.roles.includes(role)) || false;
};
