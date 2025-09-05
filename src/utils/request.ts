import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
  handleApiError,
  HTTP_STATUS,
} from "@/config/api";
import { authToast, apiToast } from "@/utils/toast";

// 导入全局认证事件处理器
let authEventHandler: { onTokenExpired?: () => void } = {};

// 设置认证事件处理器的函数
export const setRequestAuthEventHandler = (handler: {
  onTokenExpired?: () => void;
}) => {
  authEventHandler = handler;
};

// 请求配置接口
export interface RequestConfig {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  withAuth?: boolean;
  showError?: boolean; // 是否自动显示错误提示
  showSuccess?: boolean; // 是否自动显示成功提示
  successMessage?: string; // 自定义成功提示
  suppressErrorToast?: boolean; // 是否抑制错误 toast，即使 showError 为 true
}

// 响应数据接口
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  code?: number;
  success?: boolean;
}

// 获取存储的token（根据remember_me标记决定存储位置）
const getToken = (): string | null => {
  const rememberMe = localStorage.getItem("remember_me") === "true";
  const storage = rememberMe ? localStorage : sessionStorage;
  return storage.getItem("auth_token");
};

// 基础请求函数
const baseRequest = async <T = unknown>(config: RequestConfig): Promise<T> => {
  const {
    url,
    method = "GET",
    data,
    headers = {},
    timeout = API_CONFIG.TIMEOUT,
    withAuth = true,
    showError = true,
    showSuccess = false,
    successMessage,
    suppressErrorToast = false,
  } = config;

  // 构建完整URL
  const fullUrl = buildApiUrl(url);

  // 构建请求头
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // 添加认证头
  if (withAuth) {
    const token = getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // 构建请求配置
  const fetchConfig: RequestInit = {
    method,
    headers: requestHeaders,
    signal: AbortSignal.timeout(timeout),
  };

  // 添加请求体
  if (data && method !== "GET") {
    if (data instanceof FormData) {
      // FormData类型，移除Content-Type让浏览器自动设置
      delete requestHeaders["Content-Type"];
      fetchConfig.body = data;
    } else {
      fetchConfig.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(fullUrl, fetchConfig);

    // 处理响应
    let responseData: unknown;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // 检查响应状态
    if (!response.ok) {
      const errorMessage = handleApiError({
        response: { status: response.status, data: responseData },
      });

      // 根据状态码显示相应提示和处理
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        // 401错误 - 清除本地存储的认证信息
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_refresh_token");
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_user");
        sessionStorage.removeItem("auth_refresh_token");

        if (showError && !suppressErrorToast) {
          authToast.tokenExpired();
        }

        // 通知全局认证事件处理器
        if (authEventHandler.onTokenExpired) {
          authEventHandler.onTokenExpired();
        }
      } else if (showError && !suppressErrorToast) {
        switch (response.status) {
          case HTTP_STATUS.FORBIDDEN:
            authToast.permissionDenied();
            break;
          case HTTP_STATUS.INTERNAL_SERVER_ERROR:
            apiToast.serverError();
            break;
          default:
            apiToast.requestError(errorMessage);
        }
      }

      throw new Error(errorMessage);
    }

    // 显示成功提示
    if (showSuccess) {
      apiToast.requestSuccess(successMessage || "操作成功");
    }

    return responseData as T;
  } catch (error) {
    // 处理网络错误或超时
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        if (showError && !suppressErrorToast) {
          apiToast.requestError("请求超时，请稍后重试");
        }
        throw new Error("请求超时");
      }

      if (!navigator.onLine) {
        if (showError && !suppressErrorToast) {
          apiToast.networkError();
        }
        throw new Error("网络连接失败");
      }

      // 重新抛出已处理的错误
      throw error;
    }

    // 未知错误
    if (showError && !suppressErrorToast) {
      apiToast.requestError("请求失败，请稍后重试");
    }
    throw new Error("未知错误");
  }
};

// GET 请求
export const get = <T = unknown>(
  url: string,
  params?: Record<string, string | number | boolean | null | undefined>,
  config?: Omit<RequestConfig, "url" | "method">,
): Promise<T> => {
  // 处理查询参数
  let fullUrl = url;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  return baseRequest<T>({
    url: fullUrl,
    method: "GET",
    ...config,
  });
};

