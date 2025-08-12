import { useState } from "react";
import { Button } from "@/components/ui/button";
import ImagePreview, { type ImageItem } from "@/components/ImagePreview";

// 示例图片数据
const sampleImages: ImageItem[] = [
  {
    src: "https://picsum.photos/800/600?random=1",
    alt: "示例图片 1",
    fileName: "landscape-1.jpg",
    fileSize: 1024000, // 1MB
  },
  {
    src: "https://picsum.photos/600/800?random=2",
    alt: "示例图片 2",
    fileName: "portrait-1.jpg",
    fileSize: 2048000, // 2MB
  },
  {
    src: "https://picsum.photos/800/800?random=3",
    alt: "示例图片 3",
    fileName: "square-1.jpg",
    fileSize: 1536000, // 1.5MB
  },
  {
    src: "https://picsum.photos/1200/600?random=4",
    alt: "示例图片 4",
    fileName: "wide-1.jpg",
    fileSize: 3072000, // 3MB
  },
  {
    src: "https://picsum.photos/600/1200?random=5",
    alt: "示例图片 5",
    fileName: "tall-1.jpg",
    fileSize: 2560000, // 2.5MB
  },
];

export default function ImagePreviewExample() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 单张图片预览示例
  const handleSingleImagePreview = (imageIndex: number) => {
    setCurrentIndex(imageIndex);
    setIsPreviewOpen(true);
  };

  // 多张图片预览示例
  const handleMultipleImagePreview = (startIndex: number = 0) => {
    setCurrentIndex(startIndex);
    setIsPreviewOpen(true);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">ImagePreview 组件示例</h1>
        <p className="text-muted-foreground">
          展示支持多图片浏览的 ImagePreview 组件的各种用法
        </p>
      </div>

      {/* 图片网格展示 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {sampleImages.map((image, index) => (
          <div
            key={index}
            className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-200"
            onClick={() => handleSingleImagePreview(index)}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs font-medium truncate">
                {image.fileName}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() => handleMultipleImagePreview(0)}
          className="min-w-[200px]"
        >
          从第一张开始浏览全部
        </Button>
        <Button
          variant="outline"
          onClick={() => handleMultipleImagePreview(2)}
          className="min-w-[200px]"
        >
          从第三张开始浏览全部
        </Button>
      </div>

      {/* 使用说明 */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">使用方法</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">键盘快捷键：</h3>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li>
                <code>ESC</code> - 关闭预览
              </li>
              <li>
                <code>←/→</code> - 切换上一张/下一张图片
              </li>
              <li>
                <code>+/-</code> - 放大/缩小
              </li>
              <li>
                <code>0</code> 或 <code>R</code> - 重置缩放和位置
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">鼠标操作：</h3>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li>滚轮 - 缩放图片</li>
              <li>拖拽 - 移动图片</li>
              <li>单击 - 在初始状态下放大到 2 倍</li>
              <li>双击 - 重置缩放和位置</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">触摸操作：</h3>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li>双指缩放 - 缩放图片</li>
              <li>单指拖拽 - 移动图片</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 代码示例 */}
      <div className="bg-muted/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">代码示例</h2>
        <pre className="text-sm bg-background rounded p-4 overflow-x-auto">
          <code>{`import ImagePreview, { ImageItem } from "@/components/ImagePreview";

// 图片数据
const images: ImageItem[] = [
  {
    src: "/path/to/image1.jpg",
    alt: "图片描述",
    fileName: "image1.jpg",
    fileSize: 1024000
  },
  // ... 更多图片
];

function MyComponent() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <>
      {/* 触发按钮 */}
      <button onClick={() => setIsPreviewOpen(true)}>
        查看图片
      </button>

      {/* 图片预览组件 */}
      <ImagePreview
        images={images}
        currentIndex={currentIndex}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onIndexChange={setCurrentIndex}
      />
    </>
  );
}`}</code>
        </pre>
      </div>

      {/* ImagePreview 组件 */}
      <ImagePreview
        images={sampleImages}
        currentIndex={currentIndex}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onIndexChange={setCurrentIndex}
      />
    </div>
  );
}
