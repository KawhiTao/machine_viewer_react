// API配置文件
import { authToast, apiToast } from "@/utils/toast";

// 全局认证事件处理
export interface AuthEventHandler {
  onTokenExpired?: () => void;
}

let authEventHandler: AuthEventHandler = {};

export const setAuthEventHandler = (handler: AuthEventHandler) => {
  authEventHandler = handler;
};

export const API_CONFIG = {
  // API基础URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "",

  // API版本
  VERSION: "v1",

  // 超时时间 (毫秒)
  TIMEOUT: 10000,

  // 重试次数
  RETRY_COUNT: 3,
} as const;

// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: "/api/v1/login",
    LOGOUT: "/api/v1/logout",
    // REFRESH: "/api/v1/refresh",
    PROFILE: "/api/v1/user/profile",
    REGISTER: "/api/v1/user",
  },

  // 用户相关
  USER: {
    PROFILE: "/api/v1/user/profile",
    // post
    CREATE: "/api/v1/user",
  },

  // 事件相关
  EVENTS: {
    LIST: "/api/v1/event",
    // DETAIL: (id: number) => `/api/v1/events/${id}`,
    // CREATE: "/api/v1/events",
    // UPDATE: (id: number) => `/api/v1/events/${id}`,
    // DELETE: (id: number) => `/api/v1/events/${id}`,
  },
  CHAT: {
    // POST 创建一个新的聊天会话 GET 获取用户的大模型会话列表
    NEW_SESSION: "/api/v1/llm/session",
    // POST 发送聊天消息
    SEND_MESSAGE: "/api/v1/llm/chat",
    // 获取用户的大模型会话消息列表
    SESSION_CHAT: "/api/v1/llm/session/{session_id}/chat",
  },
} as const;

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 请求头配置
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;

// API响应类型定义
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  code: number;
}

// API错误类型定义
export interface ApiError {
  detail: string;
  message?: string;
  code?: number | string;
  errors?: Record<string, string[]>;
}

// 构建完整的API URL
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.replace(/^\//, "");
  return baseUrl ? `${baseUrl}/${cleanEndpoint}` : `/${cleanEndpoint}`;
};

// 获取授权头
export const getAuthHeaders = (
  token?: string | null,
): Record<string, string> => {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// 处理API错误
export const handleApiError = (error: {
  response?: { status: number; data?: unknown };
}): string => {
  // 如果是网络错误
  if (!error.response) {
    return "网络连接失败，请检查网络状态";
  }

  const { status, data } = error.response;

  // 尝试从响应数据中获取错误信息
  let errorData: Record<string, unknown> | null = null;

  if (data) {
    // 如果数据是字符串，尝试解析JSON
    if (typeof data === "string") {
      try {
        errorData = JSON.parse(data);
      } catch {
        // 如果解析失败，直接返回字符串
        return data;
      }
    } else if (typeof data === "object") {
      errorData = data as Record<string, unknown>;
    }

    // 检查常见的错误信息字段
    if (errorData && typeof errorData === "object") {
      if (errorData.message && typeof errorData.message === "string") {
        return errorData.message;
      }
      if (errorData.detail && typeof errorData.detail === "string") {
        return errorData.detail;
      }
      if (errorData.error && typeof errorData.error === "string") {
        return errorData.error;
      }
      if (errorData.msg && typeof errorData.msg === "string") {
        return errorData.msg;
      }
    }
  }

  // 根据状态码返回相应的错误信息
  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return "登录已过期，请重新登录";
    case HTTP_STATUS.FORBIDDEN:
      return "没有权限访问此资源";
    case HTTP_STATUS.NOT_FOUND:
      return "请求的资源不存在";
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return "服务器内部错误，请稍后重试";
    default:
      return `请求失败 (${status})`;
  }
};

// API请求拦截器配置
export const REQUEST_INTERCEPTOR_CONFIG = {
  // 请求超时处理
  timeout: API_CONFIG.TIMEOUT,

  // 请求重试配置
  retry: {
    retries: API_CONFIG.RETRY_COUNT,
    retryDelay: (retryCount: number) => Math.pow(2, retryCount) * 1000, // 指数退避
    retryCondition: (error: { response?: { status: number } }) => {
      // 只在网络错误或5xx错误时重试
      return !error.response || error.response.status >= 500;
    },
  },
} as const;

// 响应拦截器配置
export const RESPONSE_INTERCEPTOR_CONFIG = {
  // 成功响应处理
  onSuccess: (response: { data: unknown }) => {
    return response.data;
  },

  // 错误响应处理
  onError: (error: { response?: { status: number; data?: unknown } }) => {
    const errorMessage = handleApiError(error);
    console.error("API请求错误:", errorMessage, error);

    // 根据错误类型显示相应的Toast通知
    if (!error.response) {
      // 网络错误
      apiToast.networkError();
    } else {
      const status = error.response.status;

      if (status === HTTP_STATUS.UNAUTHORIZED) {
        // 401错误 - 清除本地存储的认证信息
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_refresh_token");
        // 同时清除sessionStorage中的认证信息
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_user");
        sessionStorage.removeItem("auth_refresh_token");

        authToast.tokenExpired();

        // 通知AuthContext处理token过期
        if (authEventHandler.onTokenExpired) {
          authEventHandler.onTokenExpired();
        }
      } else if (status === HTTP_STATUS.FORBIDDEN) {
        authToast.permissionDenied();
      } else if (status >= 500) {
        apiToast.serverError();
      } else {
        // 其他错误显示通用错误提示
        apiToast.requestError(errorMessage);
      }
    }

    return Promise.reject(new Error(errorMessage));
  },
} as const;

export default {
  API_CONFIG,
  API_ENDPOINTS,
  HTTP_STATUS,
  DEFAULT_HEADERS,
  buildApiUrl,
  getAuthHeaders,
  handleApiError,
  REQUEST_INTERCEPTOR_CONFIG,
  RESPONSE_INTERCEPTOR_CONFIG,
};
