import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typewriter } from "@/components/ui/typewriter";
import {
  Search,
  Mic,
  Send,
  Plus,
  MessageCircle,
  User,
  Bot,
  X,
  FileText,
  Image,
  File,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import ImagePreview from "@/components/ImagePreview";
import { memo } from "react";

// 添加全局样式来在悬停时显示滚动条
const scrollbarStyle = `
  .files-scroll {
    overflow-x: auto !important;
    overflow-y: hidden !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
    -webkit-overflow-scrolling: touch;
    position: relative;
  }

  /* 隐藏默认滚动条 */
  .files-scroll::-webkit-scrollbar {
    height: 6px !important;
    width: 6px !important;
    background: transparent !important;
  }

  .files-scroll::-webkit-scrollbar-track {
    background: transparent !important;
    border-radius: 3px;
  }

  .files-scroll::-webkit-scrollbar-thumb {
    background: transparent !important;
    border-radius: 3px;
    transition: background 0.2s ease !important;
  }

  /* 悬停时显示滚动条 */
  .files-scroll:hover {
    scrollbar-width: thin !important;
    scrollbar-color: rgba(156, 163, 175, 0.6) transparent !important;
  }

  .files-scroll:hover::-webkit-scrollbar {
    background: rgba(0, 0, 0, 0.05) !important;
  }

  .files-scroll:hover::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05) !important;
  }

  .files-scroll:hover::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.6) !important;
  }

  .files-scroll:hover::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.8) !important;
  }

  /* Firefox 兼容性 */
  @supports (scrollbar-width: thin) {
    .files-scroll {
      scrollbar-width: none;
    }
    .files-scroll:hover {
      scrollbar-width: thin;
      scrollbar-color: rgba(156, 163, 175, 0.6) transparent;
    }
  }
`;

interface AIModel {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  attachments?: UploadedFile[];
}

// 稳定的Typewriter组件，完全隔离状态
const StableTypewriter = memo(
  ({
    messageId,
    text,
    delay,
    speed,
    showCursor,
    cursorChar,
    className,
  }: {
    messageId: string;
    text: string;
    delay: number;
    speed: number;
    showCursor: boolean;
    cursorChar: string;
    className?: string;
  }) => {
    return (
      <Typewriter
        key={messageId} // 使用messageId作为key确保稳定性
        text={text}
        delay={delay}
        speed={speed}
        showCursor={showCursor}
        cursorChar={cursorChar}
        className={className}
      />
    );
  },
  (prevProps, nextProps) => {
    // 只有messageId、text和className变化时才重新创建
    return (
      prevProps.messageId === nextProps.messageId &&
      prevProps.text === nextProps.text &&
      prevProps.className === nextProps.className
    );
  },
);

StableTypewriter.displayName = "StableTypewriter";

// 文件预览组件
const FilePreview = memo(
  ({
    file,
    onRemove,
    allFiles,
    onPreviewAll,
  }: {
    file: UploadedFile;
    onRemove: () => void;
    allFiles: UploadedFile[];
    onPreviewAll?: (startIndex: number) => void;
  }) => {
    const [showPreview, setShowPreview] = useState(false);

    const getFileIcon = (type: string) => {
      if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
      if (type === "application/pdf") return <FileText className="w-4 h-4" />;
      return <File className="w-4 h-4" />;
    };

    const isImage = file.type?.startsWith("image/");

    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="relative group flex-shrink-0"
        >
          <div
            onClick={() => {
              if (isImage) {
                if (onPreviewAll && allFiles.length > 1) {
                  // 如果有多张图片，使用统一预览
                  const imageFiles = allFiles.filter((f) =>
                    f.type?.startsWith("image/"),
                  );
                  const currentIndex = imageFiles.findIndex(
                    (f) => f.id === file.id,
                  );
                  onPreviewAll(currentIndex >= 0 ? currentIndex : 0);
                } else {
                  // 单张图片使用独立预览
                  setShowPreview(true);
                }
              }
            }}
            className="relative flex items-center gap-2 h-8 px-3 bg-muted rounded-lg border border-border/30 hover:border-border transition-all duration-200 min-w-[120px] flex-shrink-0 overflow-hidden cursor-pointer"
          >
            {/* 文件图标或预览 */}
            <div className="flex items-center justify-center flex-shrink-0">
              {isImage ? (
                <div className="w-5 h-5 rounded-full overflow-hidden">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="text-muted-foreground">
                  {getFileIcon(file.type)}
                </div>
              )}
            </div>

            {/* 文件信息 */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-foreground">
                {file.name.length > 12
                  ? file.name.substring(0, 12) + "..."
                  : file.name}
              </p>
            </div>

            {/* 删除按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive rounded-full flex-shrink-0"
              onClick={onRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </motion.div>

        {/* 只在单张图片或没有统一预览功能时显示 */}
        {(!onPreviewAll ||
          allFiles.filter((f) => f.type?.startsWith("image/")).length <= 1) && (
          <ImagePreview
            images={[
              {
                src: file.url,
                alt: file.name,
                fileName: file.name,
                fileSize: file.size,
              },
            ]}
            currentIndex={0}
            isOpen={showPreview && isImage}
            onClose={() => setShowPreview(false)}
          />
        )}
      </>
    );
  },
);

FilePreview.displayName = "FilePreview";

// 消息组件 - 完全分离到外部，防止父组件状态变化影响
const MessageItem = memo(
  ({ message }: { message: Message }) => {
    const isUser = message.role === "user";
    const [previewImages, setPreviewImages] = useState<
      {
        url: string;
        name: string;
        size: number;
      }[]
    >([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    return (
      <div
        style={{
          willChange: message.isTyping ? "transform, opacity" : "auto",
          transform: "translateZ(0)", // 硬件加速
        }}
        className={cn(
          "flex gap-3 mb-3",
          isUser ? "justify-end" : "justify-start",
        )}
      >
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 " />
            </div>
          </div>
        )}

        <div
          className={cn(
            "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ease-out",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border",
            message.isTyping && "animate-pulse",
          )}
        >
          {/* 附件显示区域 */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-3 pb-3 border-b border-border/20">
              <div
                className="files-scroll"
                style={{
                  display: "flex",
                  gap: "8px",
                  padding: "4px 0 8px 0",
                  width: "100%",
                  overflowX: "auto",
                  overflowY: "hidden",
                  scrollbarWidth: "thin",
                  scrollbarColor: "transparent transparent",
                }}
              >
                {message.attachments.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => {
                      if (file.type.startsWith("image/")) {
                        // 获取消息中所有图片文件
                        const imageFiles =
                          message.attachments
                            ?.filter((f) => f.type.startsWith("image/"))
                            .map((f) => ({
                              url: f.url,
                              name: f.name,
                              size: f.size || 0,
                            })) || [];

                        // 找到当前点击图片的索引
                        const clickedIndex = imageFiles.findIndex(
                          (img) => img.url === file.url,
                        );

                        setPreviewImages(imageFiles);
                        setCurrentIndex(clickedIndex >= 0 ? clickedIndex : 0);
                        setIsPreviewOpen(true);
                      } else {
                        // 非图片文件在新标签页打开
                        window.open(file.url, "_blank");
                      }
                    }}
                    className="cursor-pointer flex-shrink-0 flex items-center gap-2 px-2 py-1 bg-background/10 rounded-full min-w-fit hover:bg-background/20 transition-colors"
                    title={
                      file.type.startsWith("image/")
                        ? "点击预览图片"
                        : "点击在新标签页打开文件"
                    }
                  >
                    {file.type.startsWith("image/") ? (
                      <div className="relative group">
                        <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                          <Eye className="w-3 h-3 text-white drop-shadow-sm" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative group w-6 h-6 flex items-center justify-center text-xs opacity-70 hover:opacity-100 transition-opacity">
                        {file.type === "application/pdf" ? (
                          <FileText className="w-3 h-3" />
                        ) : (
                          <File className="w-3 h-3" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                          <div className="text-white text-xs">↗</div>
                        </div>
                      </div>
                    )}
                    <span className="text-xs opacity-80 max-w-[80px] truncate">
                      {file.name.split(".")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-hidden">
            {message.content && (
              <>
                {message.isTyping ? (
                  <div className="min-h-[1.25rem]">
                    <StableTypewriter
                      messageId={message.id}
                      text={message.content}
                      delay={0}
                      speed={30}
                      showCursor={true}
                      cursorChar="|"
                      className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                    />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
              </>
            )}
          </div>
          <div
            className={cn(
              "text-xs mt-2 opacity-60 transition-opacity duration-200",
              isUser ? "text-right" : "text-left",
            )}
          >
            {message.timestamp.toLocaleTimeString("zh-CN", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-background" />
            </div>
          </div>
        )}

        {/* 图片预览组件 */}
        <ImagePreview
          images={previewImages.map((img) => ({
            src: img.url,
            alt: img.name,
            fileName: img.name,
            fileSize: img.size,
          }))}
          currentIndex={currentIndex}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onIndexChange={setCurrentIndex}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 更精确的比较，减少不必要的重新渲染
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.isTyping === nextProps.message.isTyping &&
      prevProps.message.role === nextProps.message.role &&
      prevProps.message.timestamp.getTime() ===
        nextProps.message.timestamp.getTime()
    );
  },
);

MessageItem.displayName = "MessageItem";

const aiModels: AIModel[] = [
  {
    id: "text",
    name: "语义大模型",
    icon: "🗣️",
  },
  // {
  //   id: "language",
  //   name: "交通语言模型",
  //   icon: "🗣️",
  // },
  {
    id: "video",
    name: "视图大模型",
    icon: "📹",
  },
];

function AgentText() {
  // 确保样式被正确注入
  useEffect(() => {
    const styleId = "files-scroll-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = scrollbarStyle;
      document.head.appendChild(style);
      console.log("✅ 滚动条样式已注入到页面");
    } else {
      console.log("✅ 滚动条样式已存在");
    }

    // 检查样式是否生效
    setTimeout(() => {
      const filesScrollElements = document.querySelectorAll(".files-scroll");
      console.log(`🔍 找到 ${filesScrollElements.length} 个 files-scroll 元素`);
      filesScrollElements.forEach((el, index) => {
        const computedStyle = window.getComputedStyle(el);
        console.log(`📊 元素 ${index + 1} 样式:`, {
          overflowX: computedStyle.overflowX,
          overflowY: computedStyle.overflowY,
          scrollbarWidth: computedStyle.scrollbarWidth,
        });
      });
    }, 100);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
        console.log("🗑️ 滚动条样式已清理");
      }
    };
  }, []);
  const [selectedModel, setSelectedModel] = useState<string>("text");
  const [message, setMessage] = useState<string>("");
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({
    text: [],
    language: [],
    video: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, x: 0 });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [filePreviewImages, setFilePreviewImages] = useState<UploadedFile[]>(
    [],
  );
  const [filePreviewIndex, setFilePreviewIndex] = useState(0);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);

  // 处理文件预览
  const handlePreviewAllFiles = useCallback(
    (startIndex: number) => {
      const imageFiles = uploadedFiles.filter((f) =>
        f.type?.startsWith("image/"),
      );
      setFilePreviewImages(imageFiles);
      setFilePreviewIndex(startIndex);
      setIsFilePreviewOpen(true);
    },
    [uploadedFiles],
  );

  // 获取当前模型的消息 - 使用useMemo稳定引用
  const messages = useMemo(
    () => messagesMap[selectedModel] || [],
    [messagesMap, selectedModel],
  );

  const updateIndicator = useCallback((modelId: string) => {
    const selectedIndex = aiModels.findIndex((m) => m.id === modelId);

    // 计算累计偏移
    let totalOffset = 6; // 容器的padding-left
    let selectedWidth = 0;

    for (let i = 0; i < aiModels.length; i++) {
      const button = buttonRefs.current[i];
      if (button) {
        const buttonWidth = button.offsetWidth;

        if (i === selectedIndex) {
          selectedWidth = buttonWidth;
          break;
        }

        totalOffset += buttonWidth + 8; // 8px是gap-2的间距
      }
    }

    setIndicatorStyle({
      width: selectedWidth,
      x: totalOffset,
    });
  }, []);

  // 模拟AI回复逻辑
  const getAIResponse = (userMessage: string, modelId: string): string => {
    const responses = {
      text: [
        `基于交通文本分析，我理解您提到的"${userMessage}"。建议您在高速行驶时保持安全车距，遵守交通规则。`,
        `通过文本分析，我发现您关心的交通问题。根据相关法规，这种情况需要特别注意安全驾驶。`,
        `从交通文本数据来看，类似"${userMessage}"的情况需要谨慎处理，建议您咨询当地交通部门。`,
      ],
      language: [
        `🗣️ 我听懂了您的问题！从语言模型分析来看，这是一个关于交通安全的重要话题。`,
        `通过语言理解，您提到的交通状况确实需要关注。建议您保持冷静并遵循交通指示。`,
        `基于语言模型的理解，您的问题涉及交通法规。我建议您查阅最新的交通管理条例。`,
      ],
      video: [
        `📹 通过视频识别分析，我注意到您描述的交通场景。建议安装行车记录仪以确保安全。`,
        `视频识别显示这类交通情况较为常见，建议您提高警惕，注意周围车辆动态。`,
        `基于视频分析技术，类似的交通状况需要实时监控。建议使用智能交通系统辅助判断。`,
      ],
    };

    const modelResponses =
      responses[modelId as keyof typeof responses] || responses.text;
    return modelResponses[Math.floor(Math.random() * modelResponses.length)];
  };

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest(
        ".overflow-y-auto",
      ) as HTMLElement | null;
      if (container) {
        // 使用requestAnimationFrame确保DOM更新后再滚动
        requestAnimationFrame(() => {
          const targetScrollTop =
            container.scrollHeight - container.clientHeight;
          const startScrollTop = container.scrollTop;
          const distance = targetScrollTop - startScrollTop;
          const duration = 300; // 300ms动画时长
          const startTime = performance.now();

          function animateScroll(currentTime: number) {
            if (!container) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 使用easeOutCubic缓动函数
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            container.scrollTop = startScrollTop + distance * easeProgress;

            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          }

          requestAnimationFrame(animateScroll);
        });
      } else {
        // 降级方案
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if ((message.trim() || uploadedFiles.length > 0) && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        role: "user",
        timestamp: new Date(),
        attachments: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
      };

      // 清空输入框、附件并开始加载状态
      const currentMessage = message;
      setMessage("");
      setUploadedFiles([]);
      setIsLoading(true);

      if (!hasStartedChat) {
        setHasStartedChat(true);
      }

      // 添加用户消息并立即滚动
      setMessagesMap((prev) => ({
        ...prev,
        [selectedModel]: [...prev[selectedModel], userMessage],
      }));

      // 确保用户消息显示后再滚动
      setTimeout(() => {
        scrollToBottom();
      }, 50);

      // 模拟AI思考时间
      const thinkingDelay = 600 + Math.random() * 800;
      setTimeout(() => {
        const responseText =
          uploadedFiles.length > 0
            ? `我看到您上传了 ${uploadedFiles.length} 个文件。${getAIResponse(currentMessage || "文件上传", selectedModel)}`
            : getAIResponse(currentMessage, selectedModel);

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: responseText,
          role: "assistant",
          timestamp: new Date(),
          isTyping: true,
        };

        // 添加AI响应消息
        setMessagesMap((prev) => ({
          ...prev,
          [selectedModel]: [...prev[selectedModel], aiResponse],
        }));
        setIsLoading(false);

        // 添加消息后滚动到底部
        requestAnimationFrame(() => {
          setTimeout(scrollToBottom, 100);
        });

        // 计算打字动画时长
        const typingDuration = Math.max(1500, aiResponse.content.length * 30);

        // 模拟打字完成
        setTimeout(() => {
          setMessagesMap((prev) => ({
            ...prev,
            [selectedModel]: prev[selectedModel].map((msg) =>
              msg.id === aiResponse.id ? { ...msg, isTyping: false } : msg,
            ),
          }));

          // 打字完成后最终滚动
          setTimeout(() => {
            scrollToBottom();
          }, 150);
        }, typingDuration);
      }, thinkingDelay);
    }
  }, [
    message,
    isLoading,
    selectedModel,
    hasStartedChat,
    scrollToBottom,
    uploadedFiles,
  ]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleModelSelect = (modelId: string) => {
    if (modelId !== selectedModel) {
      setIsTransitioning(true);
      setSelectedModel(modelId);
      updateIndicator(modelId);

      // 结束过渡动画
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleUploadAttachment = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar";
    fileInput.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);

      files.forEach((file) => {
        // 检查文件大小限制 (例如 50MB)
        if (file.size > 50 * 1024 * 1024) {
          console.warn(`文件 ${file.name} 过大，已跳过`);
          return;
        }

        // 检查是否已存在相同文件
        const isDuplicate = uploadedFiles.some(
          (existingFile) =>
            existingFile.name === file.name && existingFile.size === file.size,
        );

        if (!isDuplicate) {
          const fileUrl = URL.createObjectURL(file);
          const uploadedFile: UploadedFile = {
            id: Date.now().toString() + Math.random().toString(36),
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            url: fileUrl,
          };

          setUploadedFiles((prev) => [...prev, uploadedFile]);
        }
      });
    };
    fileInput.click();
    fileInput.remove();
  };

  const handleRemoveFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  useEffect(() => {
    // 初始化指示器位置
    const initIndicator = () => {
      updateIndicator(selectedModel);
    };

    // 等待DOM渲染完成
    const timer = setTimeout(initIndicator, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [selectedModel, updateIndicator]); // 依赖selectedModel和updateIndicator

  useEffect(() => {
    // 监听窗口大小变化时重新计算指示器位置
    const handleResize = () => {
      updateIndicator(selectedModel);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [selectedModel, updateIndicator]);

  // 优化滚动逻辑 - 只在特定情况下滚动
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // 只在以下情况滚动：
      // 1. 新增用户消息
      // 2. 新增AI消息
      // 3. AI消息打字状态改变
      const shouldScroll =
        lastMessage.role === "user" ||
        (lastMessage.role === "assistant" &&
          lastMessage.isTyping !== undefined);

      if (shouldScroll) {
        // 使用微任务确保DOM更新完成
        Promise.resolve().then(() => {
          const timeoutId = setTimeout(scrollToBottom, 30);
          return () => clearTimeout(timeoutId);
        });
      }
    }
  }, [messages, scrollToBottom]);

  // 稳定化输入处理函数
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
    },
    [],
  );

  return (
    <div
      className="w-full flex flex-col"
      style={{ height: "calc(100vh - 93px)" }}
    >
      {/* 样式已通过 useEffect 注入到 head 中 */}
      {/* 欢迎区域 - 只在未开始聊天时显示 */}
      <AnimatePresence>
        {!hasStartedChat && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
              opacity: { duration: 0.4 },
              y: { duration: 0.6 },
              scale: { duration: 0.6 },
            }}
            className="w-full flex flex-col items-center justify-center flex-1 px-6"
          >
            {/* Logo区域 */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-background" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-sm transform rotate-45" />
                </div>
                <h1 className="text-3xl md:text-4xl font-light text-foreground tracking-tight">
                  <Typewriter
                    text="我是高速交通AI助手，很高兴见到你"
                    delay={800}
                    speed={80}
                    showCursor={true}
                    cursorChar="|"
                  />
                </h1>
              </div>
            </div>

            {/* AI模型选择器 - 居中显示 */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 p-1.5 bg-card rounded-full border border-border/50 shadow-sm relative overflow-hidden min-h-[44px]">
                {/* 滑动背景指示器 */}
                <div
                  className="absolute bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{
                    top: "6px",
                    height: "calc(100% - 12px)",
                    left: 0,
                    transform: `translateX(${indicatorStyle.x}px)`,
                    width: indicatorStyle.width,
                  }}
                />

                {aiModels.map((model) => (
                  <div
                    key={model.id}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <Button
                      ref={(el) => {
                        const index = aiModels.findIndex(
                          (m) => m.id === model.id,
                        );
                        buttonRefs.current[index] = el;
                      }}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2 rounded-full transition-all duration-200 border-0 shadow-none whitespace-nowrap h-8 min-h-8 flex items-center justify-center px-4",
                        selectedModel === model.id
                          ? "text-primary-foreground bg-transparent"
                          : "hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:scale-[1.02] text-muted-foreground",
                        selectedModel === model.id &&
                          "hover:bg-transparent hover:text-primary-foreground",
                      )}
                      onClick={() => handleModelSelect(model.id)}
                    >
                      <span className="text-base flex items-center justify-center w-5 h-5 flex-shrink-0">
                        {model.icon}
                      </span>
                      <span className="hidden sm:inline font-medium leading-none">
                        {model.name}
                      </span>
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border-0 shadow-none hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:scale-[1.02] transition-all duration-200 text-muted-foreground h-8 w-8 min-h-8 min-w-8 flex items-center justify-center flex-shrink-0"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 聊天输入区域 - 居中显示 */}
            <div className="w-full max-w-2xl mb-4">
              <div className="relative">
                {/* 文件预览区域 - 输入框上方一体化 */}
                {uploadedFiles.length > 0 && (
                  <div className="p-2 pt-2 pb-2 bg-card rounded-t-2xl border border-b-0 border-border shadow-sm">
                    <div
                      className="files-scroll"
                      style={{
                        display: "flex",
                        gap: "8px",
                        width: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                        scrollbarWidth: "thin",
                        scrollbarColor: "transparent transparent",
                      }}
                    >
                      {uploadedFiles.map((file) => (
                        <FilePreview
                          key={file.id}
                          file={file}
                          onRemove={() => handleRemoveFile(file.id)}
                          allFiles={uploadedFiles}
                          onPreviewAll={handlePreviewAllFiles}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "flex items-center gap-2 p-2 bg-card border border-border shadow-sm",
                    uploadedFiles.length > 0
                      ? "rounded-b-2xl rounded-t-none border-t-border/50"
                      : "rounded-2xl",
                  )}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="rounded-xl border-0 shadow-none hover:bg-muted text-muted-foreground hover:text-foreground"
                        onClick={handleUploadAttachment}
                      >
                        <div>
                          <Plus className="w-4 h-4" />
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <p>上传附件</p>
                    </TooltipContent>
                  </Tooltip>

                  <Input
                    className="flex-1 border-0 !bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none outline-none"
                    placeholder="开始新的聊天"
                    value={message}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl border-0 shadow-none hover:bg-muted text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      <Mic className="w-4 h-4" />
                    </Button>

                    <Button
                      size="icon"
                      className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-none"
                      onClick={handleSendMessage}
                      disabled={
                        (!message.trim() && uploadedFiles.length === 0) ||
                        isLoading
                      }
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 当前选中的模型显示 - 居中显示 */}
            <div>
              <div>
                <Badge
                  variant="secondary"
                  className="gap-2 border-0 shadow-none bg-muted/50 text-muted-foreground"
                >
                  <span>
                    {aiModels.find((m) => m.id === selectedModel)?.icon}
                  </span>
                  <span>
                    正在使用{" "}
                    {aiModels.find((m) => m.id === selectedModel)?.name}
                  </span>
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 对话历史区域 */}
      <AnimatePresence>
        {hasStartedChat && (
          <motion.div
            key="chat-area"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="flex-1 overflow-hidden"
          >
            <div className="h-full overflow-y-auto px-6 py-4 scroll-smooth">
              <div className="max-w-4xl mx-auto">
                {isTransitioning ? (
                  <div className="flex-1 flex justify-center items-center py-8 absolute top-0 left-0 right-0 bottom-0">
                    <div className="text-muted-foreground text-sm">
                      切换模型中...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 h-full">
                    {messages.length > 0 ? (
                      messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 15, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.35,
                            ease: [0.23, 1, 0.32, 1],
                            delay: msg.role === "assistant" ? 0.1 : 0,
                          }}
                          style={{
                            willChange: "transform, opacity",
                            backfaceVisibility: "hidden",
                          }}
                        >
                          <MessageItem message={msg} />
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex justify-center items-center py-8 absolute top-0 left-0 right-0 bottom-0">
                        <div className="flex text-muted-foreground text-sm">
                          暂无消息
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Loading indicator */}
                <AnimatePresence mode="wait">
                  {isLoading && (
                    <motion.div
                      key="loading-indicator"
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{
                        duration: 0.25,
                        ease: [0.23, 1, 0.32, 1],
                      }}
                      className="flex gap-3 mb-4"
                      style={{
                        willChange: "transform, opacity",
                        backfaceVisibility: "hidden",
                      }}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <motion.div
                            className="w-2 h-2 bg-muted-foreground rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0,
                            }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-muted-foreground rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0.2,
                            }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-muted-foreground rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0.4,
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部固定区域 - 开始聊天后显示 */}
      <AnimatePresence>
        {hasStartedChat && (
          <motion.div
            key="bottom-area"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.1, 0.25, 1],
              delay: 0.1,
            }}
            className="flex-shrink-0 px-6 py-4"
          >
            {/* AI模型选择器 */}
            <div className="mb-4 flex justify-center">
              <div className="flex items-center justify-center gap-2 p-1.5 bg-card rounded-full border border-border/50 shadow-sm relative overflow-hidden min-h-[44px]">
                {/* 滑动背景指示器 */}
                <div
                  className="absolute bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{
                    top: "6px",
                    height: "calc(100% - 12px)",
                    left: 0,
                    transform: `translateX(${indicatorStyle.x}px)`,
                    width: indicatorStyle.width,
                  }}
                />

                {aiModels.map((model) => (
                  <div
                    key={model.id}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <Button
                      ref={(el) => {
                        const index = aiModels.findIndex(
                          (m) => m.id === model.id,
                        );
                        buttonRefs.current[index] = el;
                      }}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2 rounded-full transition-all duration-200 border-0 shadow-none whitespace-nowrap h-8 min-h-8 flex items-center justify-center px-4",
                        selectedModel === model.id
                          ? "text-primary-foreground bg-transparent"
                          : "hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:scale-[1.02] text-muted-foreground",
                        selectedModel === model.id &&
                          "hover:bg-transparent hover:text-primary-foreground",
                      )}
                      onClick={() => handleModelSelect(model.id)}
                    >
                      <span className="text-base flex items-center justify-center w-5 h-5 flex-shrink-0">
                        {model.icon}
                      </span>
                      <span className="hidden sm:inline font-medium leading-none">
                        {model.name}
                      </span>
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border-0 shadow-none hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:scale-[1.02] transition-all duration-200 text-muted-foreground h-8 w-8 min-h-8 min-w-8 flex items-center justify-center flex-shrink-0"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 聊天输入区域 */}
            <div className="w-full max-w-4xl mx-auto mb-2 ">
              <div className="relative">
                {/* 文件预览区域 - 输入框上方一体化 */}
                {uploadedFiles.length > 0 && (
                  <div className="p-2 pt-2 pb-2 bg-card rounded-t-2xl border border-b-0 border-border shadow-sm">
                    <div
                      className="files-scroll"
                      style={{
                        display: "flex",
                        gap: "8px",
                        width: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                        scrollbarWidth: "thin",
                        scrollbarColor: "transparent transparent",
                      }}
                    >
                      {uploadedFiles.map((file) => (
                        <FilePreview
                          key={file.id}
                          file={file}
                          onRemove={() => handleRemoveFile(file.id)}
                          allFiles={uploadedFiles}
                          onPreviewAll={handlePreviewAllFiles}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "flex items-center gap-2 p-2 bg-card border border-border shadow-sm",
                    uploadedFiles.length > 0
                      ? "rounded-b-2xl rounded-t-none border-t-border/50"
                      : "rounded-2xl",
                  )}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="rounded-xl border-0 shadow-none hover:bg-muted text-muted-foreground hover:text-foreground"
                        onClick={handleUploadAttachment}
                      >
                        <div>
                          <Plus className="w-4 h-4" />
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <p>上传附件</p>
                    </TooltipContent>
                  </Tooltip>

                  <Input
                    className="flex-1 border-0 !bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none outline-none"
                    placeholder="继续对话..."
                    value={message}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl border-0 shadow-none hover:bg-muted text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      <Mic className="w-4 h-4" />
                    </Button>

                    <Button
                      size="icon"
                      className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-none"
                      onClick={handleSendMessage}
                      disabled={
                        (!message.trim() && uploadedFiles.length === 0) ||
                        isLoading
                      }
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 当前选中的模型显示 */}
            <div className="flex justify-center">
              <div>
                <Badge
                  variant="secondary"
                  className="gap-2 border-0 shadow-none bg-muted/50 text-muted-foreground"
                >
                  <span>
                    {aiModels.find((m) => m.id === selectedModel)?.icon}
                  </span>
                  <span>
                    正在使用{" "}
                    {aiModels.find((m) => m.id === selectedModel)?.name}
                  </span>
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 文件预览组件 */}
      <ImagePreview
        images={filePreviewImages.map((file) => ({
          src: file.url,
          alt: file.name,
          fileName: file.name,
          fileSize: file.size,
        }))}
        currentIndex={filePreviewIndex}
        isOpen={isFilePreviewOpen}
        onClose={() => setIsFilePreviewOpen(false)}
        onIndexChange={setFilePreviewIndex}
      />
    </div>
  );
}

export default AgentText;
