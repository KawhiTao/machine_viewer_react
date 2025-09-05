import { toast } from "sonner";

// 成功提示
export const showSuccess = (message: string, description?: string) => {
  return toast.success(message, {
    duration: 4000,
    description,
  });
};

// 错误提示
export const showError = (message: string, description?: string) => {
  return toast.error(message, {
    duration: 6000,
    description,
  });
};

// 警告提示
export const showWarning = (message: string, description?: string) => {
  return toast.warning(message, {
    duration: 5000,
    description,
  });
};

// 信息提示
export const showInfo = (message: string, description?: string) => {
  return toast.info(message, {
    duration: 4000,
    description,
  });
};

// 加载中提示
export const showLoading = (message: string = "加载中...") => {
  return toast.loading(message);
};

// 自定义提示
export const showCustom = (message: string, description?: string) => {
  return toast(message, {
    duration: 4000,
    description,
  });
};

// Promise 提示 - 用于异步操作
export const showPromise = <T>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  },
) => {
  return toast.promise(promise, options);
};

// 关闭指定的 toast
export const dismissToast = (id: string | number) => {
  toast.dismiss(id);
};

// 关闭所有 toast
export const dismissAllToasts = () => {
  toast.dismiss();
};

// 认证相关的专用提示
export const authToast = {
  // 登录成功
  loginSuccess: (username?: string) => {
    showSuccess(`欢迎回来${username ? `, ${username}` : ""}！`, "登录成功");
  },

  // 登录失败
  loginError: (error: string) => {
    showError("登录失败", error);
  },

  // 登出成功
  logoutSuccess: () => {
    showInfo("已安全退出", "感谢您的使用");
  },

  // Token 过期
  tokenExpired: () => {
    showWarning("登录已过期", "请重新登录");
  },

  // 权限不足
  permissionDenied: () => {
    showError("权限不足", "您没有权限访问此功能");
  },

  // 登录中
  loggingIn: () => {
    return showLoading("正在登录...");
  },

  // 获取用户信息中
  fetchingUserInfo: () => {
    return showLoading("获取用户信息中...");
  },
};

// API 请求相关的专用提示
export const apiToast = {
  // 网络错误
  networkError: () => {
    showError("网络连接失败", "请检查网络连接后重试");
  },

  // 服务器错误
  serverError: () => {
    showError("服务器错误", "服务器暂时无法响应，请稍后重试");
  },

  // 请求成功
  requestSuccess: (message: string = "操作成功") => {
    showSuccess(message);
  },

  // 请求失败
  requestError: (error: string) => {
    showError("操作失败", error);
  },

  // 保存成功
  saveSuccess: () => {
    showSuccess("保存成功");
  },

  // 删除成功
  deleteSuccess: () => {
    showSuccess("删除成功");
  },

  // 确认删除
  confirmDelete: () =>
    // onConfirm: () => void
    {
      // const confirmId = showWarning("确定要删除吗？", "此操作不可撤销");
      // 注意：这里需要手动处理确认逻辑，因为简化了action配置
    },
};

// 表单相关的专用提示
export const formToast = {
  // 表单验证错误
  validationError: (message: string) => {
    showError("表单验证失败", message);
  },

  // 必填字段提示
  requiredField: (fieldName: string) => {
    showWarning("必填字段", `${fieldName}为必填项`);
  },

  // 保存草稿
  draftSaved: () => {
    showInfo("草稿已保存");
  },
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  custom: showCustom,
  promise: showPromise,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  auth: authToast,
  api: apiToast,
  form: formToast,
};
