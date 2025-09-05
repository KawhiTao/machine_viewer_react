import { useCallback, useMemo, useContext } from "react";
import AuthContext from "@/contexts/AuthContext";
import type { AuthContextType } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

// 使用认证上下文的Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// 权限检查Hook
export const usePermissions = () => {
  const { hasRole, hasAnyRole, hasAllRoles, state } = useAuth();

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin: hasRole("admin"),
    isUser: hasRole("user"),
    userRoles: state.user?.roles || [],
  };
};

// 扩展的认证Hook
export const useAuthExtended = () => {
  const authContext = useAuth();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  // 登录并记住来源页面
  const loginWithRedirect = useCallback(
    async (credentials: {
      username: string;
      password: string;
      grant_type?: string;
      scope?: string;
    }) => {
      const from = location.state?.from || "/home";
      await authContext.login(credentials);
      navigate(from, { replace: true });
    },
    [authContext, navigate, location.state],
  );

  // 安全登出
  const logoutWithConfirm = useCallback(
    (showConfirm = true, showExpiredMessage = false) => {
      if (showConfirm) {
        const confirmed = window.confirm("确定要退出登录吗？");
        if (!confirmed) return;
      }
      authContext.logout(showExpiredMessage);
    },
    [authContext],
  );

  // 检查是否需要重新登录
  const requiresReauth = useMemo(() => {
    const { isAuthenticated, token, error } = authContext.state;
    return !isAuthenticated || !token || error === "认证已过期";
  }, [authContext.state]);

  return {
    ...authContext,
    ...permissions,
    loginWithRedirect,
    logoutWithConfirm,
    requiresReauth,
  };
};

// 登录状态Hook
export const useLoginStatus = () => {
  const { state } = useAuth();

  return {
    isLoggedIn: state.isAuthenticated,
    isLoggingIn: state.isLoading,
    loginError: state.error,
    user: state.user,
  };
};

// 用户角色Hook
export const useUserRoles = () => {
  const { state } = useAuth();

  const roles = useMemo(() => {
    return state.user?.roles || [];
  }, [state.user?.roles]);

  const hasRole = useCallback(
    (role: string) => {
      return roles.includes(role);
    },
    [roles],
  );

  const hasAnyRole = useCallback(
    (requiredRoles: string[]) => {
      return requiredRoles.some((role) => roles.includes(role));
    },
    [roles],
  );

  const hasAllRoles = useCallback(
    (requiredRoles: string[]) => {
      return requiredRoles.every((role) => roles.includes(role));
    },
    [roles],
  );

  const isAdmin = useMemo(() => {
    return hasRole("admin");
  }, [hasRole]);

  const isUser = useMemo(() => {
    return hasRole("user");
  }, [hasRole]);

  return {
    roles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isUser,
  };
};

// 用户信息Hook
export const useUserInfo = () => {
  const { state, updateUser } = useAuth();

  const user = state.user;

  const updateProfile = useCallback(
    (updates: Partial<NonNullable<typeof user>>) => {
      if (user) {
        updateUser(updates);
      }
    },
    [updateUser, user],
  );

  return {
    user,
    updateProfile,
    isLoaded: !!user,
  };
};

// 认证状态变化监听Hook
export const useAuthStateChange = (
  callback: (isAuthenticated: boolean) => void,
) => {
  const { state } = useAuth();

  useMemo(() => {
    callback(state.isAuthenticated);
  }, [state.isAuthenticated, callback]);
};

export default useAuth;
