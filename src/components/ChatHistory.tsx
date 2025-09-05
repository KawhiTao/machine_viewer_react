import React, { useState, useEffect, useCallback } from "react";
import {
  chatHistoryDB,
  type ChatSession,
  type HistoryMessage,
  initChatHistoryDB,
} from "../utils/chatHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { get } from "@/utils/request";
import { API_ENDPOINTS } from "@/config/api";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  MessageSquare,
  Video,
  Edit3,
  Trash2,
  MoreHorizontal,
  History,
  Database,
  CloudDownload,
  RotateCcw,
} from "lucide-react";

// 远程会话数据接口类型
interface RemoteSession {
  id: number;
  userId: number;
  sessionName: string;
  sessionType: string;
  createTime: string;
  createTimestamp: number;
  updateTime: string;
  updateTimestamp: number;
}

// API响应数据类型
interface RemoteSessionsResponse {
  current: number;
  pages: number;
  size: number;
  total: number;
  records: RemoteSession[];
}

// 实际API响应格式（与ApiResponse不同）
interface ActualApiResponse<T = unknown> {
  status: boolean;
  message: string;
  code: number;
  data: T;
}

interface ChatHistoryProps {
  onSelectSession: (session: ChatSession) => void;
  currentSessionId?: string;
  onNewChat: () => void;
  messagesMap?: Record<string, HistoryMessage[]>; // 用于实时更新

