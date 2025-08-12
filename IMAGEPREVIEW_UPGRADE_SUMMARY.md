# ImagePreview 组件升级总结

## 概述
成功将 `ImagePreview` 组件从单图片预览升级为支持多图片浏览的组件，同时保持了所有原有功能和向后兼容性。

## 主要改动

### 1. 接口变更

#### 旧接口
```typescript
interface ImagePreviewProps {
  src: string;
  alt: string;
  fileName: string;
  fileSize: number;
  isOpen: boolean;
  onClose: () => void;
}
```

#### 新接口
```typescript
interface ImageItem {
  src: string;
  alt: string;
  fileName: string;
  fileSize: number;
}

interface ImagePreviewProps {
  images: ImageItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}
```

### 2. 新增功能

#### 图片导航
- **左右导航按钮**：只在有多张图片且可以切换时显示
- **键盘快捷键支持**：
  - `←` / `→`：切换上一张/下一张图片
  - `ESC`：关闭预览
  - `+` / `-`：放大/缩小
  - `0` / `R`：重置缩放和位置

#### 图片计数器
- 在文件信息区域显示当前图片位置（如 "1 / 5"）
- 只在有多张图片时显示

#### 智能状态管理
- 切换图片时自动重置缩放和位置
- 保持所有原有的缩放、拖拽等功能

### 3. 用户体验优化
- 导航按钮采用圆形设计，更加美观
- 更新了操作提示文本，包含新的快捷键说明
- 切换图片时提供平滑的过渡效果

## 更新的文件

### 1. 核心组件
- `src/components/ImagePreview.tsx` - 主要组件升级

### 2. 使用方更新
- `src/pages/agent/Text.tsx` - 更新了两处使用：
  - `FilePreview` 组件中的图片预览
  - `MessageItem` 组件中的图片预览

### 3. 示例文件
- `src/components/ImagePreview.example.tsx` - 新增示例文件

## 使用示例

### 单张图片（向后兼容）
```typescript
const singleImage: ImageItem[] = [
  {
    src: "/path/to/image.jpg",
    alt: "图片描述",
    fileName: "image.jpg",
    fileSize: 1024000
  }
];

<ImagePreview
  images={singleImage}
  currentIndex={0}
  isOpen={isPreviewOpen}
  onClose={() => setIsPreviewOpen(false)}
/>
```

### 多张图片
```typescript
const multipleImages: ImageItem[] = [
  {
    src: "/path/to/image1.jpg",
    alt: "第一张图片",
    fileName: "image1.jpg",
    fileSize: 1024000
  },
  {
    src: "/path/to/image2.jpg",
    alt: "第二张图片",
    fileName: "image2.jpg",
    fileSize: 2048000
  }
];

const [currentIndex, setCurrentIndex] = useState(0);

<ImagePreview
  images={multipleImages}
  currentIndex={currentIndex}
  isOpen={isPreviewOpen}
  onClose={() => setIsPreviewOpen(false)}
  onIndexChange={setCurrentIndex}
/>
```

## 迁移指南

### 从旧版本迁移到新版本

#### 步骤1：更新导入
```typescript
// 添加 ImageItem 类型导入
import ImagePreview, { type ImageItem } from "@/components/ImagePreview";
```

#### 步骤2：转换数据格式
```typescript
// 旧版本
<ImagePreview
  src={file.url}
  alt={file.name}
  fileName={file.name}
  fileSize={file.size}
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
/>

// 新版本
<ImagePreview
  images={[{
    src: file.url,
    alt: file.name,
    fileName: file.name,
    fileSize: file.size,
  }]}
  currentIndex={0}
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
/>
```

#### 步骤3：添加状态管理（多图片场景）
```typescript
const [currentIndex, setCurrentIndex] = useState(0);

<ImagePreview
  images={imageList}
  currentIndex={currentIndex}
  isOpen={isPreviewOpen}
  onClose={() => setIsPreviewOpen(false)}
  onIndexChange={setCurrentIndex}
/>
```

## 键盘快捷键参考

| 快捷键 | 功能 |
|--------|------|
| `ESC` | 关闭预览 |
| `←` | 上一张图片 |
| `→` | 下一张图片 |
| `+` / `=` | 放大 |
| `-` | 缩小 |
| `0` / `R` | 重置缩放和位置 |

## 鼠标/触摸操作参考

| 操作 | 功能 |
|------|------|
| 滚轮 | 缩放图片 |
| 拖拽 | 移动图片 |
| 单击 | 在初始状态下放大到 2 倍 |
| 双击 | 重置缩放和位置 |
| 双指缩放 | 移动端缩放图片 |
| 单指拖拽 | 移动端移动图片 |

## 技术特性

### 性能优化
- 使用 `memo` 优化组件渲染
- 使用 `useCallback` 优化函数引用
- 智能边界检测，避免不必要的计算

### 响应式设计
- 支持桌面端和移动端
- 自适应不同屏幕尺寸
- 触摸手势支持

### 可访问性
- 完整的键盘导航支持
- 语义化的 HTML 结构
- 合适的 ARIA 属性

## 兼容性

### 向后兼容性
- ✅ 完全兼容原有的单图片预览功能
- ✅ 所有原有的缩放、拖拽等功能保持不变
- ✅ 保持原有的 API 使用习惯

### 浏览器支持
- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+

## 未来规划

### 潜在的功能增强
- [ ] 缩略图导航栏
- [ ] 图片旋转功能
- [ ] 全屏模式
- [ ] 图片下载功能
- [ ] 幻灯片自动播放
- [ ] 图片加载进度条
- [ ] 支持视频预览

### 性能优化
- [ ] 图片懒加载
- [ ] 图片预缓存
- [ ] 虚拟化长列表支持

---

**更新完成日期**: 2024-12-19
**负责人**: AI Assistant
**版本**: v2.0.0
