import React, {
  createContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_ENDPOINTS, setAuthEventHandler } from "@/config/api";
import { authToast } from "@/utils/toast";
import { post, get, setRequestAuthEventHandler } from "@/utils/request";

// API 响应类型定义
interface ApiResponse<T> {
  status: boolean;
  message: string;
  code: number;
  data: T;
}

interface UserApiResponse {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  createTime: string;
  updateTime: string;
  superuser: boolean;
  email?: string;
}

interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
}

// 用户信息类型定义 - 基于API UserVO
export interface User {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  createTime: string;
  updateTime: string;
  superuser: boolean;
  // 扩展字段用于前端显示
  email?: string;
  roles: string[];
  avatar?: string;
  nickname?: string;
  department?: string;
}

// 认证状态类型定义
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  error: string | null;
}

// 认证操作类型定义
export type AuthAction =
  | { type: "LOGIN_START" }
  | {
      type: "LOGIN_SUCCESS";
      payload: { user: User; token: string; refreshToken?: string };
    }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean }
  | {
      type: "REFRESH_TOKEN_SUCCESS";
      payload: { token: string; refreshToken?: string };
    }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; payload: Partial<User> };

// 登录请求参数 - 基于API Body_用户登录_api_v1_login_post
export interface LoginRequest {
  grant_type?: string;
  username: string;
  password: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
  rememberMe?: boolean; // 记住我选项
}

// 登录响应数据 - 基于API JwtVO
export interface LoginResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
}

// 认证上下文类型定义
export interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: (showExpiredMessage?: boolean) => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
}

// 初始状态 - 根据存储的认证信息快速确定初始状态
const getInitialState = (): AuthState => {
  const hasRemembered = localStorage.getItem("remember_me") === "true";
  const storage = hasRemembered ? localStorage : sessionStorage;
  const token = storage.getItem("auth_token");
  const userData = storage.getItem("auth_user");

  // 如果有token和用户数据，初始状态为已认证，避免loading
  if (token && userData) {
    try {
      const user = JSON.parse(userData);
      return {
        isAuthenticated: true,
        isLoading: false, // 直接设为已完成加载
        user,
        token,
        refreshToken: storage.getItem("auth_refresh_token"),
        error: null,
      };
    } catch (error) {
      console.warn("解析用户数据失败:", error);
    }
  }

  return {
    isAuthenticated: false,
    isLoading: false, // 没有存储的认证信息时也不需要loading
    user: null,
    token: null,
    refreshToken: null,
    error: null,
  };
};

const initialState: AuthState = getInitialState();