  refreshTrigger?: boolean; // 刷新触发器
  onDeletingStateChange?: (isDeleting: boolean) => void; // 删除状态变化回调
  onSessionDeleted?: (sessionId: string) => void; // 会话删除完成回调
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  onSelectSession,
  currentSessionId,
  onNewChat,
  messagesMap,
  refreshTrigger,
  onDeletingStateChange,
  onSessionDeleted,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    totalSize: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // 获取远程会话列表
  const fetchRemoteSessions = useCallback(async (): Promise<
    RemoteSession[]
  > => {
    try {
      console.log("🌐 开始获取远程会话列表");
      let allRemoteSessions: RemoteSession[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      let totalPages = 0;

      while (hasMorePages) {
        console.log(`📡 请求第 ${currentPage} 页数据...`);

        const response: ActualApiResponse<RemoteSessionsResponse> = await get(
          `${API_ENDPOINTS.CHAT.NEW_SESSION}?page=${currentPage}&size=50`,
        );

        console.log(`📡 API响应:`, {
          status: response.status,
          hasData: !!response.data,
          hasRecords: !!response.data?.records,
          recordsLength: response.data?.records?.length || 0,
          currentPage: response.data?.current,
          totalPages: response.data?.pages,
        });

        if (response.status === true && response.data?.records) {
          allRemoteSessions = [...allRemoteSessions, ...response.data.records];
          totalPages = response.data.pages;

          console.log(
            `📄 成功获取第 ${currentPage}/${totalPages} 页，本页 ${response.data.records.length} 条记录，累计 ${allRemoteSessions.length} 条`,
          );

          // 检查是否还有更多页面
          hasMorePages = currentPage < response.data.pages;
          currentPage++;

          // 安全检查：避免无限循环
          if (currentPage > 100) {
            console.error("❌ 达到最大页数限制，停止获取");
            break;
          }
        } else {
          console.warn("⚠️ 远程会话API响应格式不正确:", {
            status: response.status,
            hasData: !!response.data,
            response: JSON.stringify(response).substring(0, 200) + "...",
          });
          hasMorePages = false;
        }
      }

      console.log(
        `✅ 远程数据获取完成: ${allRemoteSessions.length} 个会话，共 ${totalPages} 页`,
      );
      return allRemoteSessions;
    } catch (error) {
      console.error("❌ 获取远程会话失败:", error);
      throw error;
    }
  }, []);

  // 将远程会话转换为本地会话格式
  const convertRemoteToLocalSession = useCallback(
    (remoteSession: RemoteSession): Omit<ChatSession, "messagesMap"> => {
      return {
        id: remoteSession.id.toString(),
        title: remoteSession.sessionName,
        currentModel:
          remoteSession.sessionType === "vision" ? "vision" : "chat",
        createdAt: new Date(remoteSession.createTime),
        updatedAt: new Date(remoteSession.updateTime),
      };
    },
    [],
  );

  // 同步远程数据到本地
  const syncWithRemote = useCallback(async () => {
    if (isSyncing) {
      console.log("⏸️ 同步正在进行中，跳过此次同步");
      return;
    }

    console.log("🚀 启动远程数据同步流程");
    setIsSyncing(true);

    try {
      console.log("🔄 开始同步远程数据");

      // 获取远程会话列表
      const remoteSessions = await fetchRemoteSessions();

      if (remoteSessions.length === 0) {
        console.log("ℹ️ 远程没有会话数据，同步完成");
        setLastSyncTime(new Date());
        return;
      }

      // 获取本地会话列表
      const localSessions = await chatHistoryDB.getAllSessions();
      const localSessionMap = new Map(localSessions.map((s) => [s.id, s]));

      console.log(`📊 数据对比分析:`, {
        本地会话数量: localSessions.length,
        远程会话数量: remoteSessions.length,
        本地会话IDs: localSessions.map((s) => s.id).slice(0, 5),
        远程会话IDs: remoteSessions.map((s) => s.id.toString()).slice(0, 5),
      });

      // 需要更新的会话
      const sessionsToUpdate: ChatSession[] = [];
      // 需要创建的新会话
      const sessionsToCreate: ChatSession[] = [];

      // 分析远程会话
      for (const remoteSession of remoteSessions) {
        const remoteId = remoteSession.id.toString();
        const localSession = localSessionMap.get(remoteId);

        if (localSession) {
          // 检查是否需要更新
          const remoteUpdatedAt = new Date(remoteSession.updateTime);
          const localUpdatedAt = localSession.updatedAt;

          console.log(`🔍 检查会话 ${remoteId}:`, {
            远程更新时间: remoteUpdatedAt.toISOString(),
            本地更新时间: localUpdatedAt.toISOString(),
            时间差: remoteUpdatedAt.getTime() - localUpdatedAt.getTime(),
            需要更新:
              remoteUpdatedAt.getTime() > localUpdatedAt.getTime() + 1000,
          });

          // 只有远程时间明显更新时才同步（避免微小时间差异导致频繁更新）
          if (remoteUpdatedAt.getTime() > localUpdatedAt.getTime() + 1000) {
            // 1秒容差
            console.log(
              `🔄 标记更新会话: ${remoteId} (${remoteSession.sessionName})`,
            );
            sessionsToUpdate.push({
              ...localSession,
              title: remoteSession.sessionName,
              currentModel:
                remoteSession.sessionType === "vision" ? "vision" : "chat",
              updatedAt: remoteUpdatedAt,
            });
          }
        } else {
          // 新会话，需要创建
          console.log(
            `➕ 标记新建会话: ${remoteId} (${remoteSession.sessionName})`,
          );
          const newSession: ChatSession = {
            ...convertRemoteToLocalSession(remoteSession),
            messagesMap: {}, // 暂时为空，稍后可以通过其他API获取具体消息
          };
          sessionsToCreate.push(newSession);
        }
      }

      console.log(
        `📝 同步计划: 新建 ${sessionsToCreate.length} 个，更新 ${sessionsToUpdate.length} 个`,
      );

      // 批量更新本地数据库
      let hasChanges = false;

      // 创建新会话
      if (sessionsToCreate.length > 0) {
        console.log(`➕ 开始创建 ${sessionsToCreate.length} 个新会话`);
        for (const [index, session] of sessionsToCreate.entries()) {
          console.log(
            `  创建进度 ${index + 1}/${sessionsToCreate.length}: ${session.id}`,
          );
          await chatHistoryDB.createSession(session);
        }
        hasChanges = true;
      }

      // 更新现有会话
      if (sessionsToUpdate.length > 0) {
        console.log(`🔄 开始更新 ${sessionsToUpdate.length} 个会话`);
        for (const [index, session] of sessionsToUpdate.entries()) {
          console.log(
            `  更新进度 ${index + 1}/${sessionsToUpdate.length}: ${session.id}`,
          );
          await chatHistoryDB.updateSessionTitle(
            session.id,
            session.title || "",
          );
        }
        hasChanges = true;
      }

      // 如果有变化，重新加载本地数据
      if (hasChanges) {
        console.log("✅ 检测到数据变化，重新加载本地会话列表");
        // 重新获取数据库中的会话列表
        const updatedSessions = await chatHistoryDB.getAllSessions();
        // 按更新时间降序排序（最新的在前面）
        const sortedSessions = [...updatedSessions].sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
        );
        setSessions(sortedSessions);

        // 更新统计信息
        const statsData = await chatHistoryDB.getStats();
        setStats(statsData);

        console.log(`📊 更新后统计: ${updatedSessions.length} 个会话`);
      } else {
        console.log("ℹ️ 数据无变化，跳过界面更新");
      }

      setLastSyncTime(new Date());
      console.log("🎉 远程数据同步流程完成");
    } catch (error) {
      console.error("❌ 同步远程数据失败:", error);
      console.error(
        "错误详情:",
        error instanceof Error ? error.message : String(error),
      );
      // 同步失败不影响现有功能，继续使用本地数据
    } finally {
      console.log("🏁 同步状态重置");
      setIsSyncing(false);
    }
  }, [fetchRemoteSessions, convertRemoteToLocalSession, isSyncing]);