// POST 请求
export const post = <T = unknown>(
  url: string,
  data?: unknown,
  config?: Omit<RequestConfig, "url" | "method" | "data">,
): Promise<T> => {
  return baseRequest<T>({
    url,
    method: "POST",
    data,
    ...config,
  });
};

// PUT 请求
export const put = <T = unknown>(
  url: string,
  data?: unknown,
  config?: Omit<RequestConfig, "url" | "method" | "data">,
): Promise<T> => {
  return baseRequest<T>({
    url,
    method: "PUT",
    data,
    ...config,
  });
};

// DELETE 请求
export const del = <T = unknown>(
  url: string,
  config?: Omit<RequestConfig, "url" | "method">,
): Promise<T> => {
  return baseRequest<T>({
    url,
    method: "DELETE",
    ...config,
  });
};

// PATCH 请求
export const patch = <T = unknown>(
  url: string,
  data?: unknown,
  config?: Omit<RequestConfig, "url" | "method" | "data">,
): Promise<T> => {
  return baseRequest<T>({
    url,
    method: "PATCH",
    data,
    ...config,
  });
};

// 上传文件
export const upload = <T = unknown>(
  url: string,
  formData: FormData,
  config?: Omit<RequestConfig, "url" | "method" | "data">,
): Promise<T> => {
  return baseRequest<T>({
    url,
    method: "POST",
    data: formData,
    ...config,
  });
};

// 下载文件
export const download = async (
  url: string,
  filename?: string,
): Promise<void> => {
  try {
    const fullUrl = buildApiUrl(url);
    const headers = getAuthHeaders(getToken());

    const response = await fetch(fullUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(downloadUrl);

    apiToast.requestSuccess("文件下载完成");
  } catch (error) {
    apiToast.requestError("文件下载失败");
    throw error;
  }
};

// 批量请求
export const batch = async <T = unknown>(
  requests: RequestConfig[],
): Promise<T[]> => {
  try {
    const promises = requests.map((config) => baseRequest<T>(config));
    return await Promise.all(promises);
  } catch (error) {
    apiToast.requestError("批量请求失败");
    throw error;
  }
};

// 重试请求
export const retry = async <T = unknown>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (i === maxRetries) {
        break;
      }

      // 等待一段时间后重试
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i)),
      );
    }
  }

  apiToast.requestError(`请求失败，已重试 ${maxRetries} 次`);
  throw lastError!;
};

// 取消请求的控制器映射
const abortControllers = new Map<string, AbortController>();

// 可取消的请求
export const cancellableRequest = <T = unknown>(
  requestId: string,
  config: RequestConfig,
): Promise<T> => {
  // 取消之前的同名请求
  if (abortControllers.has(requestId)) {
    abortControllers.get(requestId)?.abort();
  }

  // 创建新的控制器
  const controller = new AbortController();
  abortControllers.set(requestId, controller);

  return baseRequest<T>({
    ...config,
    // 这里需要修改baseRequest来支持AbortController
  }).finally(() => {
    abortControllers.delete(requestId);
  });
};

// 取消指定请求
export const cancelRequest = (requestId: string): void => {
  const controller = abortControllers.get(requestId);
  if (controller) {
    controller.abort();
    abortControllers.delete(requestId);
  }
};

// 取消所有请求
export const cancelAllRequests = (): void => {
  abortControllers.forEach((controller) => controller.abort());
  abortControllers.clear();
};

// 请求拦截器
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onResponse?: <T>(data: T) => T | Promise<T>;
  onError?: (error: Error) => Error | Promise<Error>;
}

const interceptors: RequestInterceptor[] = [];

// 添加拦截器
export const addInterceptor = (interceptor: RequestInterceptor): void => {
  interceptors.push(interceptor);
};

// 移除拦截器
export const removeInterceptor = (interceptor: RequestInterceptor): void => {
  const index = interceptors.indexOf(interceptor);
  if (index > -1) {
    interceptors.splice(index, 1);
  }
};

// 默认导出
export default {
  get,
  post,
  put,
  delete: del,
  patch,
  upload,
  download,
  batch,
  retry,
  cancellableRequest,
  cancelRequest,
  cancelAllRequests,
  addInterceptor,
  removeInterceptor,
};
