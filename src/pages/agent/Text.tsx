import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Typewriter } from "@/components/ui/typewriter";
import { Search, Mic, Send, Plus, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface AIModel {
  id: string;
  name: string;
  icon: React.ReactNode;
  variant: "default" | "secondary" | "outline";
}

const aiModels: AIModel[] = [
  {
    id: "text",
    name: "交通文本模型",
    icon: "📝",
    variant: "default",
  },
  {
    id: "language",
    name: "交通语言模型",
    icon: "🗣️",
    variant: "secondary",
  },
  {
    id: "video",
    name: "视频识别模型",
    icon: "📹",
    variant: "outline",
  },
];

function AgentText() {
  const [selectedModel, setSelectedModel] = useState<string>("text");
  const [message, setMessage] = useState<string>("");
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, x: 0 });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const updateIndicator = (modelId: string) => {
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
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("发送消息:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    updateIndicator(modelId);
  };

  useEffect(() => {
    // 初始化指示器位置
    const initIndicator = () => {
      updateIndicator(selectedModel);
    };

    // 等待DOM渲染完成
    const timer = setTimeout(initIndicator, 50);

    // 监听窗口大小变化
    const handleResize = () => {
      updateIndicator(selectedModel);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [selectedModel]);

  return (
    <div
      className="w-full flex flex-col items-center justify-center bg-background px-6"
      style={{ height: "calc(100vh - 93px)" }}
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

      {/* AI模型选择器 */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 p-1.5 bg-card rounded-full border border-border/50 shadow-sm relative overflow-hidden min-h-[44px]">
          {/* 滑动背景指示器 */}
          <motion.div
            className="absolute bg-primary rounded-full"
            animate={{
              x: indicatorStyle.x,
              width: indicatorStyle.width,
            }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 25,
              duration: 0.4,
            }}
            style={{
              top: "6px",
              height: "calc(100% - 12px)",
              left: 0,
            }}
          />

          {aiModels.map((model) => (
            <motion.div
              key={model.id}
              className="relative z-10 flex items-center justify-center"
              whileTap={{
                scale: 0.98,
                y: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
              }}
            >
              <Button
                ref={(el) => {
                  const index = aiModels.findIndex((m) => m.id === model.id);
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
                <motion.span
                  className="text-base flex items-center justify-center w-5 h-5 flex-shrink-0"
                  animate={{
                    scale: selectedModel === model.id ? 1.1 : 1,
                    rotate: selectedModel === model.id ? [0, -2, 2, 0] : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    rotate: {
                      duration: 0.6,
                      ease: "easeInOut",
                    },
                  }}
                >
                  {model.icon}
                </motion.span>
                <motion.span
                  className="hidden sm:inline font-medium leading-none"
                  animate={{
                    fontWeight: selectedModel === model.id ? 600 : 500,
                    color:
                      selectedModel === model.id
                        ? "hsl(var(--primary-foreground))"
                        : "hsl(var(--muted-foreground))",
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                  }}
                >
                  {model.name}
                </motion.span>
              </Button>
            </motion.div>
          ))}
          <motion.div
            className="flex items-center justify-center"
            whileHover={{
              scale: 1.02,
              rotate: 15,
            }}
            whileTap={{
              scale: 0.98,
              rotate: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border-0 shadow-none hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:scale-[1.02] transition-all duration-200 text-muted-foreground h-8 w-8 min-h-8 min-w-8 flex items-center justify-center flex-shrink-0"
            >
              <Search className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* 聊天输入区域 */}
      <div className="w-full max-w-2xl mb-4">
        <div className="relative">
          <div className="flex items-center gap-2 p-2 bg-card rounded-2xl border border-border shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl border-0 shadow-none hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4" />
            </Button>

            <Input
              className="flex-1 border-0 !bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none outline-none"
              placeholder="开始新的聊天"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl border-0 shadow-none hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Mic className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-none"
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 当前选中的模型显示 */}
      <div>
        <Badge
          variant="secondary"
          className="gap-2 border-0 shadow-none bg-muted/50 text-muted-foreground"
        >
          <span>{aiModels.find((m) => m.id === selectedModel)?.icon}</span>
          <span>
            正在使用 {aiModels.find((m) => m.id === selectedModel)?.name}
          </span>
        </Badge>
      </div>
    </div>
  );
}

export default AgentText;