// 认证状态减速器
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken || null,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        refreshToken: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        refreshToken: null,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "REFRESH_TOKEN_SUCCESS":
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken || state.refreshToken,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 存储键名常量
const STORAGE_KEYS = {
  TOKEN: "auth_token",
  REFRESH_TOKEN: "auth_refresh_token",
  USER: "auth_user",
} as const;

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();
  const hasInitialized = useRef(false); // 防止重复初始化的标志

  // 根据remember_me标记决定使用哪种存储
  const getStorageType = (): Storage => {
    const rememberMe = localStorage.getItem("remember_me") === "true";
    return rememberMe ? localStorage : sessionStorage;
  };

  // 获取refresh token
  const getStoredRefreshToken = (): string | null => {
    const storage = getStorageType();
    return storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  };

  // 存储认证信息
  const storeAuthData = (
    token: string,
    user: User,
    refreshToken?: string,
    rememberMe: boolean = false,
  ) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    // 存储认证数据
    storage.setItem(STORAGE_KEYS.TOKEN, token);
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (refreshToken) {
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    // 清除另一个存储中的数据，避免冲突
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem(STORAGE_KEYS.TOKEN);
    otherStorage.removeItem(STORAGE_KEYS.USER);
    otherStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  };

  // 清除认证信息
  const clearAuthData = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
  };

  // 真实API调用 - 调用实际的登录接口
  const loginAPI = async (
    credentials: LoginRequest,
  ): Promise<LoginResponse> => {
    const formData = new FormData();
    formData.append("grant_type", credentials.grant_type || "password");
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);
    if (credentials.scope) formData.append("scope", credentials.scope);
    if (credentials.client_id)
      formData.append("client_id", credentials.client_id);
    if (credentials.client_secret)
      formData.append("client_secret", credentials.client_secret);

    return await post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, formData, {
      withAuth: false,
      showError: false, // 我们手动处理错误
    });
  };

  // 获取用户信息API
  const getUserInfoAPI = async (token: string): Promise<User> => {
    // 临时设置token到当前使用的存储中
    const storage = getStorageType();
    const originalToken = storage.getItem("auth_token");
    storage.setItem("auth_token", token);

    try {
      const apiResponse = (await get(
        API_ENDPOINTS.AUTH.PROFILE,
        {},
        {
          showError: false, // 我们手动处理错误
        },
      )) as ApiResponse<UserApiResponse>;

      const userData = apiResponse.data;

      // 将API返回的UserVO转换为前端User类型
      const user: User = {
        id: userData.id || 0,
        username: userData.username || "unknown",
        firstname: userData.firstname || undefined,
        lastname: userData.lastname || undefined,
        createTime: userData.createTime || "",
        updateTime: userData.updateTime || "",
        superuser: Boolean(userData.superuser),
        // 根据superuser字段设置角色
        roles: userData.superuser ? ["admin", "user"] : ["user"],
        nickname:
          userData.firstname &&
          userData.lastname &&
          userData.firstname.trim() &&
          userData.lastname.trim() &&
          userData.firstname.trim() !== "string" &&
          userData.lastname.trim() !== "string"
            ? `${userData.firstname} ${userData.lastname}`.trim()
            : userData.username || "用户",
        email: userData.email || undefined,
      };

      return user;
    } finally {
      // 恢复原来的token
      const storage = getStorageType();
      if (originalToken) {
        storage.setItem("auth_token", originalToken);
      } else {
        storage.removeItem("auth_token");
      }
    }
  };

  // 刷新token API - 如果后端支持refresh token
  const refreshTokenAPI = async (
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token?: string }> => {
    const formData = new FormData();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refreshToken);

    const data = (await post(API_ENDPOINTS.AUTH.LOGIN, formData, {
      withAuth: false,
      showError: false,
    })) as TokenRefreshResponse;

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
  };

  // 登录函数
  const login = async (credentials: LoginRequest): Promise<void> => {
    dispatch({ type: "LOGIN_START" });
    const loadingToastId = authToast.loggingIn();

    try {
      // 调用登录API获取token
      const loginResponse = await loginAPI(credentials);

      // 使用token获取用户信息
      const userInfo = await getUserInfoAPI(loginResponse.access_token);

      // 存储认证信息
      storeAuthData(
        loginResponse.access_token,
        userInfo,
        loginResponse.refresh_token,
        credentials.rememberMe || false,
      );

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: userInfo,
          token: loginResponse.access_token,
          refreshToken: loginResponse.refresh_token,
        },
      });

      // 关闭加载提示，显示成功提示
      toast.dismiss(loadingToastId);
      authToast.loginSuccess(userInfo.nickname || userInfo.username);

      // 登录成功后跳转到首页
      navigate("/home");
    } catch (error) {
      // 关闭加载提示
      toast.dismiss(loadingToastId);

      const errorMessage = error instanceof Error ? error.message : "登录失败";
      dispatch({ type: "LOGIN_FAILURE", payload: errorMessage });

      // 显示登录失败提示
      authToast.loginError(errorMessage);
    }
  };

  // 登出函数
  const logout = useCallback(
    (showExpiredMessage: boolean = false) => {
      clearAuthData();
      dispatch({ type: "LOGOUT" });

      if (showExpiredMessage) {
        authToast.tokenExpired();
      } else {
        authToast.logoutSuccess();
      }

      navigate("/login", {
        state: showExpiredMessage
          ? { message: "登录已过期，请重新登录" }
          : undefined,
      });
    },
    [navigate],
  );

  // 刷新token函数
  const refreshTokenFn = useCallback(async (): Promise<void> => {
    const currentRefreshToken = state.refreshToken || getStoredRefreshToken();

    if (!currentRefreshToken) {
      logout(true);
      return;
    }

    try {
      const response = await refreshTokenAPI(currentRefreshToken);

      // 更新存储的token
      const storage = getStorageType();
      storage.setItem(STORAGE_KEYS.TOKEN, response.access_token);
      if (response.refresh_token) {
        storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
      }

      dispatch({
        type: "REFRESH_TOKEN_SUCCESS",
        payload: {
          token: response.access_token,
          refreshToken: response.refresh_token,
        },
      });
    } catch (error) {
      console.error("刷新token失败:", error);
      logout(true);
    }
  }, [state.refreshToken, logout]);

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      const storage = getStorageType();
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      dispatch({ type: "UPDATE_USER", payload: userData });
    }
  };

  // 清除错误
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // 权限检查函数
  const hasRole = (role: string): boolean => {
    return state.user?.roles.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every((role) => hasRole(role));
  };

  // 简化的初始化 - 如果初始状态已经确定了认证信息，不需要额外处理
  useEffect(() => {
    // 如果已经初始化过，或者初始状态已经有认证信息，直接返回
    if (hasInitialized.current || state.isAuthenticated) {
      hasInitialized.current = true;
      return;
    }

    hasInitialized.current = true;
    // 初始状态已经在 getInitialState 中处理完毕，这里不需要额外操作
  }, [state.isAuthenticated]);

  // token自动刷新和状态监控
  useEffect(() => {
    if (!state.isAuthenticated || !state.token || !state.user) return;

    // 设置定时刷新token（实际项目中应根据expires_in设置）
    const refreshInterval = setInterval(
      () => {
        refreshTokenFn();
      },
      30 * 60 * 1000,
    ); // 30分钟刷新一次

    // 监听页面可见性变化，页面重新激活时验证token
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && state.isAuthenticated) {
        try {
          // 验证当前token是否仍然有效
          await getUserInfoAPI(state.token || "");
        } catch (error) {
          console.warn("页面激活时token验证失败，需要重新登录", error);
          logout(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.isAuthenticated, state.token, state.user, refreshTokenFn, logout]);

  // 注册全局认证事件处理器
  useEffect(() => {
    const handler = {
      onTokenExpired: () => {
        // 只有在当前仍处于认证状态时才执行logout，避免重复调用
        if (state.isAuthenticated) {
          logout(true);
        }
      },
    };

    // 设置API配置中的认证事件处理器
    setAuthEventHandler(handler);

    // 设置request模块中的认证事件处理器
    setRequestAuthEventHandler(handler);
  }, [logout, state.isAuthenticated]);

  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    refreshToken: refreshTokenFn,
    updateUser,
    clearError,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
