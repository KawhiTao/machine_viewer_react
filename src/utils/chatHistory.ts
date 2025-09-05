// 聊天历史记录 IndexedDB 工具函数

export interface HistoryMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  contentType?: "text" | "think";
  thinkingContent?: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
    data?: string; // base64 编码的文件数据
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messagesMap: Record<string, HistoryMessage[]>; // 存储所有模型的消息
  currentModel: string; // 当前选中的模型
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // 预留用户字段
}

const DB_NAME = "ChatHistoryDB";
const DB_VERSION = 3;
const SESSIONS_STORE = "chatSessions";
const FILES_STORE = "chatFiles";

class ChatHistoryDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // 防止重复初始化
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("❌ IndexedDB 打开失败:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ IndexedDB 连接成功");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        console.log(`🔄 IndexedDB 升级中... (${oldVersion} -> ${DB_VERSION})`);

        // 创建聊天会话存储
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, {
            keyPath: "id",
          });

          // 创建索引
          sessionsStore.createIndex("userId", "userId", { unique: false });
          sessionsStore.createIndex("currentModel", "currentModel", {
            unique: false,
          });
          sessionsStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
          sessionsStore.createIndex("updatedAt", "updatedAt", {
            unique: false,
          });
        } else if (oldVersion < 2) {
          // 版本2升级：处理数据结构变化
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          const sessionsStore = transaction!.objectStore(SESSIONS_STORE);

          // 删除旧的model索引，创建新的currentModel索引
          if (sessionsStore.indexNames.contains("model")) {
            sessionsStore.deleteIndex("model");
          }
          if (!sessionsStore.indexNames.contains("currentModel")) {
            sessionsStore.createIndex("currentModel", "currentModel", {
              unique: false,
            });
          }

          // 迁移现有数据
          sessionsStore.openCursor().onsuccess = (cursorEvent: Event) => {
            const cursor = (cursorEvent.target as IDBRequest).result;
            if (cursor) {
              const oldData = cursor.value;
              if (oldData.messages && oldData.model) {
                // 将旧格式转换为新格式
                const newData = {
                  ...oldData,
                  messagesMap: { [oldData.model]: oldData.messages },
                  currentModel: oldData.model,
                };
                delete newData.messages;
                delete newData.model;
                cursor.update(newData);
              }
              cursor.continue();
            }
          };
        } else if (oldVersion < 3) {
          // 版本3升级：支持思维链功能 - thinkingContent 和 contentType 字段
          console.log("🔄 升级到版本3：支持思维链功能");
          // 新字段会在使用时自动添加，无需特殊迁移
        }

        // 创建文件存储（用于存储上传的文件）
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          db.createObjectStore(FILES_STORE, {
            keyPath: "id",
          });
        }
      };
    });
  }

  // 生成会话标题（基于第一条用户消息）
  private generateSessionTitle(
    messagesMap: Record<string, HistoryMessage[]>,
  ): string {
    // 遍历所有模型的消息，找到最早的用户消息
    const allMessages = Object.values(messagesMap).flat();
    const sortedMessages = allMessages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const firstUserMessage = sortedMessages.find((msg) => msg.role === "user");

    if (firstUserMessage) {
      const content = firstUserMessage.content.trim();
      // 取前30个字符作为标题
      return content.length > 30 ? content.substring(0, 30) + "..." : content;
    }
    return "新对话";
  }

  // 创建新会话
  async createSession(
    session: Omit<ChatSession, "id" | "createdAt" | "updatedAt"> & {
      id: string; // 新会话需要明确提供 sessionId
    },
  ): Promise<string> {
    // 确保数据库已初始化
    await this.init();

    if (!this.db) {
      throw new Error("数据库初始化失败");
    }

    const now = new Date();
    const sessionData: ChatSession = {
      id: session.id,
      title: session.title || this.generateSessionTitle(session.messagesMap),
      messagesMap: session.messagesMap,
      currentModel: session.currentModel,
      createdAt: now,
      updatedAt: now,
      userId: session.userId,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], "readwrite");
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.add(sessionData); // 使用 add 而不是 put，确保不覆盖现有会话

      // 确保事务完全提交
      transaction.oncomplete = () => {
        console.log("✅ 新会话已创建:", sessionData.id);
        resolve(sessionData.id);
      };

      transaction.onerror = () => {
        console.error("❌ 创建新会话事务失败:", transaction.error);
        reject(transaction.error);
      };

      request.onerror = () => {
        console.error("❌ 创建新会话请求失败:", request.error);
        reject(request.error);
      };
    });
  }

  // 保存聊天会话
  async saveSession(
    session: Omit<ChatSession, "createdAt" | "updatedAt"> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    updateTimestamp: boolean = true,
  ): Promise<string> {
    // 确保数据库已初始化
    await this.init();

    if (!this.db) {
      throw new Error("数据库初始化失败");
    }

    if (!session.id) {
      throw new Error("sessionId是必需的，必须从外部传入");
    }

    // 只有在更新现有会话时才检查会话是否存在
    if (session.createdAt) {
      // 如果有createdAt，说明是更新现有会话
      try {
        const existingSession = await this.getSession(session.id);
        if (!existingSession) {
          console.warn(`⚠️ 尝试保存已删除的会话，跳过保存: ${session.id}`);
          throw new Error(`会话已被删除: ${session.id}`);
        }
      } catch (error) {
        console.error("❌ 检查会话存在性时出错:", error);
        throw error;
      }
    }
    // 如果没有createdAt，说明是新会话，直接保存

    // 统计要保存的数据
    let totalMessages = 0;
    let totalAttachments = 0;
    let attachmentsWithData = 0;

    Object.values(session.messagesMap || {}).forEach((messages) => {
      totalMessages += messages.length;
      messages.forEach((msg) => {
        if (msg.attachments) {
          totalAttachments += msg.attachments.length;
          attachmentsWithData += msg.attachments.filter(
            (att) => att.data,
          ).length;
        }
      });
    });

    console.log(`💾 准备保存会话数据:`, {
      sessionId: session.id,
      totalMessages,
      totalAttachments,
      attachmentsWithData,
    });

    const now = new Date();

    // 如果是更新现有会话且没有提供标题，从数据库获取现有标题
    let finalTitle = session.title;
    if (session.createdAt && (!session.title || session.title.trim() === "")) {
      try {
        const existingSession = await this.getSession(session.id);
        if (existingSession?.title) {
          finalTitle = existingSession.title;
          console.log(`📝 保留现有会话标题: "${finalTitle}"`);
        }
      } catch (error) {
        console.warn("❌ 获取现有会话标题失败:", error);
      }
    }

    const sessionData: ChatSession = {
      id: session.id,
      title: finalTitle || this.generateSessionTitle(session.messagesMap),
      messagesMap: session.messagesMap,
      currentModel: session.currentModel,
      createdAt: session.createdAt || now,
      updatedAt: updateTimestamp
        ? now
        : session.updatedAt || session.createdAt || now,
      userId: session.userId,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], "readwrite");
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.put(sessionData);

      // 确保事务完全提交
      transaction.oncomplete = () => {
        console.log("✅ 聊天会话已保存:", sessionData.id);
        resolve(sessionData.id);
      };

      transaction.onerror = () => {
        console.error("❌ 保存聊天会话事务失败:", transaction.error);
        reject(transaction.error);
      };

      request.onerror = () => {
        console.error("❌ 保存聊天会话请求失败:", request.error);
        reject(request.error);
      };
    });
  }

  // 获取所有聊天会话
  async getAllSessions(userId?: string): Promise<ChatSession[]> {
    // 确保数据库已初始化
    await this.init();

    if (!this.db) {
      throw new Error("数据库初始化失败");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], "readonly");
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        let sessions = request.result as ChatSession[];

        // 如果指定了用户ID，进行过滤
        if (userId) {
          sessions = sessions.filter((session) => session.userId === userId);
        }

        // 按更新时间倒序排列
        sessions.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

        // 统计原始数据中的图片信息
        let totalMessages = 0;
        let totalAttachments = 0;
        let attachmentsWithData = 0;

        sessions.forEach((session) => {
          Object.values(session.messagesMap || {}).forEach((messages) => {
            totalMessages += messages.length;
            messages.forEach((msg) => {
              if (msg.attachments) {
                totalAttachments += msg.attachments.length;
                attachmentsWithData += msg.attachments.filter(
                  (att) => att.data,
                ).length;
              }
            });
          });
        });

        console.log(`📊 数据库原始数据统计:`, {
          sessions: sessions.length,
          totalMessages,
          totalAttachments,
          attachmentsWithData,
        });

        // 恢复图片数据为可用的URL
        sessions = sessions.map((session) => ({
          ...session,
          messagesMap: Object.fromEntries(
            Object.entries(session.messagesMap || {}).map(
              ([model, messages]) => [
                model,
                messages.map((msg) => ({
                  ...msg,
                  attachments: msg.attachments?.map((att) => {
                    const hasData = !!att.data;
                    const newUrl = hasData
                      ? this.createBlobUrlFromBase64(att.data!, att.type)
                      : att.url;

                    if (hasData) {
                      console.log(`🔗 为图片生成 Blob URL:`, {
                        name: att.name,
                        dataLength: att.data!.length,
                        newUrl: newUrl?.substring(0, 50) + "...",
                      });
                    }

                    return {
                      ...att,
                      url: newUrl,
                    };
                  }),
                })),
              ],
            ),
          ),
        }));

        console.log(`📚 获取到 ${sessions.length} 个聊天会话`);
        resolve(sessions);
      };

      request.onerror = () => {
        console.error("❌ 获取聊天会话失败:", request.error);
        reject(request.error);
      };
    });
  }

  // 获取指定会话
  async getSession(sessionId: string): Promise<ChatSession | null> {
    // 确保数据库已初始化
    await this.init();

    if (!this.db) {
      throw new Error("数据库初始化失败");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], "readonly");
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(sessionId);

      request.onsuccess = () => {
        const session = request.result as ChatSession | undefined;
        console.log(
          session
            ? `✅ 获取会话成功: ${sessionId}`
            : `⚠️ 会话不存在: ${sessionId}`,
        );
        resolve(session || null);
      };

      request.onerror = () => {
        console.error("❌ 获取会话失败:", request.error);
        reject(request.error);
      };
    });
  }

  // 删除会话
  async deleteSession(sessionId: string): Promise<void> {
    // 确保数据库已初始化
    await this.init();

    if (!this.db) {
      throw new Error("数据库初始化失败");
    }

    // 先检查会话是否存在
    console.log(`🔍 检查删除前会话状态: ${sessionId}`);
    const existingSession = await this.getSession(sessionId);
    if (!existingSession) {
      console.log(`⚠️ 要删除的会话不存在: ${sessionId}`);
      return;
    }

    console.log(`📝 找到要删除的会话: ${existingSession.title}`);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], "readwrite");
      const store = transaction.objectStore(SESSIONS_STORE);

      console.log(`🗄️ 开始执行数据库删除: ${sessionId}`);
      const request = store.delete(sessionId);

      // 监听删除请求的成功事件
      request.onsuccess = () => {
        console.log(`✅ 删除请求成功: ${sessionId}`);
      };

      // 确保事务完全提交
      transaction.oncomplete = () => {
        console.log(`🎉 删除事务提交完成: ${sessionId}`);

        // 事务完成后再次验证
        setTimeout(async () => {
          try {
            const verifySession = await this.getSession(sessionId);
            if (verifySession) {
              console.error(`❌ 删除验证失败，会话仍存在: ${sessionId}`);
              reject(new Error(`会话删除失败，仍存在于数据库中: ${sessionId}`));
            } else {
              console.log(`✅ 删除验证通过，会话已不存在: ${sessionId}`);
              resolve();
            }
          } catch (error) {
            console.error(`❌ 删除验证过程出错:`, error);
            reject(error);
          }
        }, 100);
      };

      transaction.onerror = () => {
        console.error("❌ 删除会话事务失败:", transaction.error);
        reject(transaction.error);
      };

      transaction.onabort = () => {
        console.error("❌ 删除会话事务被中止");
        reject(new Error("删除事务被中止"));
      };
      request.onerror = () => {
        console.error("❌ 删除会话请求失败:", request.error);
        reject(request.error);
      };
    });
  }

  // 更新会话标题
  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("会话不存在");
    }

    session.title = title;
    session.updatedAt = new Date();

    await this.saveSession(session, true);
  }

  // 清空所有历史记录
  async clearAllHistory(): Promise<void> {
    // 确保数据库已初始化
    await this.init();

    if (!this.db) {
      throw new Error("数据库初始化失败");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [SESSIONS_STORE, FILES_STORE],
        "readwrite",
      );

      const sessionsStore = transaction.objectStore(SESSIONS_STORE);
      const filesStore = transaction.objectStore(FILES_STORE);

      // 执行清空操作
      sessionsStore.clear();
      filesStore.clear();

      // 确保事务完全提交
      transaction.oncomplete = () => {
        console.log("🧹 所有历史记录已清空");
        resolve();
      };

      transaction.onerror = () => {
        console.error("❌ 清空历史记录事务失败:", transaction.error);
        reject(transaction.error);
      };
    });
  }

  // 获取数据库统计信息
  async getStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalSize: number;
  }> {
    const sessions = await this.getAllSessions();
    const totalMessages = sessions.reduce(
      (sum, session) =>
        sum + Object.values(session.messagesMap || {}).flat().length,
      0,
    );

    // 估算存储大小（简单计算）
    const totalSize = JSON.stringify(sessions).length;

    return {
      totalSessions: sessions.length,
      totalMessages,
      totalSize,
    };
  }

  // 从base64创建Blob URL
  private createBlobUrlFromBase64(
    base64Data: string,
    mimeType: string,
  ): string {
    try {
      // 移除data:image/xxx;base64,前缀（如果存在）
      const base64 = base64Data.includes(",")
        ? base64Data.split(",")[1]
        : base64Data;
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("创建Blob URL失败:", error);
      return "";
    }
  }
}

