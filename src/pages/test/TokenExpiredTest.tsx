import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { get, post } from "@/utils/request";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
}

export default function TokenExpiredTest() {
  const { state, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const addTestResult = (result: TestResult) => {
    setTestResults((prev) => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // 模拟API调用来触发401错误
  const testTokenExpired = async () => {
    setIsLoading(true);
    clearResults();

    try {
      addTestResult({
        name: "发送带有无效token的API请求",
        status: "pending",
        message: "准备发送请求...",
      });

      // 尝试调用一个需要认证的API端点，但使用无效token
      // 我们可以临时修改token来模拟过期情况
      const originalToken = localStorage.getItem("auth_token");
      const originalSessionToken = sessionStorage.getItem("auth_token");

      // 设置一个无效的token
      localStorage.setItem("auth_token", "invalid_token_12345");
      sessionStorage.setItem("auth_token", "invalid_token_12345");

      try {
        await get(
          "/api/v1/user/profile",
          {},
          {
            showError: false, // 禁用自动错误提示，我们手动处理
            suppressErrorToast: true,
          },
        );

        addTestResult({
          name: "API请求结果",
          status: "error",
          message: "意外成功：API应该返回401错误",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "未知错误";

        if (
          errorMessage.includes("登录已过期") ||
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized")
        ) {
          addTestResult({
            name: "API请求结果",
            status: "success",
            message: "成功触发401错误：" + errorMessage,
          });

          // 检查是否触发了全局登出
          setTimeout(() => {
            const currentPath = window.location.pathname;
            if (currentPath === "/login") {
              addTestResult({
                name: "全局登出和跳转",
                status: "success",
                message: "成功跳转到登录页面",
              });
            } else {
              addTestResult({
                name: "全局登出和跳转",
                status: "error",
                message: `仍在当前页面: ${currentPath}，未跳转到登录页`,
              });
            }
          }, 1000);
        } else {
          addTestResult({
            name: "API请求结果",
            status: "error",
            message: "意外错误：" + errorMessage,
          });
        }
      } finally {
        // 恢复原始token
        if (originalToken) {
          localStorage.setItem("auth_token", originalToken);
        } else {
          localStorage.removeItem("auth_token");
        }

        if (originalSessionToken) {
          sessionStorage.setItem("auth_token", originalSessionToken);
        } else {
          sessionStorage.removeItem("auth_token");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 认证状态诊断
  const diagnoseAuthState = async () => {
    setIsLoading(true);
    clearResults();

    try {
      addTestResult({
        name: "检查当前认证状态",
        status: "pending",
        message: "正在检查认证状态...",
      });

      // 检查localStorage中的认证信息
      const localToken = localStorage.getItem("auth_token");
      const localUser = localStorage.getItem("auth_user");
      const sessionToken = sessionStorage.getItem("auth_token");
      const sessionUser = sessionStorage.getItem("auth_user");

      addTestResult({
        name: "本地存储检查",
        status: "success",
        message: `localStorage token: ${localToken ? "存在" : "不存在"}, user: ${localUser ? "存在" : "不存在"}; sessionStorage token: ${sessionToken ? "存在" : "不存在"}, user: ${sessionUser ? "存在" : "不存在"}`,
      });

      // 检查AuthContext状态
      addTestResult({
        name: "AuthContext状态",
        status: "success",
        message: `认证状态: ${state.isAuthenticated}, 用户: ${state.user?.username || "无"}, 加载中: ${state.isLoading}`,
      });

      // 检查API基础URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "未设置";
      addTestResult({
        name: "API配置",
        status: "success",
        message: `API基础URL: ${apiBaseUrl}`,
      });

      // 尝试检查网络连接
      addTestResult({
        name: "网络状态",
        status: "success",
        message: `在线状态: ${navigator.onLine ? "在线" : "离线"}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      addTestResult({
        name: "认证状态诊断",
        status: "error",
        message: "诊断失败：" + errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 直接使用AuthContext的logout方法测试
  const testDirectLogout = async () => {
    setIsLoading(true);
    clearResults();

    try {
      addTestResult({
        name: "测试登出功能",
        status: "pending",
        message: "准备执行登出...",
      });

      // 使用组件中已获取的logout方法

      addTestResult({
        name: "执行登出",
        status: "success",
        message: "正在执行logout(true)...",
      });

      // 调用logout方法，参数true表示是token过期导致的登出
      logout(true);

      addTestResult({
        name: "登出完成",
        status: "success",
        message: "已调用logout(true)，应该会显示过期提示并跳转",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      addTestResult({
        name: "测试登出功能",
        status: "error",
        message: "测试失败：" + errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 测试正常API调用
  const testNormalRequest = async () => {
    setIsLoading(true);
    try {
      addTestResult({
        name: "正常API请求测试",
        status: "pending",
        message: "发送正常请求...",
      });

      await get(
        "/api/v1/user/profile",
        {},
        {
          showError: false,
          suppressErrorToast: true,
        },
      );

      addTestResult({
        name: "正常API请求测试",
        status: "success",
        message: "API请求成功",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      addTestResult({
        name: "正常API请求测试",
        status: "error",
        message: "请求失败：" + errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">进行中</Badge>;
      case "success":
        return (
          <Badge variant="default" className="bg-green-600">
            成功
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">失败</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            登录过期跳转功能测试
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              这个页面用于测试当API返回401错误时，系统是否会正确清除认证信息并跳转到登录页面。
              <br />
              <strong>注意：</strong>
              运行"测试登录过期"可能会导致您被登出并跳转到登录页。
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <div>
              <strong>当前登录状态：</strong>
              {state.isAuthenticated ? (
                <Badge variant="default" className="ml-2 bg-green-600">
                  已登录
                </Badge>
              ) : (
                <Badge variant="destructive" className="ml-2">
                  未登录
                </Badge>
              )}
            </div>
            {state.user && (
              <div>
                <strong>用户：</strong>
                <span className="ml-2">
                  {state.user.nickname || state.user.username}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={testTokenExpired}
              disabled={isLoading || !state.isAuthenticated}
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  测试中...
                </>
              ) : (
                "API模拟测试（401错误）"
              )}
            </Button>

            <Button
              onClick={diagnoseAuthState}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  诊断中...
                </>
              ) : (
                "诊断认证状态"
              )}
            </Button>

            <Button
              onClick={testDirectLogout}
              disabled={isLoading || !state.isAuthenticated}
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  测试中...
                </>
              ) : (
                "直接测试登出（立即跳转）"
              )}
            </Button>

            <Button
              onClick={testDirectLogout}
              disabled={isLoading || !state.isAuthenticated}
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  测试中...
                </>
              ) : (
                "直接测试登出（立即跳转）"
              )}
            </Button>

            <Button
              onClick={testNormalRequest}
              disabled={isLoading || !state.isAuthenticated}
              variant="outline"
            >
              测试正常API请求
            </Button>

            <Button
              onClick={clearResults}
              disabled={isLoading}
              variant="secondary"
            >
              清除结果
            </Button>
          </div>

          {!state.isAuthenticated && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                您当前未登录，无法进行API测试。请先登录后再使用此功能。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.name}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>技术说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">测试方法：</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>诊断认证状态：</strong>
                检查当前的认证信息、API配置和网络状态
              </li>
              <li>
                <strong>API模拟测试：</strong>
                通过设置无效token并发送真实API请求来触发401错误
              </li>
              <li>
                <strong>直接测试登出：</strong>
                直接调用AuthContext的logout(true)方法，模拟token过期场景
              </li>
              <li>
                <strong>正常API请求：</strong>验证当前认证状态是否正常
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">修复内容：</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                在 <code>request.ts</code> 中添加了全局认证事件处理器
              </li>
              <li>当API返回401错误时，会清除本地存储的认证信息</li>
              <li>
                调用全局认证事件处理器，触发 <code>logout(true)</code>
              </li>
              <li>自动跳转到登录页面并显示"登录已过期"提示</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">工作流程：</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>API请求返回401 Unauthorized状态码</li>
              <li>
                <code>request.ts</code> 中的错误处理器检测到401错误
              </li>
              <li>清除localStorage和sessionStorage中的认证信息</li>
              <li>
                调用 <code>authEventHandler.onTokenExpired()</code>
              </li>
              <li>
                <code>AuthContext</code> 中的处理器执行{" "}
                <code>logout(true)</code>
              </li>
              <li>
                显示"登录已过期"提示并跳转到 <code>/login</code>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
