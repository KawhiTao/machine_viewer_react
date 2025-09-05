import React, { useState, useEffect, useRef } from "react";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  base64Data?: string;
  mimeType?: string;
  onError?: () => void;
  onLoad?: () => void;
}

const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className,
  base64Data,
  mimeType,
  onError,
  onLoad,
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 2;
  const createdUrlRef = useRef<string | null>(null);

  // 从 base64 数据创建 Blob URL
  const createBlobUrl = (base64: string, type: string): string | null => {
    try {
      // 清理之前创建的 URL
      if (createdUrlRef.current) {
        URL.revokeObjectURL(createdUrlRef.current);
      }

      // 移除 data:image/xxx;base64, 前缀（如果存在）
      const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type });
      const blobUrl = URL.createObjectURL(blob);

      createdUrlRef.current = blobUrl;
      return blobUrl;
    } catch (error) {
      console.error("创建 Blob URL 失败:", error);
      return null;
    }
  };

  // 处理图片加载错误
  const handleImageError = () => {
    console.warn(`⚠️ 图片加载失败: ${currentSrc}`);

    // 如果有 base64 数据且还没超过重试次数，尝试重新生成 Blob URL
    if (base64Data && mimeType && retryCountRef.current < maxRetries) {
      setIsRetrying(true);
      retryCountRef.current++;

      setTimeout(() => {
        const newBlobUrl = createBlobUrl(base64Data, mimeType);
        if (newBlobUrl) {
          console.log(
            `🔄 重新生成 Blob URL (第${retryCountRef.current}次重试):`,
            newBlobUrl,
          );
          setCurrentSrc(newBlobUrl);
          setIsRetrying(false);
        } else {
          console.error(
            `❌ 第${retryCountRef.current}次重试失败，无法生成 Blob URL`,
          );
          setHasError(true);
          setIsRetrying(false);
          onError?.();
        }
      }, 100);
    } else {
      setHasError(true);
      onError?.();
    }
  };

  // 处理图片加载成功
  const handleImageLoad = () => {
    console.log(`✅ 图片加载成功: ${currentSrc}`);
    setHasError(false);
    retryCountRef.current = 0;
    onLoad?.();
  };

  // 初始化时，如果 src 是 blob URL 但可能已失效，且有 base64 数据，则重新生成
  useEffect(() => {
    if (src.startsWith("blob:") && base64Data && mimeType) {
      // 测试当前的 blob URL 是否有效
      fetch(src)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Blob URL invalid");
          }
        })
        .catch(() => {
          // Blob URL 无效，重新生成
          const newBlobUrl = createBlobUrl(base64Data, mimeType);
          if (newBlobUrl) {
            console.log("🔍 检测到 Blob URL 失效，重新生成:", newBlobUrl);
            setCurrentSrc(newBlobUrl);
          } else {
            console.error("❌ 无法重新生成 Blob URL");
          }
        });
    }
  }, [src, base64Data, mimeType]);

  // 组件卸载时清理创建的 Blob URL
  useEffect(() => {
    return () => {
      if (createdUrlRef.current) {
        URL.revokeObjectURL(createdUrlRef.current);
        createdUrlRef.current = null;
      }
    };
  }, []);

  // 如果出错且无法恢复，显示错误占位符
  if (hasError && !isRetrying) {
    return (
      <div
        className={`${className} bg-gray-200 flex items-center justify-center text-gray-500 text-xs`}
      >
        图片加载失败
      </div>
    );
  }

  // 如果正在重试，显示加载状态
  if (isRetrying) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center text-gray-400 text-xs animate-pulse`}
      >
        重新加载中...
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

export default SmartImage;