// 单例模式
export const chatHistoryDB = new ChatHistoryDB();

// 初始化数据库（防止重复初始化）
let initPromise: Promise<void> | null = null;

export const initChatHistoryDB = async (): Promise<void> => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await chatHistoryDB.init();
      console.log("🚀 聊天历史数据库初始化完成");
    } catch (error) {
      console.error("❌ 聊天历史数据库初始化失败:", error);
      // 重置 promise，允许重试
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

// 工具函数：将现有消息格式转换为历史消息格式（包含图片数据转换）
export const convertToHistoryMessage = async (message: {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  isInterrupted?: boolean;
  contentType?: "text" | "think";
  thinkingContent?: string;
  attachments?: {
    id?: string;
    name: string;
    type: string;
    size: number;
    url?: string;
    file?: File | null;
    base64Data?: string;
  }[];
}): Promise<HistoryMessage> => {
  console.log("🔄 convertToHistoryMessage - 输入消息:", {
    id: message.id,
    attachments: message.attachments?.map((att) => ({
      name: att.name,
      type: att.type,
      hasFile: !!att.file,
      hasBase64Data: !!att.base64Data,
      urlType: att.url?.startsWith("blob:")
        ? "blob"
        : att.url?.startsWith("data:")
          ? "data"
          : "other",
    })),
  });

  const attachments = message.attachments
    ? await Promise.all(
        message.attachments.map(async (att) => {
          let data: string | undefined;

          // 优先使用现有的 base64Data
          if (att.base64Data) {
            data = att.base64Data;
            console.log("✅ 使用现有的 base64Data:", att.name);
          }
          // 如果是图片文件，转换为base64存储
          else if (att.file && att.type.startsWith("image/")) {
            try {
              data = await fileToBase64(att.file);
              console.log("✅ 从文件转换 base64:", att.name);
            } catch (error) {
              console.error("❌ 图片转换base64失败:", att.name, error);
            }
          }
          // 如果 URL 是 data URL，提取 base64 数据
          else if (att.url && att.url.startsWith("data:image/")) {
            try {
              data = att.url;
              console.log("✅ 使用 data URL:", att.name);
            } catch (error) {
              console.error("❌ 处理 data URL 失败:", att.name, error);
            }
          } else {
            console.warn("⚠️ 图片附件缺少 base64 数据:", att.name, {
              hasBase64Data: !!att.base64Data,
              hasFile: !!att.file,
              urlType: att.url?.startsWith("blob:")
                ? "blob"
                : att.url?.startsWith("data:")
                  ? "data"
                  : "other",
            });
          }

          const result = {
            id:
              att.id ||
              `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: att.name,
            type: att.type,
            size: att.size,
            url: att.url,
            data,
          };

          console.log("📦 attachment 转换结果:", {
            name: result.name,
            hasData: !!result.data,
            dataLength: result.data?.length || 0,
          });

          return result;
        }),
      )
    : undefined;

  const historyMessage = {
    id: message.id,
    content: message.content,
    role: message.role,
    timestamp: message.timestamp,
    isTyping: message.isTyping,
    contentType: message.contentType,
    thinkingContent: message.thinkingContent,
    attachments,
  };

  console.log("✅ convertToHistoryMessage - 输出结果:", {
    id: historyMessage.id,
    attachmentsCount: historyMessage.attachments?.length || 0,
    attachmentsWithData:
      historyMessage.attachments?.filter((att) => att.data).length || 0,
  });

  return historyMessage;
};

// 文件转base64的辅助函数
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

// 工具函数：将历史消息格式转换为现有消息格式
export const convertFromHistoryMessage = (
  historyMessage: HistoryMessage,
): {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  isInterrupted?: boolean;
  contentType?: "text" | "think";
  thinkingContent?: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    file: File | null;
    base64Data?: string; // 保留 base64 数据用于图片恢复
  }[];
} => {
  console.log("🔄 convertFromHistoryMessage - 输入历史消息:", {
    id: historyMessage.id,
    attachments: historyMessage.attachments?.map((att) => ({
      name: att.name,
      type: att.type,
      hasData: !!att.data,
      dataLength: att.data?.length || 0,
    })),
  });

  // 检查是否为被中断的消息（AI消息且isTyping为true）
  const isInterrupted =
    historyMessage.role === "assistant" && historyMessage.isTyping === true;

  const result = {
    id: historyMessage.id,
    content: historyMessage.content,
    role: historyMessage.role,
    timestamp: historyMessage.timestamp,
    isTyping: false, // 历史消息加载时不再是输入状态
    isInterrupted, // 标记是否被中断
    contentType: historyMessage.contentType,
    thinkingContent: historyMessage.thinkingContent,
    attachments: historyMessage.attachments?.map((att) => ({
      id: att.id,
      name: att.name,
      type: att.type,
      size: att.size,
      url: att.url || "",
      file: null, // 历史消息中不包含原始文件对象
      base64Data: att.data, // 保留 base64 数据用于图片恢复
    })),
  };

  console.log("✅ convertFromHistoryMessage - 输出结果:", {
    id: result.id,
    attachmentsCount: result.attachments?.length || 0,
    attachmentsWithBase64:
      result.attachments?.filter((att) => att.base64Data).length || 0,
  });

  return result;
};

// 调试函数：检查 IndexedDB 中的原始数据
export const debugIndexedDBData = async (): Promise<void> => {
  await initChatHistoryDB();

  if (!chatHistoryDB["db"]) {
    console.error("❌ 数据库未初始化");
    return;
  }

  const db = chatHistoryDB["db"];

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], "readonly");
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const sessions = request.result as ChatSession[];

      console.log("🔍 IndexedDB 原始数据检查:");
      console.log(`总会话数: ${sessions.length}`);
      console.log(`数据库名: ${db.name}, 版本: ${db.version}`);

      if (sessions.length === 0) {
        console.log("📭 数据库中没有会话数据");
      } else {
        console.log("📋 会话列表:");
        sessions.forEach((session, sessionIndex) => {
          console.log(
            `📁 ${sessionIndex + 1}. ${session.id} - "${session.title}"`,
          );
          console.log(
            `   创建: ${session.createdAt}, 更新: ${session.updatedAt}`,
          );

          const totalMessages = Object.values(session.messagesMap || {}).reduce(
            (sum, messages) => sum + messages.length,
            0,
          );
          console.log(`   消息数: ${totalMessages}`);

          Object.entries(session.messagesMap || {}).forEach(
            ([model, messages]) => {
              if (messages.length > 0) {
                console.log(`   📝 ${model}: ${messages.length} 条消息`);

                messages.forEach((msg, msgIndex) => {
                  if (msg.attachments && msg.attachments.length > 0) {
                    console.log(
                      `     💬 消息 ${msgIndex + 1}: ${msg.attachments.length} 个附件`,
                    );
                    msg.attachments.forEach((att, attIndex) => {
                      console.log(
                        `       📎 ${attIndex + 1}. ${att.name} (${att.type}, ${att.size}字节)`,
                        {
                          hasData: !!att.data,
                          dataLength: att.data?.length || 0,
                        },
                      );
                    });
                  }
                });
              }
            },
          );
        });
      }

      resolve();
    };

    request.onerror = () => {
      console.error("❌ 读取 IndexedDB 数据失败:", request.error);
      reject(request.error);
    };
  });
};

// 调试函数：检查特定会话是否存在
export const debugCheckSession = async (sessionId: string): Promise<void> => {
  await initChatHistoryDB();
  console.log(`🔍 检查会话是否存在: ${sessionId}`);

  try {
    const session = await chatHistoryDB.getSession(sessionId);
    if (session) {
      console.log(`✅ 会话存在: "${session.title}"`);
      console.log(`   ID: ${session.id}`);
      console.log(`   创建时间: ${session.createdAt}`);
      console.log(`   更新时间: ${session.updatedAt}`);
    } else {
      console.log(`❌ 会话不存在: ${sessionId}`);
    }
  } catch (error) {
    console.error(`❌ 检查会话时出错:`, error);
  }
};

// 增强的调试函数：验证删除操作
export const debugVerifyDeletion = async (
  sessionId: string,
): Promise<boolean> => {
  await initChatHistoryDB();
  console.log(`🔍 验证删除操作: ${sessionId}`);

  try {
    // 多次检查确保删除成功
    for (let i = 0; i < 5; i++) {
      const session = await chatHistoryDB.getSession(sessionId);
      if (session) {
        console.warn(`⚠️ 第${i + 1}次检查: 会话仍存在 "${session.title}"`);
        if (i < 4) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } else {
        console.log(`✅ 第${i + 1}次检查: 会话已删除`);
        return true;
      }
    }

    console.error(`❌ 删除验证失败: 会话 ${sessionId} 在5次检查后仍然存在`);
    return false;
  } catch (error) {
    console.error(`❌ 删除验证过程出错:`, error);
    return false;
  }
};

// 调试函数：强制删除会话
export const debugForceDeleteSession = async (
  sessionId: string,
): Promise<void> => {
  await initChatHistoryDB();

  if (!chatHistoryDB["db"]) {
    throw new Error("数据库未初始化");
  }

  const db = chatHistoryDB["db"];
  console.log(`💪 强制删除会话: ${sessionId}`);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], "readwrite");
    const store = transaction.objectStore(SESSIONS_STORE);

    // 先获取会话确认存在
    const getRequest = store.get(sessionId);

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        console.log(`ℹ️ 会话不存在，无需删除: ${sessionId}`);
        resolve();
        return;
      }

      console.log(`📝 找到会话: "${getRequest.result.title}"`);

      // 执行删除
      const deleteRequest = store.delete(sessionId);

      deleteRequest.onsuccess = () => {
        console.log(`✅ 强制删除请求成功: ${sessionId}`);
      };

      deleteRequest.onerror = () => {
        console.error(`❌ 强制删除请求失败:`, deleteRequest.error);
        reject(deleteRequest.error);
      };
    };

    getRequest.onerror = () => {
      console.error(`❌ 获取会话失败:`, getRequest.error);
      reject(getRequest.error);
    };

    transaction.oncomplete = () => {
      console.log(`🎉 强制删除事务完成: ${sessionId}`);
      resolve();
    };

    transaction.onerror = () => {
      console.error(`❌ 强制删除事务失败:`, transaction.error);
      reject(transaction.error);
    };
  });
};

// 将调试函数暴露到全局window对象，方便在浏览器控制台中使用
declare global {
  interface Window {
    debugChatHistory: {
      debugIndexedDBData: () => Promise<void>;
      debugCheckSession: (sessionId: string) => Promise<void>;
      debugVerifyDeletion: (sessionId: string) => Promise<boolean>;
      debugForceDeleteSession: (sessionId: string) => Promise<void>;
    };
  }
}

if (typeof window !== "undefined") {
  console.log("🔧 开始设置调试工具，检查函数定义:", {
    debugIndexedDBData: typeof debugIndexedDBData,
    debugCheckSession: typeof debugCheckSession,
    debugVerifyDeletion: typeof debugVerifyDeletion,
    debugForceDeleteSession: typeof debugForceDeleteSession,
  });

  window.debugChatHistory = {
    debugIndexedDBData,
    debugCheckSession,
    debugVerifyDeletion,
    debugForceDeleteSession,
  };
  console.log("🔧 聊天历史调试工具已加载到 window.debugChatHistory");
}