  // 加载会话列表
  const loadSessions = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }
      try {
        // 确保数据库已初始化
        await initChatHistoryDB();

        const allSessions = await chatHistoryDB.getAllSessions();

        // 使用平滑更新，避免闪动
        setSessions((prevSessions) => {
          // 按更新时间降序排序（最新的在前面）
          const sortedSessions = [...allSessions].sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          );

          // 如果数据实际没有变化，就不更新以避免重新渲染
          if (
            prevSessions.length === sortedSessions.length &&
            prevSessions.every(
              (session, index) =>
                session.id === sortedSessions[index]?.id &&
                session.updatedAt.getTime() ===
                  sortedSessions[index]?.updatedAt.getTime(),
            )
          ) {
            return prevSessions;
          }
          return sortedSessions;
        });

        // 获取统计信息
        const statsData = await chatHistoryDB.getStats();
        setStats(statsData);

        console.log(`📚 加载了 ${allSessions.length} 个历史会话`);

        // 检查是否需要返回新对话页面
        // 如果当前有会话ID但已经没有任何会话，则自动返回新对话
        if (allSessions.length === 0 && currentSessionId) {
          console.log("🔄 检测到会话数量为0，自动返回新对话页面");
          onNewChat();
        }
      } catch (error) {
        console.error("❌ 加载历史会话失败:", error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [currentSessionId, onNewChat],
  );

  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        // 加载本地数据
        setLoading(true);
        try {
          await initChatHistoryDB();
          const allSessions = await chatHistoryDB.getAllSessions();
          // 按更新时间降序排序（最新的在前面）
          const sortedSessions = [...allSessions].sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          );
          setSessions(sortedSessions);
          const statsData = await chatHistoryDB.getStats();
          setStats(statsData);
          console.log(`📚 初始加载了 ${sortedSessions.length} 个历史会话`);
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ 初始化聊天历史失败:", error);
        setLoading(false);
      }
    };

    init();
  }, []); // 只在组件挂载时执行一次

  // 移除自动刷新逻辑，改为手动刷新

  // 监听刷新触发器变化
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      // 后台刷新，不显示loading状态
      loadSessions(false);
    }
  }, [refreshTrigger, loadSessions]);

  // 手动刷新历史记录的方法
  const refreshHistory = useCallback(async () => {
    await loadSessions(true);
  }, [loadSessions]);

  // 手动同步远程数据
  const handleSyncRemote = useCallback(async () => {
    await syncWithRemote();
  }, [syncWithRemote]);

  // 实时更新当前会话的显示信息
  const getCurrentSessionInfo = useCallback(
    (session: ChatSession) => {
      if (session.id === currentSessionId && messagesMap) {
        // 使用实时数据更新显示
        const totalMessages = Object.values(messagesMap).flat().length;
        const hasMessages = totalMessages > 0;

        if (hasMessages) {
          return {
            ...session,
            messagesMap: messagesMap as Record<string, HistoryMessage[]>,
          };
        }
      }
      return session;
    },
    [currentSessionId, messagesMap],
  );

  // 过滤会话
  const filteredSessions = sessions.filter(
    (session) =>
      session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(session.messagesMap || {})
        .flat()
        .some((msg) =>
          msg.content.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
  );

  // 删除会话
  const handleDeleteSession = async (
    sessionId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    console.log(`🗑️ 准备删除会话: ${sessionId}`);
    setSessionToDelete(sessionId);
  };

  // 确认删除会话
  const confirmDeleteSession = async () => {
    if (!sessionToDelete) {
      console.warn("⚠️ 没有要删除的会话ID");
      return;
    }

    if (isDeleting) {
      console.warn("⚠️ 正在删除中，忽略重复操作");
      return;
    }

    const deletingSessionId = sessionToDelete;
    console.log(`🔄 开始删除会话: ${deletingSessionId}`);
    console.log(`📊 删除前会话数量: ${sessions.length}`);
    console.log(
      `🎯 要删除的会话详情:`,
      sessions.find((s) => s.id === deletingSessionId),
    );

    // 检查是否删除的是当前活跃会话
    const isDeletingCurrentSession = currentSessionId === deletingSessionId;
    console.log(`🎯 是否删除当前活跃会话: ${isDeletingCurrentSession}`);

    setIsDeleting(true);

    // 通知父组件开始删除状态
    console.log(`📢 通知父组件开始删除状态: ${deletingSessionId}`);
    onDeletingStateChange?.(true);

    // 保存原始状态以便回滚
    const originalSessions = sessions;

    try {
      // 先从本地状态中立即移除，提供即时反馈
      setSessions((prevSessions) => {
        const filtered = prevSessions.filter((s) => s.id !== deletingSessionId);
        console.log(
          `📝 本地状态更新: ${prevSessions.length} -> ${filtered.length} 个会话`,
        );
        return filtered;
      });

      // 重试删除操作，最多尝试3次
      let retryCount = 0;
      const maxRetries = 3;
      let deleteSuccess = false;

      while (retryCount < maxRetries && !deleteSuccess) {
        try {
          if (retryCount > 0) {
            console.log(`🔄 删除重试第 ${retryCount} 次: ${deletingSessionId}`);
            // 重试前等待一下
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          // 执行数据库删除操作
          console.log(`🗄️ 执行数据库删除操作: ${deletingSessionId}`);
          await chatHistoryDB.deleteSession(deletingSessionId);
          console.log(`✅ 数据库删除成功: ${deletingSessionId}`);

          // 验证删除结果
          console.log("🔍 验证删除结果");
          const deletedSession =
            await chatHistoryDB.getSession(deletingSessionId);

          if (deletedSession) {
            console.error(
              `❌ 删除验证失败: 会话 ${deletingSessionId} 仍然存在`,
            );
            throw new Error(`会话删除失败: ${deletingSessionId}`);
          }

          deleteSuccess = true;
          console.log(`✅ 删除验证通过: ${deletingSessionId}`);
        } catch (error) {
          retryCount++;
          console.error(`❌ 删除尝试 ${retryCount} 失败:`, error);

          if (retryCount >= maxRetries) {
            throw error;
          }
        }
      }

      // 重新加载会话列表以确保状态同步
      console.log("🔄 重新加载会话列表");
      await loadSessions(false);

      // 检查删除后是否需要返回新对话页面
      const remainingSessions = await chatHistoryDB.getAllSessions();
      console.log(`📊 删除后剩余会话数量: ${remainingSessions.length}`);
      console.log(`🔍 验证删除结果: 会话 ${deletingSessionId} 是否还存在?`);

      const verifyDeletedSession =
        await chatHistoryDB.getSession(deletingSessionId);
      if (verifyDeletedSession) {
        console.error(
          `❌ 严重错误: 会话 ${deletingSessionId} 在删除后仍然存在!`,
        );
        throw new Error(`删除失败: 会话仍然存在于数据库中`);
      } else {
        console.log(`✅ 删除验证通过: 会话 ${deletingSessionId} 已完全移除`);
      }

      // 如果删除的是当前活跃会话，需要切换到新对话页面
      if (isDeletingCurrentSession) {
        console.log("🔄 删除的是当前活跃会话，切换到新对话页面");
        onNewChat();
      } else if (remainingSessions.length === 0 && currentSessionId) {
        console.log("🔄 删除后会话数量为0，自动返回新对话页面");
        onNewChat();
      }

      console.log(`🎉 成功删除会话: ${deletingSessionId}`);

      // 通知父组件会话删除完成
      onSessionDeleted?.(deletingSessionId);
    } catch (error) {
      console.error("❌ 删除会话最终失败:", error);

      // 删除失败时恢复原始状态
      console.log("🔄 删除失败，恢复原始状态");
      setSessions(originalSessions);

      // 显示错误提示
      alert(
        `删除会话失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );

      // 重新加载以确保状态一致
      await loadSessions();
    } finally {
      // 清理状态
      console.log("🧹 清理删除状态");
      setSessionToDelete(null);
      setIsDeleting(false);

      // 通知父组件删除状态结束
      console.log(`📢 通知父组件删除状态结束`);
      onDeletingStateChange?.(false);
    }
  };

  // 开始编辑标题
  const handleStartEdit = (session: ChatSession, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title || "对话");
  };

  // 保存标题
  const handleSaveTitle = async (sessionId: string) => {
    if (
      editingTitle.trim() &&
      editingTitle !== sessions.find((s) => s.id === sessionId)?.title
    ) {
      try {
        await chatHistoryDB.updateSessionTitle(sessionId, editingTitle.trim());
        await loadSessions(false);
        console.log(`✏️ 已更新会话标题: ${sessionId}`);
      } catch (error) {
        console.error("❌ 更新标题失败:", error);
      }
    }
    setEditingId(null);
    setEditingTitle("");
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  // 清空所有历史
  const handleClearAllHistory = async () => {
    try {
      // 先重置右侧对话界面，避免在清空过程中重新保存会话
      onNewChat();

      // 等待界面重置完成
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 先清空本地状态，提供即时反馈
      setSessions([]);
      setStats({ totalSessions: 0, totalMessages: 0, totalSize: 0 });

      // 执行数据库清空操作
      await chatHistoryDB.clearAllHistory();

      // 确保数据库操作完成后再刷新
      setTimeout(async () => {
        await loadSessions(false);
      }, 100);

      // 关闭对话框
      setIsAlertDialogOpen(false);

      console.log("🧹 所有历史记录已清空，对话界面已重置");
    } catch (error) {
      console.error("❌ 清空历史记录失败:", error);
      // 清空失败时重新加载恢复状态
      await loadSessions();
    }
  };

  // 格式化时间
  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    if (diff < 86400000) {
      // 24小时内
      return d.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diff < 604800000) {
      // 7天内
      const days = Math.floor(diff / 86400000);
      return `${days}天前`;
    } else {
      return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    }
  };

  // 格式化存储大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="h-full w-80 border-r border-border bg-background flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">聊天历史</h2>
            {isSyncing && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSyncRemote}
                  disabled={isSyncing}
                  className="h-7 w-7 p-0 flex items-center justify-center"
                >
                  <CloudDownload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSyncing ? "同步中..." : "手动同步远程数据"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshHistory}
                  className="h-7 w-7 p-0 flex items-center justify-center"
                >
                  <Database className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>刷新本地数据</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* 新建对话按钮 */}
        <Button onClick={onNewChat} className="w-full mb-3 h-9" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          新建对话
        </Button>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索历史对话..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-hidden">
        {loading && sessions.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">
              {searchTerm ? "没有找到匹配的对话" : "暂无历史对话"}
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-2">
              <div className="space-y-2 transition-all duration-200">
                {filteredSessions.map((session) => {
                  const sessionInfo = getCurrentSessionInfo(session);
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session)}
                      className={`group relative rounded-lg p-3 cursor-pointer transition-all duration-200 border hover:shadow-sm animate-in fade-in-0 slide-in-from-top-1 h-[80px] ${
                        currentSessionId === session.id
                          ? "bg-accent border-primary/40 shadow-sm border-l-4 border-l-primary"
                          : "bg-card border-border/40 hover:bg-accent/60 hover:border-border"
                      }`}
                      style={{
                        animationDelay: `${filteredSessions.indexOf(session) * 20}ms`,
                      }}
                    >
                      <div className="flex flex-col justify-between h-full">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 mr-2">
                            {editingId === session.id ? (
                              <Input
                                value={editingTitle}
                                onChange={(e) =>
                                  setEditingTitle(e.target.value)
                                }
                                onBlur={() => handleSaveTitle(session.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveTitle(session.id);
                                  } else if (e.key === "Escape") {
                                    handleCancelEdit();
                                  }
                                }}
                                className="h-6 text-sm font-medium"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <h3 className="text-sm font-medium group-hover:text-primary text-foreground truncate leading-tight">
                                {session.title || "对话"}
                              </h3>
                            )}
                          </div>

                          {/* 操作按钮 */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32">
                                <DropdownMenuItem
                                  onClick={(e) => handleStartEdit(session, e)}
                                >
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  重命名
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSession(session.id, e);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant={
                                session.currentModel === "vision"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs h-4 px-1.5 flex items-center gap-0.5"
                            >
                              {session.currentModel === "vision" ? (
                                <Video className="h-2.5 w-2.5" />
                              ) : (
                                <MessageSquare className="h-2.5 w-2.5" />
                              )}
                              <span className="text-[10px]">
                                {session.currentModel === "vision"
                                  ? "视图"
                                  : "语义"}
                              </span>
                            </Badge>
                            <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                              {
                                Object.values(
                                  sessionInfo.messagesMap || {},
                                ).flat().length
                              }
                              条消息
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground/70 flex-shrink-0">
                            {formatTime(session.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部统计和操作 */}
      <div className="flex-shrink-0 p-2.5 border-t border-border bg-background">
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground transition-all duration-200">
          <Database className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {stats.totalSessions} 个对话 · {stats.totalMessages} 条消息 ·{" "}
            {formatSize(stats.totalSize)}
          </span>
        </div>
        {lastSyncTime && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground/70">
            <RotateCcw className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              最后同步: {formatTime(lastSyncTime)}
            </span>
          </div>
        )}

        <AlertDialog
          open={isAlertDialogOpen}
          onOpenChange={setIsAlertDialogOpen}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sessions.length === 0}
                  className="w-full h-7 text-xs text-destructive border-destructive/20 hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  清空历史
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {sessions.length === 0
                  ? "暂无历史记录"
                  : "清空所有聊天历史记录"}
              </p>
            </TooltipContent>
          </Tooltip>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认清空历史记录</AlertDialogTitle>
              <AlertDialogDescription>
                确定要清空所有聊天历史记录吗？
                <br />
                <br />
                这将删除所有模型（语义和视图）的对话记录和上传的图片，此操作不可恢复！
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAllHistory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                确认清空
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 删除单个会话的Alert Dialog */}
        <AlertDialog
          open={sessionToDelete !== null}
          onOpenChange={(open) => {
            if (!open) {
              console.log("❌ 取消删除会话");
              setSessionToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除对话</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除这个对话吗？此操作不可恢复！
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteSession}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ChatHistory;
