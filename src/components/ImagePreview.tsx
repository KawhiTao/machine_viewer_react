import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import ReactDOM from "react-dom";
import { Button } from "@/components/ui/button";
import {
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

export interface ImageItem {
  src: string;
  alt: string;
  fileName: string;
  fileSize: number;
}

export interface ImagePreviewProps {
  images: ImageItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

const ImagePreview = memo(
  ({
    images,
    currentIndex,
    isOpen,
    onClose,
    onIndexChange,
  }: ImagePreviewProps) => {
    // 图片缩放和拖拽状态
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // 触摸相关状态
    const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);
    const [touchStartScale, setTouchStartScale] = useState<number>(1);

    // 获取当前图片信息
    const currentImage = images[currentIndex] || null;
    const hasMultipleImages = images.length > 1;

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // 重置缩放和位置
    const resetImageView = useCallback(() => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }, []);

    // 图片导航
    const goToPrevious = useCallback(() => {
      if (hasMultipleImages && currentIndex > 0 && onIndexChange) {
        resetImageView();
        onIndexChange(currentIndex - 1);
      }
    }, [hasMultipleImages, currentIndex, onIndexChange, resetImageView]);

    const goToNext = useCallback(() => {
      if (
        hasMultipleImages &&
        currentIndex < images.length - 1 &&
        onIndexChange
      ) {
        resetImageView();
        onIndexChange(currentIndex + 1);
      }
    }, [
      hasMultipleImages,
      currentIndex,
      images.length,
      onIndexChange,
      resetImageView,
    ]);

    // 计算边界限制
    const getBoundedPosition = useCallback(
      (newX: number, newY: number) => {
        if (!containerRef.current || !imageRef.current) {
          return { x: newX, y: newY };
        }

        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // 获取原始图片尺寸
        const imageWidth = imageRef.current.naturalWidth * scale;
        const imageHeight = imageRef.current.naturalHeight * scale;

        // 如果图片小于容器，限制在中心区域
        if (imageWidth <= containerWidth) {
          newX = 0;
        } else {
          const maxX = (imageWidth - containerWidth) / 2;
          newX = Math.max(-maxX, Math.min(maxX, newX));
        }

        if (imageHeight <= containerHeight) {
          newY = 0;
        } else {
          const maxY = (imageHeight - containerHeight) / 2;
          newY = Math.max(-maxY, Math.min(maxY, newY));
        }

        return { x: newX, y: newY };
      },
      [scale],
    );

    // 滚轮缩放
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current || !imageRef.current) return;

      const container = containerRef.current.getBoundingClientRect();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;

      // 计算鼠标相对于容器中心的位置
      const mouseX = e.clientX - container.left - container.width / 2;
      const mouseY = e.clientY - container.top - container.height / 2;

      setScale((prevScale) => {
        const newScale = Math.max(0.1, Math.min(5, prevScale + delta));

        if (newScale !== prevScale) {
          const scaleFactor = newScale / prevScale;
          // 根据缩放调整位置，使缩放以鼠标为中心
          setPosition((prev) => {
            const newX = prev.x - mouseX * (scaleFactor - 1);
            const newY = prev.y - mouseY * (scaleFactor - 1);
            return getBoundedPosition(newX, newY);
          });
        }

        return newScale;
      });
    };

    // 开始拖拽
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();

      // 使用ref立即设置拖拽状态
      isDraggingRef.current = true;
      setIsDragging(true);

      // 计算相对于图片当前位置的偏移
      const dragStartX = e.clientX - position.x;
      const dragStartY = e.clientY - position.y;
      dragStartRef.current = { x: dragStartX, y: dragStartY };

      // 立即监听全局鼠标移动和释放事件
      const handleGlobalMouseMove = (e: MouseEvent) => {
        // 使用ref检查拖拽状态
        if (!isDraggingRef.current) return;

        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        setPosition(getBoundedPosition(newX, newY));
      };

      const handleGlobalMouseUp = () => {
        // 立即停止拖拽
        isDraggingRef.current = false;
        setIsDragging(false);

        // 移除所有相关事件监听器
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
        document.removeEventListener("mouseleave", handleMouseLeave);
      };

      const handleMouseLeave = () => {
        // 鼠标离开窗口时也停止拖拽
        handleGlobalMouseUp();
      };

      document.addEventListener("mousemove", handleGlobalMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleGlobalMouseUp, {
        passive: false,
      });
      document.addEventListener("mouseleave", handleMouseLeave, {
        passive: false,
      });
    };

    // 这些事件处理器不再需要，因为我们使用全局事件监听

    // 双击重置
    const handleDoubleClick = () => {
      resetImageView();
    };

    // 单击放大（初始状态下）
    const handleImageClick = (e: React.MouseEvent) => {
      e.stopPropagation();

      // 如果是初始状态（scale = 1），单击放大到2倍
      if (scale === 1) {
        setScale(2);

        // 计算以点击位置为中心的缩放
        if (containerRef.current) {
          const container = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - container.left - container.width / 2;
          const mouseY = e.clientY - container.top - container.height / 2;

          // 调整位置使缩放以点击位置为中心
          setPosition((prev) => {
            const newX = prev.x - mouseX;
            const newY = prev.y - mouseY;
            return getBoundedPosition(newX, newY);
          });
        }
      }
    };

    // 触摸事件处理
    const getTouchDistance = (touches: React.TouchList) => {
      if (touches.length < 2) return 0;
      const touch1 = touches[0];
      const touch2 = touches[1];
      return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2),
      );
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        // 单指拖拽
        const touch = e.touches[0];
        isDraggingRef.current = true;
        setIsDragging(true);

        // 计算相对于图片当前位置的偏移
        const dragStartX = touch.clientX - position.x;
        const dragStartY = touch.clientY - position.y;
        dragStartRef.current = { x: dragStartX, y: dragStartY };

        // 立即监听全局触摸移动和结束事件
        const handleGlobalTouchMove = (e: TouchEvent) => {
          if (!isDraggingRef.current) return;

          if (e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            const newX = touch.clientX - dragStartRef.current.x;
            const newY = touch.clientY - dragStartRef.current.y;
            setPosition(getBoundedPosition(newX, newY));
          }
        };

        const handleGlobalTouchEnd = () => {
          isDraggingRef.current = false;
          setIsDragging(false);
          document.removeEventListener("touchmove", handleGlobalTouchMove);
          document.removeEventListener("touchend", handleGlobalTouchEnd);
        };

        document.addEventListener("touchmove", handleGlobalTouchMove, {
          passive: false,
        });
        document.addEventListener("touchend", handleGlobalTouchEnd);
      } else if (e.touches.length === 2) {
        // 双指缩放
        e.preventDefault();
        const distance = getTouchDistance(e.touches);
        setLastTouchDistance(distance);
        setTouchStartScale(scale);
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        // 双指缩放
        e.preventDefault();
        const distance = getTouchDistance(e.touches);
        if (lastTouchDistance > 0) {
          const scaleRatio = distance / lastTouchDistance;
          const newScale = Math.max(
            0.1,
            Math.min(5, touchStartScale * scaleRatio),
          );
          setScale(newScale);
        }
      }
      // 单指拖拽现在通过全局事件监听处理，这里不再需要处理
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (e.touches.length === 0) {
        setLastTouchDistance(0);
      } else if (e.touches.length === 1) {
        setLastTouchDistance(0);
      }
    };

    // 当模态框打开或图片索引变化时重置状态
    useEffect(() => {
      if (isOpen) {
        resetImageView();
        // 防止背景页面滚动
        document.body.style.overflow = "hidden";
      } else {
        // 重置拖拽状态
        isDraggingRef.current = false;
        setIsDragging(false);
        // 恢复页面滚动
        document.body.style.overflow = "auto";
      }

      return () => {
        // 清理时确保恢复滚动
        document.body.style.overflow = "auto";
      };
    }, [isOpen, currentIndex, resetImageView]);

    // 键盘快捷键
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case "Escape":
            onClose();
            break;
          case "+":
          case "=":
            e.preventDefault();
            setScale((prev) => Math.min(5, prev + 0.2));
            break;
          case "-":
            e.preventDefault();
            setScale((prev) => Math.max(0.1, prev - 0.2));
            break;
          case "0":
            e.preventDefault();
            resetImageView();
            break;
          case "r":
          case "R":
            e.preventDefault();
            resetImageView();
            break;
          case "ArrowLeft":
            e.preventDefault();
            goToPrevious();
            break;
          case "ArrowRight":
            e.preventDefault();
            goToNext();
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, goToPrevious, goToNext, resetImageView]);

    // 窗口大小变化时调整位置
    useEffect(() => {
      if (!isOpen) return;

      const handleResize = () => {
        setPosition((prev) => getBoundedPosition(prev.x, prev.y));
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [isOpen, scale, getBoundedPosition]);

    // 当模态框关闭时立即清理拖拽状态
    useEffect(() => {
      if (!isOpen) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    }, [isOpen]);

    if (!isOpen || !currentImage) return null;

    return ReactDOM.createPortal(
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onWheel={handleWheel}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <img
            ref={imageRef}
            src={currentImage.src}
            alt={currentImage.alt}
            className="w-auto h-auto max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: isDragging ? "grabbing" : scale > 1 ? "grab" : "zoom-in",
              transition: isDragging ? "none" : "transform 0.2s ease-out",
              userSelect: "none",
              touchAction: "none", // 防止浏览器默认的触摸行为
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            onClick={handleImageClick}
            draggable={false}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          />

          {/* 图片导航按钮 */}
          {hasMultipleImages && (
            <>
              {currentIndex > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 bg-black/60 text-white border-0 transition-all rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevious();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="上一张 (←)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                </motion.div>
              )}

              {currentIndex < images.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 bg-black/60 text-white border-0 transition-all rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="下一张 (→)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </motion.div>
              )}
            </>
          )}

          {/* 控制按钮组 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="absolute top-4 right-4 flex flex-col gap-2 z-10"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-black/60  text-white border-0 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="关闭 (ESC)"
            >
              <X className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-black/60  text-white border-0 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setScale((prev) => Math.min(5, prev + 0.2));
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="放大 (+)"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-black/60  text-white border-0 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setScale((prev) => Math.max(0.1, prev - 0.2));
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="缩小 (-)"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-black/60  text-white border-0 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                resetImageView();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="重置 (0/R)"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* 文件信息和缩放提示 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="absolute bottom-4 left-4 flex flex-col gap-2 z-10"
          >
            <div className="bg-black/60 text-white px-3 py-1 rounded text-sm">
              {currentImage.fileName} ({formatFileSize(currentImage.fileSize)})
              {hasMultipleImages && (
                <span className="ml-2 opacity-80">
                  {currentIndex + 1} / {images.length}
                </span>
              )}
            </div>
            <div className="bg-black/60 text-white px-3 py-1 rounded text-xs opacity-80">
              缩放: {Math.round(scale * 100)}% |
              {scale === 1 ? " 单击放大 | " : " "}
              PC: 滚轮/±键缩放, 拖拽移动{hasMultipleImages ? ", ←→切换" : ""} |
              移动端: 双指缩放, 单指拖拽 | 双击/0/R重置 | ESC关闭
            </div>
          </motion.div>
        </motion.div>
      </motion.div>,
      document.body,
    );
  },
);

ImagePreview.displayName = "ImagePreview";

export default ImagePreview;
