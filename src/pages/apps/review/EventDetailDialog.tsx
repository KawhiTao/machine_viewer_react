import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Clock,
  Tag,
  MapPin,
  AlertTriangle,
  X,
  CheckCircle,
  ZoomIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import ImagePreview from "@/components/ImagePreview";
import "./EventDetailDialog.css";

interface Event {
  id: number;
  type: string;
  time: string;
  camera: string;
  status: string;
  image: string;
}

interface EventDetailDialogProps {
  open: boolean;
  onClose: () => void;
  event: Event | null;
}

const EventDetailDialog = ({
  open,
  onClose,
  event,
}: EventDetailDialogProps) => {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  // 防止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!event) return null;

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "已处理":
      case "processed":
        return "default";
      case "待处理":
      case "pending":
        return "secondary";
      case "异常":
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "入侵检测":
      case "intrusion":
        return "🚨";
      case "人员识别":
      case "person":
        return "👤";
      case "车辆检测":
      case "vehicle":
        return "🚗";
      case "异常行为":
      case "abnormal":
        return "⚠️";
      default:
        return "📹";
    }
  };

  const getProcessingAdvice = (type: string) => {
    switch (type) {
      case "入侵检测":
        return "建议立即派遣安保人员到现场查看，确认是否存在安全威胁。";
      case "人员识别":
        return "已识别到人员活动，请确认是否为授权人员，核实身份信息。";
      case "车辆检测":
        return "检测到车辆活动，请核实车辆信息和停放区域是否符合规定。";
      case "异常行为":
        return "发现异常行为模式，建议进一步分析现场情况并采取相应措施。";
      default:
        return "请根据事件类型和现场情况采取相应的处理措施。";
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {open && (
          <div
            key="event-detail-dialog"
            className="fixed inset-0 z-50 event-detail-overlay"
          >
            {/* 背景遮罩 */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm event-detail-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              onClick={onClose}
            />

            {/* 内容容器 */}
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4 event-detail-container">
              <motion.div
                layoutId={`card-container-${event.id}`}
                className="relative overflow-hidden shadow-2xl event-detail-content performance-optimized"
                style={{
                  width: "min(95vw, 1200px)",
                  height: "min(90vh, 675px)", // 1920:1080 = 16:9 比例，1200*675
                  aspectRatio: "16 / 9",
                  transformOrigin: "center center",
                  borderRadius: "24px",
                }}
                initial={{
                  scale: 0.95,
                  opacity: 0.8,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  scale: 0.95,
                  opacity: 0.8,
                }}
                transition={{
                  type: "tween",
                  duration: 0.3,
                  ease: "easeOut",
                }}
              >
                {/* 背景图片 */}
                <motion.div
                  layoutId={`image-container-${event.id}`}
                  className="absolute inset-0 performance-optimized group"
                  transition={{
                    type: "tween",
                    duration: 0.2,
                    ease: "easeOut",
                  }}
                >
                  <motion.img
                    layoutId={`image-${event.id}`}
                    src={event.image}
                    alt={`事件 ${event.id}`}
                    className="w-full h-full object-cover event-detail-image performance-optimized cursor-pointer"
                    onClick={() => setIsImagePreviewOpen(true)}
                    title="点击放大图片"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-image.jpg";
                    }}
                    transition={{
                      type: "tween",
                      duration: 0.2,
                      ease: "easeOut",
                    }}
                  />

                  {/* 图片预览提示 */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10 pointer-events-none">
                    <div className="bg-black/70 text-white px-6 py-3 rounded-full text-sm font-medium backdrop-blur-sm border border-white/20 shadow-lg">
                      🔍 点击放大图片
                    </div>
                  </div>
                  {/* 渐变叠加 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />

                  {/* 图片预览提示 - 移到图片容器外层 */}
                </motion.div>

                {/* 控制按钮组 */}
                <div className="absolute top-6 right-6 z-20 event-detail-button-group">
                  {/* 图片预览按钮 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsImagePreviewOpen(true)}
                    className="h-10 w-10 bg-white/15 text-white rounded-full border border-white/40 event-detail-preview-btn efficient-animation shadow-lg backdrop-blur-sm"
                    title="预览图片"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                  {/* 关闭按钮 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-10 w-10 bg-white/15 text-white rounded-full border border-white/40 event-detail-close-btn efficient-animation shadow-lg backdrop-blur-sm"
                    title="关闭"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* 状态徽章 */}
                <div className="absolute top-6 left-6 z-20">
                  <motion.div
                    layoutId={`badge-${event.id}`}
                    transition={{
                      type: "tween",
                      duration: 0.2,
                      ease: "easeOut",
                    }}
                  >
                    <Badge
                      variant={getStatusVariant(event.status)}
                      className="text-sm px-4 py-2 bg-white/10 border border-white/20 text-white performance-optimized"
                    >
                      {event.status}
                    </Badge>
                  </motion.div>
                </div>

                {/* 主要内容 */}
                <div className="absolute inset-0 flex flex-col justify-end">
                  {/* 标题区域 */}
                  <div className="px-8 pb-6">
                    <motion.div
                      layoutId={`content-${event.id}`}
                      className="space-y-4"
                      transition={{
                        type: "tween",
                        duration: 0.2,
                        ease: "easeOut",
                      }}
                    >
                      {/* 类别标签 */}
                      <div className="flex items-center gap-2 text-white/70">
                        <Camera className="h-4 w-4" />
                        <span className="text-sm font-medium">安全监控</span>
                      </div>

                      {/* 主标题 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">
                            {getTypeIcon(event.type)}
                          </span>
                          <motion.h1
                            layoutId={`title-${event.id}`}
                            className="text-3xl md:text-4xl font-bold text-white leading-tight"
                            transition={{
                              type: "tween",
                              duration: 0.2,
                              ease: "easeOut",
                            }}
                          >
                            {event.type}
                          </motion.h1>
                        </div>
                        <p className="text-lg text-white/80 max-w-2xl">
                          {getProcessingAdvice(event.type)}
                        </p>
                      </div>

                      {/* 事件信息卡片 */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl force-gpu">
                        <div className="bg-white/10 rounded-xl p-4 border border-white/20 performance-optimized efficient-animation">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-white/70" />
                            <div>
                              <div className="text-sm text-white/70">
                                发生时间
                              </div>
                              <motion.div
                                layoutId={`time-${event.id}`}
                                className="text-white font-medium"
                                transition={{
                                  type: "tween",
                                  duration: 0.2,
                                  ease: "easeOut",
                                }}
                              >
                                {event.time}
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/10 rounded-xl p-4 border border-white/20 performance-optimized efficient-animation">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-white/70" />
                            <div>
                              <div className="text-sm text-white/70">
                                监控位置
                              </div>
                              <motion.div
                                layoutId={`camera-${event.id}`}
                                className="text-white font-medium"
                                transition={{
                                  type: "tween",
                                  duration: 0.2,
                                  ease: "easeOut",
                                }}
                              >
                                {event.camera}
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/10 rounded-xl p-4 border border-white/20 performance-optimized efficient-animation">
                          <div className="flex items-center gap-3">
                            <Tag className="h-5 w-5 text-white/70" />
                            <div>
                              <div className="text-sm text-white/70">
                                事件类型
                              </div>
                              <div className="text-white font-medium">
                                {event.type}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/10 rounded-xl p-4 border border-white/20 performance-optimized efficient-animation">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-white/70" />
                            <div>
                              <div className="text-sm text-white/70">
                                处理状态
                              </div>
                              <div className="text-white font-medium">
                                {event.status}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="mt-8 flex gap-4">
                        <Button
                          onClick={() => {
                            console.log(`标记事件 ${event.id} 为已处理`);
                            onClose();
                          }}
                          disabled={event.status === "已处理"}
                          className="bg-white text-black hover:bg-white/90 px-8 py-3 rounded-full font-medium efficient-animation"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {event.status === "已处理" ? "已处理" : "标记已处理"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={onClose}
                          className="bg-white/10 border-white/20 text-white px-8 py-3 rounded-full font-medium efficient-animation"
                        >
                          关闭
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 图片预览组件 */}
      <ImagePreview
        images={[
          {
            src: event?.image || "",
            alt: `事件 ${event?.id} - ${event?.type}`,
            fileName: `event-${event?.id}-${event?.type}.jpg`,
            fileSize: 0,
          },
        ]}
        currentIndex={0}
        isOpen={isImagePreviewOpen}
        onClose={() => setIsImagePreviewOpen(false)}
      />
    </>
  );
};

export default EventDetailDialog;
