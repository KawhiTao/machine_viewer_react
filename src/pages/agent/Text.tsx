import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import ChatHistory from "../../components/ChatHistory";
import SmartImage from "../../components/SmartImage";
import {
  chatHistoryDB,
  type ChatSession,
  type HistoryMessage,
  convertToHistoryMessage,
  convertFromHistoryMessage,
  initChatHistoryDB,
  // debugIndexedDBData,
  // debugCheckSession,
} from "../../utils/chatHistory";
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
  // Brain,
  Sparkle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import ImagePreview from "@/components/ImagePreview";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { post } from "@/utils/request";
import { API_ENDPOINTS, type ApiResponse } from "@/config/api";

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

  /* Markdown 代码高亮样式 - 只针对 .prose 内的元素 */
  .prose pre {
    background-color: hsl(var(--muted)) !important;
    border: 1px solid hsl(var(--border));
  }

  .prose code {
    color: hsl(var(--foreground)) !important;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  }

  .prose pre code {
    background-color: transparent !important;
  }
`;

interface AIModel {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface UploadedFile {
  id: string;
  file: File | null;
  name: string;
  size: number;
  type: string;
  url: string;
  base64Data?: string; // 保留 base64 数据用于图片恢复
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  isInterrupted?: boolean; // 标识消息是否被中断
  attachments?: UploadedFile[];
  contentType?: "text" | "think";
  thinkingContent?: string;
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
    const typewriterComponent = useMemo(
      () => (
        <Typewriter
          key={messageId}
          text={text}
          delay={delay}
          speed={speed}
          showCursor={showCursor}
          cursorChar={cursorChar}
          className={className}
        />
      ),
      [messageId, text, delay, speed, showCursor, cursorChar, className],
    );

    return typewriterComponent;
  },
  (prevProps, nextProps) => {
    // 精确比较，避免不必要重新渲染
    return (
      prevProps.messageId === nextProps.messageId &&
      prevProps.text === nextProps.text &&
      prevProps.speed === nextProps.speed &&
      prevProps.className === nextProps.className &&
      prevProps.showCursor === nextProps.showCursor
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
                  <SmartImage
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    base64Data={file.base64Data}
                    mimeType={file.type}
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
  ({
    message,
    onRegenerate,
    onModelSwitch,
    currentModel,
    isLastMessage,
    aiModels,
    isRegenerating,
    isSwitchingModel,
  }: {
    message: Message;
    onRegenerate?: (messageId: string) => void;
    onModelSwitch?: (messageId: string, newModel: string) => void;
    currentModel?: string;
    isLastMessage?: boolean;
    aiModels?: AIModel[];
    isRegenerating?: boolean;
    isSwitchingModel?: boolean;
    isLoading?: boolean;
  }) => {
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

    // 预渲染markdown，避免切换时的延迟
    const renderedMarkdown = useMemo(() => {
      if (message.role !== "assistant" || !message.content) return null;

      return (
        <div className="text-sm leading-relaxed break-words prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ className, children }) => {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <pre className="bg-muted p-3 rounded-md overflow-x-auto my-2">
                    <code className={`${className} text-sm font-mono`}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => <>{children}</>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-3 py-1 my-2 bg-muted/20 rounded-r text-muted-foreground italic">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-2">
                  <table className="w-full border-collapse border border-border rounded">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-border p-2 bg-muted text-left font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-border p-2">{children}</td>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-4 my-1 space-y-0.5">
                  {children}
                </ol>
              ),
              h1: ({ children }) => (
                <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold mt-2 mb-1">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-2 leading-relaxed">{children}</p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary hover:text-primary/80 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      );
    }, [message.content, message.role]);

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
            "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ease-out group",
            isUser
              ? "bg-primary text-primary-foreground"
              : message.isInterrupted
                ? "bg-card border-2 border-red-500 border-dashed"
                : "bg-card border border-border",
          )}
        >
          {/* 附件显示区域 */}
          {message.attachments && message.attachments.length > 0 && (
            <div className=" border-b border-border/20">
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
                          <SmartImage
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            base64Data={file.base64Data}
                            mimeType={file.type}
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
            {/* 思考内容显示区域 */}
            {message.thinkingContent && message.role === "assistant" && (
              <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    思考过程
                  </span>
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {message.thinkingContent}
                </div>
              </div>
            )}

            {/* 最终回答内容显示 */}
            {message.isTyping ? (
              <div className="min-h-[1.25rem] relative">
                <StableTypewriter
                  messageId={message.id}
                  text={message.content || ""}
                  delay={0}
                  speed={12} // 优化的打字速度，平衡实时性和可读性
                  showCursor={true}
                  cursorChar="|"
                  className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                />
                {/* 预渲染的markdown内容，隐藏状态 */}
                <div
                  className="absolute inset-0 opacity-0 pointer-events-none"
                  aria-hidden="true"
                >
                  {renderedMarkdown}
                </div>
              </div>
            ) : message.content ? (
              message.role === "assistant" ? (
                <div className="transform transition-opacity duration-200">
                  {renderedMarkdown || (
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              )
            ) : message.role === "assistant" && message.thinkingContent ? (
              <div className="text-sm text-muted-foreground italic">
                思考完成
              </div>
            ) : null}

            {/* 被中断消息的提示 */}
            {message.isInterrupted && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">此回复被意外中断</span>
              </div>
            )}
          </div>

          {/* AI消息操作按钮 - 始终可见，优化排版 */}
          {!isUser && !message.isTyping && (onRegenerate || onModelSwitch) && (
            <div className="mt-3 pt-3 border-t border-border/20">
              <div className="flex items-center justify-between">
                {/* 左侧：重新生成按钮 */}
                <div className="flex items-center">
                  {onRegenerate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-3 text-xs font-medium rounded-lg border transition-all duration-200 flex items-center gap-2",
                            message.isInterrupted
                              ? "bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/50"
                              : "hover:bg-muted border-muted hover:border-primary/40",
                          )}
                          onClick={() => {
                            console.log("🔄 点击重新生成按钮", {
                              isRegenerating,
                              messageId: message.id,
                              isInterrupted: message.isInterrupted,
                            });
                            onRegenerate?.(message.id);
                          }}
                          disabled={isRegenerating}
                        >
                          {isRegenerating ? (
                            <>
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              <span>
                                {message.isInterrupted
                                  ? "继续中..."
                                  : "生成中..."}
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                <path d="M3 21v-5h5" />
                              </svg>
                              <span>
                                {message.isInterrupted
                                  ? "继续完成"
                                  : "重新生成"}
                              </span>
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          使用当前模型重新生成回复
                          {!isLastMessage && <br />}
                          {!isLastMessage && "（将删除后续对话）"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* 右侧：切换模型按钮组 */}
                {onModelSwitch &&
                  aiModels &&
                  aiModels.filter((model) => model.id !== currentModel).length >
                    0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/70 font-medium">
                        或试试:
                      </span>
                      <div className="flex items-center gap-1">
                        {aiModels
                          .filter((model) => model.id !== currentModel)
                          .map((model) => (
                            <Tooltip key={model.id}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 flex items-center justify-center"
                                  onClick={() => {
                                    console.log("🔀 点击切换模型按钮", {
                                      isSwitchingModel,
                                      messageId: message.id,
                                      targetModel: model.id,
                                    });
                                    onModelSwitch(message.id, model.id);
                                  }}
                                  disabled={isSwitchingModel}
                                >
                                  {isSwitchingModel ? (
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <span className="text-base leading-none">
                                      {model.icon}
                                    </span>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  用{model.name}重新回答此问题
                                  {!isLastMessage && <br />}
                                  {!isLastMessage && "（创建新的对话分支）"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

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
    const isSame =
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.thinkingContent === nextProps.message.thinkingContent &&
      prevProps.message.contentType === nextProps.message.contentType &&
      prevProps.message.isTyping === nextProps.message.isTyping &&
      prevProps.message.role === nextProps.message.role &&
      prevProps.message.timestamp.getTime() ===
        nextProps.message.timestamp.getTime();

    // 当isTyping状态改变时，强制重新渲染以确保smooth transition
    if (prevProps.message.isTyping !== nextProps.message.isTyping) {
      return false;
    }

    return isSame;
  },
);

MessageItem.displayName = "MessageItem";

const aiModels: AIModel[] = [
  {
    id: "chat",
    name: "语义大模型",
    icon: "🗣️",
  },
  // {
  //   id: "language",
  //   name: "交通语言模型",
  //   icon: "🗣️",
  // },
  {
    id: "vision",
    name: "视图大模型",
    icon: "📹",
  },
];

function AgentText() {
  // 确保样式被正确注入
  // 初始化样式和数据库
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

    // 初始化历史消息数据库
    const initDB = async () => {
      try {
        await initChatHistoryDB();
        setDbInitialized(true);
        console.log("🚀 聊天历史数据库初始化完成");
      } catch (error) {
        console.error("❌ 聊天历史数据库初始化失败:", error);
      }
    };

    initDB();

    // // 添加全局调试函数
    // (window as any).debugChatHistory = debugIndexedDBData;
    // (window as any).debugCheckSession = debugCheckSession;
    // console.log("🛠️ 调试函数已添加到全局对象：");
    // console.log("  - debugChatHistory() - 查看所有历史数据");
    // console.log("  - debugCheckSession(sessionId) - 检查特定会话");

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
        console.log("🗑️ 滚动条样式已清理");
      }
    };
  }, []);
  const [selectedModel, setSelectedModel] = useState<string>("chat");
  const [message, setMessage] = useState<string>("");
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({
    chat: [],
    language: [],
    vision: [],
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
  const [uploadError, setUploadError] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [, setDragCounter] = useState(0);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 思维链相关状态
  const [cotEnabled, setCotEnabled] = useState(false);

  // 历史消息相关状态
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(true);
  const [shouldRefreshHistory, setShouldRefreshHistory] = useState(false);
  const [isSwitchingModel, setIsSwitchingModel] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const justLoadedHistoryRef = useRef(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<
    string | null
  >(null);

  const [switchingMessageId, setSwitchingMessageId] = useState<string | null>(
    null,
  );

  // 返回顶部相关状态
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // 强制重置所有按钮状态，确保页面加载时按钮可用
  useEffect(() => {
    console.log("🔧 强制重置所有按钮状态");
    setIsRegenerating(false);
    setRegeneratingMessageId(null);
    setIsSwitchingModel(false);
    setIsSwitchingModel(false);
    setSwitchingMessageId(null);
    setIsLoading(false);
    setIsTransitioning(false);
    setIsLoadingHistory(false);
    setIsDeletingSession(false);
    justLoadedHistoryRef.current = false;
  }, []);

  // 保存相关状态
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 监听滚动位置，控制返回顶部按钮显示
  useEffect(() => {
    const handleScroll = () => {
      if (messagesEndRef.current) {
        const container = messagesEndRef.current.closest(
          ".overflow-y-auto",
        ) as HTMLElement | null;
        if (container) {
          // 当滚动超过300px时显示返回顶部按钮
          setShowScrollToTop(container.scrollTop > 300);
        }
      }
    };

    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest(
        ".overflow-y-auto",
      ) as HTMLElement | null;
      if (container) {
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
      }
    }
  }, [hasStartedChat]); // 依赖hasStartedChat确保在聊天开始后才添加监听

  // 返回顶部函数
  const scrollToTop = useCallback(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest(
        ".overflow-y-auto",
      ) as HTMLElement | null;
      if (container) {
        container.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }
  }, []);

  // 获取当前模型的消息 - 使用useMemo稳定引用
  const messages = useMemo(
    () => messagesMap[selectedModel] || [],
    [messagesMap, selectedModel],
  );

  // 保存当前会话到历史记录（支持保存正在生成的消息）
  const saveCurrentSession = useCallback(
    async (updateTimestamp = true, includeTypingMessages = false) => {
      if (!dbInitialized || isLoadingHistory || isDeletingSession) {
        console.log(`⏸️ 跳过自动保存:`, {
          dbInitialized,
          isLoadingHistory,
          isDeletingSession,
          currentSessionId,
        });
        return;
      }

      // 等待一个微任务，确保React状态更新已完成
      await new Promise((resolve) => setTimeout(resolve, 0));

      // 重新获取最新的messagesMap状态
      const currentMessagesMap = messagesMap;

      // 检查是否有任何模型有消息
      const hasAnyMessages = Object.values(currentMessagesMap).some(
        (msgs) => msgs.length > 0,
      );
      if (!hasAnyMessages) return;

      try {
        // 转换所有模型的消息为历史消息格式
        const historyMessagesMap: Record<string, HistoryMessage[]> = {};

        for (const [model, msgs] of Object.entries(currentMessagesMap)) {
          if (msgs.length > 0) {
            // 根据参数决定是否包含正在输入中的消息
            const msgsToSave = includeTypingMessages
              ? msgs
              : msgs.filter((msg) => !msg.isTyping);
            if (msgsToSave.length > 0) {
              historyMessagesMap[model] = await Promise.all(
                msgsToSave.map((msg) => convertToHistoryMessage(msg)),
              );
            }
          }
        }

        // 如果没有任何消息（包括正在输入的），才不保存
        if (Object.keys(historyMessagesMap).length === 0) {
          if (includeTypingMessages) {
            console.log("⏳ 暂无任何消息，跳过保存");
          } else {
            console.log("⏳ 暂无完成的消息，稍后保存");
          }
          return;
        }

        // 获取现有会话信息以保留标题
        let existingTitle = "";
        if (currentSessionId) {
          try {
            const existingSession =
              await chatHistoryDB.getSession(currentSessionId);
            existingTitle = existingSession?.title || "";
          } catch (error) {
            console.warn("❌ 获取现有会话标题失败:", error);
          }
        }

        const sessionData = {
          id: currentSessionId!,
          title: existingTitle, // 保留现有标题，避免重新生成
          messagesMap: historyMessagesMap,
          currentModel: selectedModel,
        };

        const sessionId = await chatHistoryDB.saveSession(
          sessionData,
          updateTimestamp,
        );

        if (!currentSessionId) {
          setCurrentSessionId(sessionId);
        }
        console.log(`💾 已保存会话: ${sessionId}`, {
          models: Object.keys(historyMessagesMap),
          totalMessages: Object.values(historyMessagesMap).flat().length,
          isDeletingSession,
          currentSessionId,
          includeTypingMessages,
        });
      } catch (error) {
        console.error("❌ 保存会话失败:", error);
      }
    },
    [
      dbInitialized,
      messagesMap,
      selectedModel,
      currentSessionId,
      isLoadingHistory,
      isDeletingSession,
    ],
  );

  // 简单的延迟保存函数
  const deferredSave = useCallback(() => {
    // 清除之前的保存任务
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 延迟1秒后保存，包括正在输入的消息
    saveTimeoutRef.current = setTimeout(() => {
      if (currentSessionId) {
        // 检查是否有正在输入的消息
        const hasTypingMessages = Object.values(messagesMap).some((msgs) =>
          msgs.some((msg) => msg.isTyping && msg.content),
        );

        // 如果有正在输入的消息，也一起保存
        saveCurrentSession(true, hasTypingMessages).then(() => {
          setShouldRefreshHistory((prev) => !prev);
        });
      }
    }, 1000);
  }, [currentSessionId, saveCurrentSession, messagesMap]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 页面离开前保存数据
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 页面离开前立即保存，包括正在输入的消息
      if (currentSessionId) {
        // 同步保存，包括正在输入的消息
        saveCurrentSession(true, true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // 页面隐藏时也保存，包括正在输入的消息
        if (currentSessionId) {
          saveCurrentSession(false, true);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentSessionId, saveCurrentSession]);

  // 监听消息变化，自动保存
  useEffect(() => {
    // 如果没有会话ID或正在加载历史记录，不保存
    if (!currentSessionId || isLoadingHistory || justLoadedHistoryRef.current) {
      return;
    }

    const hasAnyMessages = Object.values(messagesMap).some(
      (msgs) => msgs.length > 0,
    );

    if (hasAnyMessages) {
      // 检查是否有正在输入的消息
      const hasTypingMessages = Object.values(messagesMap).some((msgs) =>
        msgs.some((msg) => msg.isTyping && msg.content),
      );

      // 如果有正在输入的消息，更频繁地保存
      if (hasTypingMessages) {
        // 立即保存正在输入的消息，不延迟
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveCurrentSession(false, true).then(() => {
          setShouldRefreshHistory((prev) => !prev);
        });
      } else {
        // 使用延迟保存，避免频繁保存
        deferredSave();
      }
    }
  }, [
    messagesMap,
    currentSessionId,
    isLoadingHistory,
    deferredSave,
    saveCurrentSession,
  ]);

  // 强制滚动到底部的测试函数
  const forceScrollToBottom = useCallback(() => {
    console.log("🚀 强制滚动到底部被调用");
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest(
        ".overflow-y-auto",
      ) as HTMLElement | null;
      if (container) {
        // 强制立即滚动，不使用动画
        const maxScroll = container.scrollHeight - container.clientHeight;
        container.scrollTop = maxScroll;
        console.log("💨 强制滚动完成:", {
          scrollTop: container.scrollTop,
          maxScroll,
          是否到底: Math.abs(container.scrollTop - maxScroll) < 5,
        });
      } else {
        messagesEndRef.current.scrollIntoView({
          behavior: "auto",
          block: "end",
        });
      }
    }
  }, []);

  // 加载历史会话
  const loadHistorySession = useCallback(
    (session: ChatSession) => {
      // 设置加载标志，阻止保存触发
      setIsLoadingHistory(true);

      // 转换历史消息格式
      const convertedMessagesMap: Record<string, Message[]> = {};

      for (const [model, msgs] of Object.entries(session.messagesMap || {})) {
        convertedMessagesMap[model] = msgs.map(convertFromHistoryMessage);
      }

      // 批量更新状态，避免多次触发useEffect
      const updateStates = () => {
        setCurrentSessionId(session.id);
        setMessagesMap({
          chat: [],
          language: [],
          vision: [],
          ...convertedMessagesMap,
        });
        setSelectedModel(session.currentModel || "chat");
        setHasStartedChat(true);

        // 重置所有可能影响按钮状态的变量
        setIsRegenerating(false);
        setRegeneratingMessageId(null);
        setIsSwitchingModel(false);
        setSwitchingMessageId(null);
        setIsLoading(false);
        setIsTransitioning(false);
        console.log("🏠 历史会话加载时已重置所有按钮状态");
      };

      // 使用React的批量更新
      updateStates();

      // 清除加载标志
      setTimeout(() => {
        setIsLoadingHistory(false);
        justLoadedHistoryRef.current = true;

        // 滚动到底部 - 历史记录加载后需要更长延迟确保渲染完成
        setTimeout(() => {
          forceScrollToBottom();
          console.log("📖 历史记录加载完成，已滚动到底部");
        }, 300);

        // 立即清除刚加载历史的标志
        setTimeout(() => {
          justLoadedHistoryRef.current = false;
        }, 200);
      }, 50);

      console.log(`📖 加载历史会话: ${session.title}`);
    },
    [forceScrollToBottom, setCurrentSessionId],
  );

  // 开始新对话
  const startNewChat = useCallback(() => {
    // 先保存当前会话（如果有消息的话）
    const hasAnyMessages = Object.values(messagesMap).some(
      (msgs) => msgs.length > 0,
    );
    if (hasAnyMessages && currentSessionId) {
      saveCurrentSession();
    }

    setMessagesMap({
      chat: [],
      language: [],
      vision: [],
    });

    setCurrentSessionId(null);
    setHasStartedChat(false);
    setUploadedFiles([]);
    setMessage("");
    justLoadedHistoryRef.current = false; // 清除历史加载标志

    // 重置所有可能影响按钮状态的变量
    setIsRegenerating(false);
    setRegeneratingMessageId(null);
    setIsSwitchingModel(false);
    setSwitchingMessageId(null);
    setIsLoading(false);
    setIsTransitioning(false);
    console.log("✨ 新对话时已重置所有按钮状态");

    console.log("✨ 开始新对话");

    // 延迟刷新历史记录，确保之前的数据库操作已经完全完成
    setTimeout(() => {
      setShouldRefreshHistory((prev) => !prev);
    }, 200);
  }, [messagesMap, currentSessionId, saveCurrentSession]);

  // 处理会话删除完成
  const handleSessionDeleted = useCallback(
    (deletedSessionId: string) => {
      console.log(`🗑️ 会话删除完成回调: ${deletedSessionId}`);

      // 如果删除的是当前活跃会话，清空currentSessionId
      if (currentSessionId === deletedSessionId) {
        console.log("🔄 删除的是当前活跃会话，清空currentSessionId");
        setCurrentSessionId(null);
      }
    },
    [currentSessionId],
  );

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

  const scrollToBottom = useCallback(() => {
    console.log("🔄 scrollToBottom 被调用");
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest(
        ".overflow-y-auto",
      ) as HTMLElement | null;
      if (container) {
        console.log("📏 容器信息:", {
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          scrollTop: container.scrollTop,
          maxScroll: container.scrollHeight - container.clientHeight,
        });

        // 使用双层requestAnimationFrame确保DOM完全更新
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const maxScroll = container.scrollHeight - container.clientHeight;
            const beforeScroll = container.scrollTop;

            console.log("🎯 开始滚动:", {
              当前位置: beforeScroll,
              目标位置: maxScroll,
              需要滚动: maxScroll - beforeScroll,
            });

            // 对于大的滚动距离（如切换历史记录），使用立即滚动
            const scrollDistance = Math.abs(maxScroll - beforeScroll);
            const behavior = scrollDistance > 500 ? "auto" : "smooth";

            container.scrollTo({
              top: maxScroll,
              behavior: behavior,
            });

            console.log(
              `📍 使用${behavior === "auto" ? "立即" : "平滑"}滚动，距离: ${scrollDistance}px`,
            );

            // 验证滚动结果
            setTimeout(
              () => {
                const afterScroll = container.scrollTop;
                console.log("✅ 滚动完成:", {
                  实际位置: afterScroll,
                  是否到底: Math.abs(afterScroll - maxScroll) < 5,
                });
              },
              behavior === "auto" ? 100 : 500,
            );
          });
        });
      } else {
        console.log("⚠️ 未找到滚动容器，使用降级方案");
        // 降级方案
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      console.log("❌ messagesEndRef.current 不存在");
    }
  }, []);

  // 监听模型切换，自动滚动到底部
  useEffect(() => {
    // 延迟滚动，确保新模型的消息列表完全渲染
    const timer = setTimeout(() => {
      scrollToBottom();
      console.log("🔄 模型切换完成，已滚动到底部");
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedModel, scrollToBottom]);

  const streamAIResponse = useCallback(
    async (
      userMessage: string,
      aiMessageId: string,
      attachments?: UploadedFile[],
      targetModel?: string,
      sessionId?: string | null,
    ) => {
      try {
        const formData = new FormData();
        formData.append("question", userMessage);

        // 确定目标模型，默认使用当前选中的模型
        const modelToUse = targetModel || selectedModel;

        // 添加历史对话上下文 - 限制最近20条消息以避免请求过大
        const currentMessages = messagesMap[modelToUse] || [];
        const dialogHistory = currentMessages
          .filter((msg) => msg.id !== aiMessageId) // 排除当前正在生成的AI消息
          .filter((msg) => msg.content && msg.content.trim()) // 排除空内容的消息
          .slice(-20) // 只取最近20条消息
          .map((msg) => ({
            role: msg.role,
            content: msg.content || "",
          }));

        // 调试日志
        console.log(`📝 发送对话历史信息:`, {
          selectedModel,
          modelToUse,
          totalMessages: currentMessages.length,
          dialogHistoryCount: dialogHistory.length,
          userMessage: userMessage.substring(0, 50) + "...",
          hasAttachments: attachments && attachments.length > 0,
        });

        // 根据API文档添加对话历史
        if (dialogHistory.length > 0) {
          formData.append("dialog_history", JSON.stringify(dialogHistory));
          console.log(
            `🔄 对话历史详情:`,
            dialogHistory.map((msg) => ({
              role: msg.role,
              contentPreview: msg.content.substring(0, 30) + "...",
            })),
          );
        } else {
          console.log(`🆕 这是新对话的第一条消息`);
        }

        const modelType = modelToUse === "vision" ? "vision" : "chat";
        formData.append("model", modelType);

        // 添加思维链参数
        if (cotEnabled && modelType === "chat") {
          formData.append("cot", "true");
          console.log(`🧠 已启用思维链模式`);
        }

        console.log(`🔄 模型映射: ${modelToUse} -> ${modelType}`);

        // 添加会话ID到formData - 使用传入的sessionId参数
        const effectiveSessionId = sessionId || currentSessionId;
        if (effectiveSessionId) {
          try {
            // 确保sessionId是有效字符串
            const sessionIdStr = effectiveSessionId.toString().trim();
            if (
              sessionIdStr &&
              sessionIdStr !== "null" &&
              sessionIdStr !== "undefined"
            ) {
              formData.set("chatSessionId", sessionIdStr);

              // 验证设置是否成功
              const verifySessionId = formData.get("chatSessionId");
              if (verifySessionId === sessionIdStr) {
                console.log(`🔗 成功添加会话ID: ${sessionIdStr}`);
              } else {
                console.error(`❌ chatSessionId设置验证失败`, {
                  expected: sessionIdStr,
                  actual: verifySessionId,
                });
              }
            } else {
              console.warn(
                `⚠️ 无效的sessionId，跳过设置: ${effectiveSessionId}`,
              );
            }
          } catch (error) {
            console.error(`❌ 设置chatSessionId时发生错误:`, error, {
              effectiveSessionId,
              type: typeof effectiveSessionId,
            });
          }
        } else {
          console.warn(`⚠️ sessionId为空，将不传递chatSessionId参数`, {
            sessionId,
            currentSessionId,
          });
        }

        // 根据API文档添加文件 - 支持多张图片文件用于vision模型
        if (attachments && attachments.length > 0) {
          // 获取所有图片文件
          const imageFiles = attachments.filter((att) =>
            att.type.startsWith("image/"),
          );

          if (imageFiles.length > 0 && modelType === "vision") {
            // 添加所有图片文件
            imageFiles.forEach((imageFile, index) => {
              if (imageFile.file) {
                formData.append("images", imageFile.file);
                console.log(`📸 添加图片文件 ${index + 1}:`, imageFile.name);
              }
            });
            console.log(`📸 总计添加了 ${imageFiles.length} 张图片`);
          } else if (imageFiles.length > 0 && modelType === "chat") {
            console.log(
              `⚠️ 文本模型不支持图片，已忽略 ${imageFiles.length} 张图片文件`,
            );
          }

          // 对于非图片文件，暂时记录但不发送（API不支持）
          const otherFiles = attachments.filter(
            (att) => !att.type.startsWith("image/"),
          );
          if (otherFiles.length > 0) {
            console.log(
              `⚠️ API暂不支持非图片文件，已忽略:`,
              otherFiles.map((f) => f.name),
            );
          }
        }

        // 获取认证token - 使用与AuthContext相同的存储策略
        const getStorageType = (): Storage => {
          const rememberMe = localStorage.getItem("remember_me") === "true";
          return rememberMe ? localStorage : sessionStorage;
        };

        const storage = getStorageType();
        const token = storage.getItem("auth_token");
        const headers: Record<string, string> = {};

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        console.log(`🚀 开始发送API请求到: /backend/api/v1/llm/chat`);

        // 最终验证所有formData参数
        const finalChatSessionId = formData.get("chatSessionId");
        console.log(`📦 请求参数验证:`, {
          model: formData.get("model"),
          chatSessionId: finalChatSessionId,
          chatSessionIdExists: !!finalChatSessionId,
          chatSessionIdValid:
            finalChatSessionId &&
            typeof finalChatSessionId === "string" &&
            finalChatSessionId.trim() !== "",
          question:
            formData.get("question")?.toString().substring(0, 50) + "...",
          hasDialogHistory: formData.has("dialog_history"),
          hasImages: formData.has("images"),
          imageCount: formData.getAll("images").length,
          cot: formData.has("cot"),
          hasAuth: !!token,
          currentSessionIdState: currentSessionId,
          passedSessionId: sessionId,
        });

        // 关键参数检查
        if (!finalChatSessionId && effectiveSessionId) {
          console.error(`🚨 严重错误: chatSessionId未成功设置到formData中`, {
            currentSessionId,
            sessionId,
            effectiveSessionId,
            finalChatSessionId,
            formDataKeys: Array.from(formData.keys()),
          });
        }

        const response = await fetch("/backend/api/v1/llm/chat", {
          method: "post",
          headers,
          body: formData,
        });

        console.log(`📡 API响应状态:`, response.status, response.statusText);

        if (!response.ok) {
          console.error(
            `❌ API请求失败:`,
            response.status,
            response.statusText,
          );
          const errorText = await response.text();
          console.error(`❌ 错误详情:`, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(`✅ API请求成功，开始处理流式响应`);

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        const imageCount = attachments
          ? attachments.filter((att) => att.type.startsWith("image/")).length
          : 0;
        const baseContent =
          imageCount > 0
            ? `我看到您上传了 ${imageCount} 张图片，正在分析中...\n\n`
            : attachments && attachments.length > 0
              ? `我看到您上传了 ${attachments.length} 个文件，正在分析中...\n\n`
              : "";

        let lastUpdateTime = 0;

        // 优化的内容更新函数，确保平滑累加
        const updateMessageContent = (newPart: string, forceUpdate = false) => {
          fullContent += newPart;
          const now = Date.now();

          // 限制更新频率，但确保实时性，或强制更新
          if (now - lastUpdateTime >= 50 || forceUpdate) {
            lastUpdateTime = now;

            setMessagesMap((prev) => ({
              ...prev,
              [modelToUse]: prev[modelToUse].map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      content: baseContent + fullContent,
                    }
                  : msg,
              ),
            }));

            // 每隔3秒保存一次正在输入的消息
            if (now - lastUpdateTime >= 3000) {
              setTimeout(() => {
                if (currentSessionId) {
                  saveCurrentSession(false, true);
                }
              }, 100);
              lastUpdateTime = now;
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // 处理SSE数据流
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // 保留最后一行未完成的数据

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.substring(6); // 移除 'data: ' 前缀
                if (jsonStr.trim()) {
                  const parsed = JSON.parse(jsonStr);
                  // 处理新的数据结构：包含contentType和parts字段
                  if (
                    parsed.status &&
                    parsed.data &&
                    parsed.data.parts &&
                    parsed.data.contentType
                  ) {
                    const content = parsed.data.parts;
                    const contentType = parsed.data.contentType;

                    if (contentType === "think") {
                      // 思考内容，添加到thinkingContent字段
                      setMessagesMap((prev) => ({
                        ...prev,
                        [modelToUse]: prev[modelToUse].map((msg) =>
                          msg.id === aiMessageId
                            ? {
                                ...msg,
                                thinkingContent:
                                  (msg.thinkingContent || "") + content,
                              }
                            : msg,
                        ),
                      }));
                    } else if (contentType === "text") {
                      // 最终文本内容，使用统一的更新函数
                      updateMessageContent(content);
                      // 同时设置消息的contentType
                      setMessagesMap((prev) => ({
                        ...prev,
                        [modelToUse]: prev[modelToUse].map((msg) =>
                          msg.id === aiMessageId
                            ? {
                                ...msg,
                                contentType: "text",
                              }
                            : msg,
                        ),
                      }));
                    }

                    // 流式响应过程中减少滚动频率
                    if (fullContent.length % 100 === 0) {
                      setTimeout(scrollToBottom, 50);
                    }
                  } else if (
                    parsed.status &&
                    parsed.data &&
                    parsed.data.parts
                  ) {
                    // 兼容旧格式：只有parts字段，没有contentType
                    updateMessageContent(parsed.data.parts);

                    // 流式响应过程中减少滚动频率
                    if (fullContent.length % 100 === 0) {
                      setTimeout(scrollToBottom, 50);
                    }
                  }
                }
              } catch (parseError) {
                console.warn("解析SSE数据失败:", parseError);
              }
            }
          }
        }

        // 处理遗留在buffer中的最后部分数据
        if (buffer.trim()) {
          if (buffer.startsWith("data: ")) {
            try {
              const jsonStr = buffer.substring(6);
              if (jsonStr.trim()) {
                const parsed = JSON.parse(jsonStr);
                if (
                  parsed.status &&
                  parsed.data &&
                  parsed.data.parts &&
                  parsed.data.contentType
                ) {
                  const content = parsed.data.parts;
                  const contentType = parsed.data.contentType;

                  if (contentType === "think") {
                    setMessagesMap((prev) => ({
                      ...prev,
                      [modelToUse]: prev[modelToUse].map((msg) =>
                        msg.id === aiMessageId
                          ? {
                              ...msg,
                              thinkingContent:
                                (msg.thinkingContent || "") + content,
                            }
                          : msg,
                      ),
                    }));
                  } else if (contentType === "text") {
                    updateMessageContent(content);
                  }
                } else if (parsed.status && parsed.data && parsed.data.parts) {
                  updateMessageContent(parsed.data.parts);
                }
              }
            } catch (parseError) {
              console.warn("解析遗留SSE数据失败:", parseError);
            }
          }
        }

        // 确保流结束时所有累积的内容都被显示
        if (fullContent) {
          updateMessageContent("", true); // 强制更新显示最终内容
        }

        // 等待TypeWriter完成渲染后停止打字效果
        const estimatedTypingTime = Math.max(300, fullContent.length * 8);
        setTimeout(() => {
          setMessagesMap((prev) => ({
            ...prev,
            [modelToUse]: prev[modelToUse].map((msg) =>
              msg.id === aiMessageId ? { ...msg, isTyping: false } : msg,
            ),
          }));

          // AI回复完成后滚动到底部
          setTimeout(() => {
            forceScrollToBottom();
            console.log("🤖 AI回复完成，已滚动到底部");
          }, 200);

          // AI消息完成后立即保存
          setTimeout(() => {
            if (currentSessionId) {
              saveCurrentSession(true, false).then(() => {
                setShouldRefreshHistory((prev) => !prev);
              });
            }
          }, 100);

          // 清理所有可能影响按钮状态的loading状态
          setIsLoading(false);
          setIsRegenerating(false);
          setIsSwitchingModel(false);
          setRegeneratingMessageId(null);
          setSwitchingMessageId(null);
        }, estimatedTypingTime);

        // AI响应完成后会通过useEffect自动保存
      } catch (error) {
        console.error("流式响应失败:", error);

        // 发生错误时，显示错误消息
        const errorModelToUse = targetModel || selectedModel;
        setMessagesMap((prev) => ({
          ...prev,
          [errorModelToUse]: prev[errorModelToUse].map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  content: "抱歉，获取响应时出现错误，请稍后再试。",
                  isTyping: false,
                }
              : msg,
          ),
        }));

        // 错误时立即清理所有状态，确保按钮不会被永久禁用
        setTimeout(() => {
          setIsLoading(false);
          setIsRegenerating(false);
          setIsSwitchingModel(false);
          setRegeneratingMessageId(null);
          setIsSwitchingModel(false);
          setIsTransitioning(false);
          console.log("🔧 错误后状态已清理，按钮应该可以点击了");
        }, 1000);
      }
    },
    [
      selectedModel,
      scrollToBottom,
      messagesMap,
      cotEnabled,
      currentSessionId,
      saveCurrentSession,
      forceScrollToBottom,
    ],
  );

  // 获取默认AI回复
  const getDefaultAIResponse = useCallback(
    (userMessage: string, modelId: string): string => {
      const responses = {
        chat: [
          `基于交通文本分析，我理解您提到的"${userMessage}"。建议您在高速行驶时保持安全车距，遵守交通规则。`,
          `通过文本分析，我发现您关心的交通问题。根据相关法规，这种情况需要特别注意安全驾驶。`,
          `从交通文本数据来看，类似"${userMessage}"的情况需要谨慎处理，建议您咨询当地交通部门。`,
        ],
        language: [
          `🗣️ 我听懂了您的问题！从语言模型分析来看，这是一个关于交通安全的重要话题。`,
          `通过语言理解，您提到的交通状况确实需要关注。建议您保持冷静并遵循交通指示。`,
          `基于语言模型的理解，您的问题涉及交通法规。我建议您查阅最新的交通管理条例。`,
        ],
        vision: [
          `📹 通过视频识别分析，我注意到您描述的交通场景。建议安装行车记录仪以确保安全。`,
          `视频识别显示这类交通情况较为常见，建议您提高警惕，注意周围车辆动态。`,
          `基于视频分析技术，类似的交通状况需要实时监控。建议使用智能交通系统辅助判断。`,
        ],
      };

      const modelResponses =
        responses[modelId as keyof typeof responses] || responses.chat;

      return modelResponses[Math.floor(Math.random() * modelResponses.length)];
    },
    [],
  );

  // 重新生成AI回复
  const handleRegenerate = useCallback(
    async (messageId: string) => {
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) return;

      const aiMessage = messages[messageIndex];
      if (aiMessage.role !== "assistant") return;

      // 检查是否为被中断的消息
      const isInterruptedMessage = aiMessage.isInterrupted;

      // 找到上一条用户消息
      let userMessage = null;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          userMessage = messages[i];
          break;
        }
      }

      if (!userMessage) return;

      // 设置重新生成状态
      setIsRegenerating(true);
      setRegeneratingMessageId(messageId);

      // 简单的超时保护
      const regenerateTimeout = setTimeout(() => {
        setIsRegenerating(false);
        setRegeneratingMessageId(null);
        setIsLoading(false);
      }, 10000);

      // 移除当前AI消息及其之后的所有消息（保持对话连贯性）
      setMessagesMap((prev) => ({
        ...prev,
        [selectedModel]: prev[selectedModel].slice(0, messageIndex),
      }));

      setIsLoading(true);

      // 重新生成AI回复，被中断消息使用较短的延迟
      const thinkingDelay = isInterruptedMessage
        ? 200
        : 600 + Math.random() * 800;
      setTimeout(async () => {
        const newAiResponse: Message = {
          id: Date.now().toString(),
          content: isInterruptedMessage
            ? "正在重新完成被中断的回复...\n\n"
            : "",
          role: "assistant",
          timestamp: new Date(),
          isTyping: true,
        };

        // 添加新的AI消息
        setMessagesMap((prev) => ({
          ...prev,
          [selectedModel]: [...prev[selectedModel], newAiResponse],
        }));
        setIsLoading(false);

        // 使用流式响应
        try {
          await streamAIResponse(
            userMessage.content || "",
            newAiResponse.id,
            userMessage.attachments,
            selectedModel,
            currentSessionId || undefined,
          );
        } catch (error) {
          console.error("重新生成失败:", error);
          // 回退处理
          const responseText = getDefaultAIResponse(
            userMessage.content || "",
            selectedModel,
          );

          setMessagesMap((prev) => ({
            ...prev,
            [selectedModel]: prev[selectedModel].map((msg) =>
              msg.id === newAiResponse.id
                ? { ...msg, content: (msg.content || "") + responseText }
                : msg,
            ),
          }));

          setTimeout(() => {
            setMessagesMap((prev) => ({
              ...prev,
              [selectedModel]: prev[selectedModel].map((msg) =>
                msg.id === newAiResponse.id ? { ...msg, isTyping: false } : msg,
              ),
            }));

            // 继续回复完成后滚动到底部
            setTimeout(() => {
              forceScrollToBottom();
              console.log("🔄 继续回复完成，已滚动到底部");
            }, 200);
            setIsRegenerating(false);
            setRegeneratingMessageId(null);
            clearTimeout(regenerateTimeout);
          }, 1000);
        } finally {
          clearTimeout(regenerateTimeout);
          setIsRegenerating(false);
          setRegeneratingMessageId(null);
        }
      }, thinkingDelay);
    },
    [
      messages,
      selectedModel,
      streamAIResponse,
      getDefaultAIResponse,
      forceScrollToBottom,
      currentSessionId,
    ],
  );

  // 切换模型重新提问
  const handleModelSwitch = useCallback(
    async (messageId: string, newModel: string) => {
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) return;

      const aiMessage = messages[messageIndex];
      if (aiMessage.role !== "assistant") return;

      // 找到上一条用户消息
      let userMessage = null;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          userMessage = messages[i];
          break;
        }
      }

      if (!userMessage) return;

      console.log(`🔄 开始切换模型: ${selectedModel} -> ${newModel}`, {
        messageId,
        currentSessionId,
        messagesMapKeys: Object.keys(messagesMap),
        currentModelMessageCount: messagesMap[selectedModel]?.length || 0,
        targetModelMessageCount: messagesMap[newModel]?.length || 0,
      });

      // 先保存当前会话
      if (currentSessionId) {
        try {
          await saveCurrentSession();
          console.log("✅ 当前会话保存成功");
        } catch (error) {
          console.error("❌ 保存当前会话失败:", error);
        }
      }

      // 设置切换状态
      console.log("🔀 开始切换模型，设置状态为true");
      setIsSwitchingModel(true);
      setIsTransitioning(true);
      setIsLoading(true);
      setIsSwitchingModel(true);
      setSwitchingMessageId(messageId);

      // 简单的超时保护
      const switchTimeout = setTimeout(() => {
        setIsSwitchingModel(false);
        setIsTransitioning(false);
        setIsLoading(false);
        setIsSwitchingModel(false);
        setSwitchingMessageId(null);
      }, 10000);

      try {
        // 直接准备数据，避免异步问题
        const newModelMessages = messagesMap[newModel] || [];
        console.log(
          `📊 新模型${newModel}当前消息数量: ${newModelMessages.length}`,
        );

        // 总是创建并显示用户消息副本，让用户可以看到问题
        const userMessageCopy: Message = {
          ...userMessage,
          id: Date.now().toString() + "_copy",
          timestamp: new Date(),
        };

        console.log(`➕ 向${newModel}模型添加用户消息副本`);
        // 添加用户消息到新模型
        setMessagesMap((prev) => ({
          ...prev,
          [newModel]: [...(prev[newModel] || []), userMessageCopy],
        }));

        const userMessageForNewModel = userMessageCopy;

        // 创建AI回复消息
        const newAiResponse: Message = {
          id: Date.now().toString() + "_ai",
          content: "",
          role: "assistant",
          timestamp: new Date(),
          isTyping: true,
        };

        // 模型切换动画
        setTimeout(() => {
          console.log(`🎯 设置选中模型为: ${newModel}`);
          setSelectedModel(newModel);
          console.log(`✅ 模型已切换到: ${newModel}`);

          setTimeout(() => {
            console.log(`🤖 向${newModel}模型添加AI回复消息`, {
              aiMessageId: newAiResponse.id,
            });
            // 添加AI消息到新模型
            setMessagesMap((prev) => ({
              ...prev,
              [newModel]: [...(prev[newModel] || []), newAiResponse],
            }));

            // 清除状态
            console.log("🔀 切换模型完成，重置状态");
            setIsSwitchingModel(false);
            setIsTransitioning(false);
            setIsLoading(true); // 保持loading状态直到AI响应开始
            setSwitchingMessageId(null);

            // 生成新模型的AI回复
            const thinkingDelay = 600 + Math.random() * 800;
            setTimeout(async () => {
              try {
                console.log(`🤖 开始生成${newModel}模型的回复`);
                setIsLoading(false); // AI开始响应时清除loading

                await streamAIResponse(
                  userMessageForNewModel.content || "",
                  newAiResponse.id,
                  userMessageForNewModel.attachments,
                  newModel,
                  currentSessionId || undefined,
                );

                console.log(`✅ ${newModel}模型回复完成`);
                clearTimeout(switchTimeout);
              } catch (error) {
                console.error("模型切换响应失败:", error);
                clearTimeout(switchTimeout);

                // 停止实时保存
                // 流式响应完成

                // 回退处理
                const responseText = `抱歉，${newModel}模型响应失败，请稍后再试。`;
                const typingDuration = Math.max(800, responseText.length * 30);

                setMessagesMap((prev) => ({
                  ...prev,
                  [newModel]: prev[newModel].map((msg) =>
                    msg.id === newAiResponse.id
                      ? { ...msg, content: responseText }
                      : msg,
                  ),
                }));

                setTimeout(() => {
                  setMessagesMap((prev) => ({
                    ...prev,
                    [newModel]: prev[newModel].map((msg) =>
                      msg.id === newAiResponse.id
                        ? { ...msg, isTyping: false }
                        : msg,
                    ),
                  }));
                  setIsLoading(false);
                }, typingDuration);
              }
            }, thinkingDelay);
          }, 200);
        }, 100);
      } catch (error) {
        console.error("模型切换过程失败:", error);
        clearTimeout(switchTimeout);

        // 恢复状态
        setIsSwitchingModel(false);
        setIsTransitioning(false);
        setIsLoading(false);
        setIsSwitchingModel(false);
        setSwitchingMessageId(null);
      }
    },
    [
      messages,
      messagesMap,
      currentSessionId,
      saveCurrentSession,
      streamAIResponse,
      selectedModel,
    ],
  );

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
      const currentAttachments = [...uploadedFiles]; // 保存附件引用
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

      // 如果是新对话的第一条消息，调用API创建会话
      let createdSessionId: string | null = currentSessionId; // 保存创建的会话ID
      if (!currentSessionId) {
        try {
          console.log(`🆕 开始创建新会话，模型: ${selectedModel}`);

          // 调用API创建新会话
          const createSessionResponse: ApiResponse<{
            id: number | string;
            sessionName?: string;
            sessionType?: string;
            createTime?: string;
            userId?: number;
          }> = await post(API_ENDPOINTS.CHAT.NEW_SESSION, {
            sessionName: "",
            sessionType: selectedModel, // 实际使用的模型
          });

          if (
            createSessionResponse.success === true &&
            createSessionResponse.data?.id
          ) {
            const newSessionId = createSessionResponse.data.id.toString();
            const sessionTitle =
              createSessionResponse.data.sessionName || "新对话";

            createdSessionId = newSessionId; // 保存到局部变量
            setCurrentSessionId(newSessionId);
            console.log(`✅ 新会话创建成功: ${newSessionId}`, {
              sessionId: newSessionId,
              sessionName: sessionTitle,
              sessionType: createSessionResponse.data.sessionType,
              createTime: createSessionResponse.data.createTime,
              userId: createSessionResponse.data.userId,
            });

            // 将用户消息转换为历史消息格式，并使用API返回的sessionName创建本地会话
            const newMessagesMap = {
              chat: selectedModel === "chat" ? [userMessage] : [],
              language: selectedModel === "language" ? [userMessage] : [],
              vision: selectedModel === "vision" ? [userMessage] : [],
            };

            const historyMessagesMap: Record<string, HistoryMessage[]> = {};
            for (const [model, msgs] of Object.entries(newMessagesMap)) {
              if (msgs.length > 0) {
                historyMessagesMap[model] = await Promise.all(
                  msgs.map((msg) => convertToHistoryMessage(msg)),
                );
              }
            }

            // 使用API返回的信息创建本地会话记录
            await chatHistoryDB.createSession({
              id: newSessionId,
              title: sessionTitle, // 使用API返回的sessionName作为标题
              messagesMap: historyMessagesMap,
              currentModel: selectedModel,
            });

            // 触发历史记录刷新
            setShouldRefreshHistory((prev) => !prev);
          } else {
            throw new Error(createSessionResponse.message || "创建会话失败");
          }
        } catch (error) {
          console.error("❌ 创建会话失败:", error);
          // 创建会话失败时，仍然继续对话，但不保存历史记录
        }
      }

      // 发送用户消息后立即滚动到底部
      // 如果是新对话，需要等待动画完成
      const isNewChat = !hasStartedChat;
      if (isNewChat) {
        // 新对话需要等待界面切换动画完成
        setTimeout(() => {
          scrollToBottom();
          console.log("🆕 新对话发送消息后已滚动到底部");
        }, 1000);
      } else {
        // 继续对话立即滚动
        setTimeout(() => {
          scrollToBottom();
          console.log("💬 继续对话发送消息后已滚动到底部");
        }, 100);
      }

      // 立即开始AI响应，直接传递从API获得的sessionId
      const thinkingDelay = 600 + Math.random() * 800;
      setTimeout(async () => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "", // 开始时内容为空，由流式响应填充
          role: "assistant",
          timestamp: new Date(),
          isTyping: true,
        };

        // 先添加AI消息到列表
        setMessagesMap((prev) => ({
          ...prev,
          [selectedModel]: [...prev[selectedModel], aiResponse],
        }));
        setIsLoading(false);

        // AI消息添加后延迟滚动
        setTimeout(() => {
          scrollToBottom();
          console.log("🤖 AI开始回复，已滚动到底部");
        }, 100);

        // 获取有效的sessionId - 使用刚创建的会话ID或现有会话ID
        const finalSessionId = createdSessionId;

        console.log(`🔍 准备AI请求，sessionId状态:`, {
          currentSessionId,
          createdSessionId,
          finalSessionId,
          hasCurrentSession: !!finalSessionId,
        });

        // 所有模型都使用真实API调用
        try {
          await streamAIResponse(
            currentMessage,
            aiResponse.id,
            currentAttachments,
            selectedModel,
            finalSessionId,
          );
        } catch (error) {
          console.error("API调用失败，使用默认响应:", error);
          // API调用失败时的fallback逻辑
          const responseText = getDefaultAIResponse(
            currentMessage,
            selectedModel,
          );

          // 模拟打字效果的持续时间
          const typingDuration = Math.max(800, responseText.length * 30);

          // 更新消息内容
          setMessagesMap((prev) => ({
            ...prev,
            [selectedModel]: prev[selectedModel].map((msg) =>
              msg.id === aiResponse.id
                ? { ...msg, content: (msg.content || "") + responseText }
                : msg,
            ),
          }));

          setTimeout(() => {
            setMessagesMap((prev) => ({
              ...prev,
              [selectedModel]: prev[selectedModel].map((msg) =>
                msg.id === aiResponse.id ? { ...msg, isTyping: false } : msg,
              ),
            }));

            // AI消息完成后最终滚动
            // 清理定时器
            setTimeout(() => {
              forceScrollToBottom();
              console.log("⚠️ API调用失败，使用默认响应后已滚动到底部");
            }, 100);

            // AI消息完成后会通过useEffect自动保存
          }, typingDuration);
        }
      }, thinkingDelay);
    }
  }, [
    message,
    isLoading,
    selectedModel,
    hasStartedChat,
    scrollToBottom,
    uploadedFiles,
    streamAIResponse,
    getDefaultAIResponse,
    currentSessionId,
    forceScrollToBottom,
  ]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleModelSelect = (modelId: string) => {
    if (modelId !== selectedModel) {
      setIsSwitchingModel(true);
      setIsTransitioning(true);

      // 如果切换到语义大模型，清空已上传的文件
      if (modelId === "chat") {
        // 清理URL对象避免内存泄漏
        uploadedFiles.forEach((file) => {
          if (file.url) {
            URL.revokeObjectURL(file.url);
          }
        });
        setUploadedFiles([]);
        setUploadError("");
      }

      // 添加一个短暂的视觉缓冲，让切换更平滑
      requestAnimationFrame(() => {
        setSelectedModel(modelId);
        updateIndicator(modelId);

        // 结束过渡动画
        setTimeout(() => {
          setIsTransitioning(false);
          // 延迟重置切换状态，确保不会触发保存
          // 增加延迟时间，确保不会和防抖机制冲突
          setTimeout(() => {
            setIsSwitchingModel(false);
          }, 500); // 增加到500ms，确保防抖机制完成
        }, 200); // 减少过渡时间，让切换更快响应
      });

      // 切换模型时不需要更新访问时间
    }
  };

  const handleUploadAttachment = useCallback(() => {
    const processFiles = (files: File[]) => {
      if (files.length === 0) return;

      setIsUploading(true);

      const errorMessages: string[] = [];
      let hasError = false;

      // 检查文件总数限制
      if (uploadedFiles.length + files.length > 10) {
        setUploadError(
          `最多只能上传10个文件，当前已有${uploadedFiles.length}个`,
        );
        setTimeout(() => setUploadError(""), 5000);
        setIsUploading(false);
        return;
      }

      files.forEach((file) => {
        // 检查文件大小限制 (图片文件10MB，其他文件50MB)
        const maxSize = file.type.startsWith("image/")
          ? 10 * 1024 * 1024
          : 50 * 1024 * 1024;
        if (file.size > maxSize) {
          const maxSizeText = file.type.startsWith("image/") ? "10MB" : "50MB";
          errorMessages.push(
            `文件 "${file.name}" 超过大小限制(${maxSizeText})`,
          );
          hasError = true;
          return;
        }

        // 检查文件类型是否支持
        const supportedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "text/plain",
          "application/json",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (
          !supportedTypes.includes(file.type) &&
          !file.type.startsWith("text/")
        ) {
          errorMessages.push(`不支持的文件类型: "${file.name}" (${file.type})`);
          hasError = true;
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
        } else {
          errorMessages.push(`文件 "${file.name}" 已存在`);
          hasError = true;
        }
      });

      // 显示错误信息
      if (hasError && errorMessages.length > 0) {
        setUploadError(errorMessages.join("、"));
        setTimeout(() => setUploadError(""), 5000);
      }

      setTimeout(() => setIsUploading(false), 500);
    };

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar";
    fileInput.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      processFiles(files);
    };
    fileInput.click();
    fileInput.remove();
  }, [uploadedFiles]);

  // 处理拖拽上传
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 语义大模型时禁用拖拽上传
      if (selectedModel === "chat") {
        return;
      }

      // 清除之前的超时
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = null;
      }

      // 只处理包含文件的拖拽事件
      if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
        setDragCounter((prev) => {
          const newCount = prev + 1;
          if (newCount === 1) {
            setIsDragOver(true);
          }
          return newCount;
        });
      }
    },
    [selectedModel],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 使用防抖延迟处理dragLeave
    dragTimeoutRef.current = setTimeout(() => {
      setDragCounter((prev) => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          setIsDragOver(false);
          return 0;
        }
        return newCount;
      });
    }, 50); // 50ms延迟
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 语义大模型时禁用拖拽上传
      if (selectedModel === "chat") {
        e.dataTransfer.dropEffect = "none";
        return;
      }

      // 设置拖拽效果
      if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
        e.dataTransfer.dropEffect = "copy";
      }
    },
    [selectedModel],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 清除拖拽状态和计数器
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = null;
      }
      setIsDragOver(false);
      setDragCounter(0);

      // 语义大模型时禁用文件上传
      if (selectedModel === "chat") {
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        setIsUploading(true);

        const errorMessages: string[] = [];
        let hasError = false;

        // 检查文件总数限制
        if (uploadedFiles.length + files.length > 10) {
          setUploadError(
            `最多只能上传10个文件，当前已有${uploadedFiles.length}个`,
          );
          setTimeout(() => setUploadError(""), 5000);
          return;
        }

        files.forEach((file) => {
          // 检查文件大小限制 (图片文件10MB，其他文件50MB)
          const maxSize = file.type.startsWith("image/")
            ? 10 * 1024 * 1024
            : 50 * 1024 * 1024;
          if (file.size > maxSize) {
            const maxSizeText = file.type.startsWith("image/")
              ? "10MB"
              : "50MB";
            errorMessages.push(
              `文件 "${file.name}" 超过大小限制(${maxSizeText})`,
            );
            hasError = true;
            return;
          }

          // 检查文件类型是否支持
          const supportedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "text/plain",
            "application/json",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ];

          if (
            !supportedTypes.includes(file.type) &&
            !file.type.startsWith("text/")
          ) {
            errorMessages.push(
              `不支持的文件类型: "${file.name}" (${file.type})`,
            );
            hasError = true;
            return;
          }

          // 检查是否已存在相同文件
          const isDuplicate = uploadedFiles.some(
            (existingFile) =>
              existingFile.name === file.name &&
              existingFile.size === file.size,
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
          } else {
            errorMessages.push(`文件 "${file.name}" 已存在`);
            hasError = true;
          }
        });

        // 显示错误信息
        if (hasError && errorMessages.length > 0) {
          setUploadError(errorMessages.join("、"));
          setTimeout(() => setUploadError(""), 5000);
        }

        setTimeout(() => setIsUploading(false), 500);
      }
    },
    [uploadedFiles, selectedModel],
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

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
        // 对于打字中的消息，需要更频繁的滚动更新
        const isTyping =
          lastMessage.role === "assistant" && lastMessage.isTyping;

        if (isTyping) {
          // AI打字时适度延迟，避免过于频繁
          setTimeout(scrollToBottom, 100);
        } else {
          // 用户消息或AI完成消息，使用较长延迟确保DOM完全更新
          setTimeout(scrollToBottom, 200);
        }
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
    <div className="w-full flex" style={{ height: "calc(100vh - 93px)" }}>
      {/* 左侧历史消息侧边栏 */}
      <ChatHistory
        onSelectSession={loadHistorySession}
        currentSessionId={currentSessionId || undefined}
        onNewChat={startNewChat}
        messagesMap={messagesMap}
        refreshTrigger={shouldRefreshHistory}
        onDeletingStateChange={setIsDeletingSession}
        onSessionDeleted={handleSessionDeleted}
      />

      {/* 右侧主聊天区域 */}
      <div className="flex-1 flex flex-col relative">
        {/* 样式已通过 useEffect 注入到 head 中 */}
        {/* 欢迎区域 - 只在未开始聊天时显示 */}
        <AnimatePresence mode="wait">
          {!hasStartedChat && (
            <motion.div
              key="initial-state"
              initial={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -150,
                scale: 0.9,
                filter: "blur(6px)",
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0.0, 0.2, 1],
                opacity: { duration: 0.3 },
                y: { duration: 0.5 },
                scale: { duration: 0.5 },
                filter: { duration: 0.3 },
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
                <div
                  className={cn(
                    "relative",
                    isDragOver &&
                      "ring-2 ring-primary ring-offset-2 rounded-lg",
                  )}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {/* 拖拽上传提示 */}
                  {isDragOver && (
                    <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg z-50 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-6 bg-background/80 rounded-lg shadow-lg">
                        <div className="text-3xl mb-3 animate-bounce">📁</div>
                        <div className="text-primary font-medium text-lg mb-2">
                          释放文件以上传
                        </div>
                        <div className="text-sm text-muted-foreground">
                          支持图片、PDF、文档等格式 (最多10个文件)
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 错误提示 */}
                  {uploadError && (
                    <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {uploadError}
                      </div>
                    </div>
                  )}
                  {/* 上传进度提示 */}
                  {isUploading && (
                    <div className="mb-2 p-2 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        正在上传文件...
                      </div>
                    </div>
                  )}
                  {/* 文件预览区域 - 输入框上方一体化 */}
                  {uploadedFiles.length > 0 && selectedModel !== "chat" && (
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
                      uploadedFiles.length > 0 && selectedModel !== "chat"
                        ? "rounded-b-2xl rounded-t-none border-t-border/50"
                        : "rounded-2xl",
                    )}
                  >
                    {/* 上传按钮 - 语义大模型时禁用 */}
                    {selectedModel !== "chat" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                    )}

                    {/* 思维链开关 - 仅在语义大模型（chat）时显示 */}
                    {selectedModel === "chat" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "rounded-xl border-0 shadow-none",
                              cotEnabled
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => setCotEnabled(!cotEnabled)}
                          >
                            <Sparkle className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          <p>{cotEnabled ? "关闭思维链" : "开启思维链"}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <Input
                      className="pl-0 flex-1 border-0 !bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none outline-none"
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
              <div className="flex flex-col items-center gap-2">
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
        <AnimatePresence mode="wait">
          {hasStartedChat && (
            <motion.div
              key="chat-area"
              initial={{
                opacity: 0,
                y: 150,
                scale: 0.9,
                filter: "blur(6px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                y: -150,
                scale: 0.9,
                filter: "blur(6px)",
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0.0, 0.2, 1],
                opacity: { duration: 0.3, delay: 0.1 },
                y: { duration: 0.5, delay: 0.1 },
                scale: { duration: 0.5, delay: 0.1 },
                filter: { duration: 0.3, delay: 0.1 },
              }}
              className="flex-1 overflow-hidden"
            >
              <div className="h-full overflow-y-auto px-6 py-4 scroll-smooth">
                <div className="max-w-4xl mx-auto h-full">
                  <AnimatePresence mode="wait">
                    {isTransitioning ? (
                      <motion.div
                        key="transitioning"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.4, 0.0, 0.2, 1],
                        }}
                        className="h-full flex justify-center items-center"
                      >
                        <div className="text-muted-foreground text-sm flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
                          切换模型中...
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`messages-${selectedModel}`}
                        initial={{ opacity: 0, y: 80, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0.0, 0.2, 1],
                        }}
                        className="h-full"
                      >
                        {messages.length > 0 ? (
                          <div className="space-y-2">
                            {messages.map((msg, index) => (
                              <motion.div
                                key={msg.id}
                                initial={{
                                  opacity: 0,
                                  y: 30,
                                  scale: 0.92,
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  scale: 1,
                                }}
                                transition={{
                                  duration: 0.3,
                                  ease: [0.4, 0.0, 0.2, 1],
                                  delay: index * 0.02,
                                }}
                                style={{
                                  willChange: "transform, opacity",
                                  backfaceVisibility: "hidden",
                                }}
                              >
                                <MessageItem
                                  message={msg}
                                  onRegenerate={handleRegenerate}
                                  onModelSwitch={handleModelSwitch}
                                  currentModel={selectedModel}
                                  isLastMessage={index === messages.length - 1}
                                  aiModels={aiModels}
                                  isRegenerating={
                                    isRegenerating &&
                                    regeneratingMessageId === msg.id
                                  }
                                  isSwitchingModel={
                                    isSwitchingModel &&
                                    switchingMessageId === msg.id
                                  }
                                  isLoading={isLoading}
                                />
                              </motion.div>
                            ))}

                            {/* 极简loading indicator */}
                            {isLoading && (
                              <div className="text-center text-muted-foreground text-sm py-2">
                                思考中...
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex justify-center items-center">
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="text-muted-foreground text-sm"
                            >
                              暂无消息
                            </motion.div>
                          </div>
                        )}

                        {/* 上传进度提示 */}
                        {isUploading && (
                          <div className="mb-2 p-2 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                              正在上传文件...
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* 返回顶部按钮 */}
                <AnimatePresence>
                  {showScrollToTop && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="fixed bottom-5 right-8 z-50"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={scrollToTop}
                        className="h-10 w-10 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 shadow-lg"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部固定区域 - 开始聊天后显示 */}
        <AnimatePresence mode="wait">
          {hasStartedChat && (
            <motion.div
              key="bottom-area"
              initial={{
                opacity: 0,
                y: 80,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                y: -80,
                filter: "blur(4px)",
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0.0, 0.2, 1],
                delay: 0.15,
                opacity: { duration: 0.3, delay: 0.15 },
                y: { duration: 0.5, delay: 0.15 },
                filter: { duration: 0.3, delay: 0.15 },
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
                <div
                  className={cn(
                    "relative",
                    isDragOver &&
                      selectedModel !== "chat" &&
                      "ring-2 ring-primary ring-offset-2 rounded-lg",
                  )}
                  onDragEnter={
                    selectedModel !== "chat" ? handleDragEnter : undefined
                  }
                  onDragLeave={
                    selectedModel !== "chat" ? handleDragLeave : undefined
                  }
                  onDragOver={
                    selectedModel !== "chat" ? handleDragOver : undefined
                  }
                  onDrop={selectedModel !== "chat" ? handleDrop : undefined}
                >
                  {/* 拖拽上传提示 - 语义大模型时不显示 */}
                  {isDragOver && selectedModel !== "chat" && (
                    <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg z-50 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-6 bg-background/80 rounded-lg shadow-lg">
                        <div className="text-3xl mb-3 animate-bounce">📁</div>
                        <div className="text-primary font-medium text-lg mb-2">
                          释放文件以上传
                        </div>
                        <div className="text-sm text-muted-foreground">
                          支持图片、PDF、文档等格式 (最多10个文件)
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 错误提示 */}
                  {uploadError && (
                    <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {uploadError}
                      </div>
                    </div>
                  )}
                  {/* 文件预览区域 - 输入框上方一体化 */}
                  {uploadedFiles.length > 0 && selectedModel !== "chat" && (
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
                      uploadedFiles.length > 0 && selectedModel !== "chat"
                        ? "rounded-b-2xl rounded-t-none border-t-border/50"
                        : "rounded-2xl",
                    )}
                  >
                    {/* 上传按钮 - 语义大模型时禁用 */}
                    {selectedModel !== "chat" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                    )}

                    {/* 思维链开关 - 仅在语义大模型（chat）时显示 */}
                    {selectedModel === "chat" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "rounded-xl border-0 shadow-none",
                              cotEnabled
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => setCotEnabled(!cotEnabled)}
                          >
                            <Sparkle className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          <p>{cotEnabled ? "关闭思维链" : "开启思维链"}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <Input
                      className="flex-1 border-0 !bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none outline-none"
                      placeholder={
                        hasStartedChat ? "继续对话..." : "开始新的聊天"
                      }
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
    </div>
  );
}

export default AgentText;
