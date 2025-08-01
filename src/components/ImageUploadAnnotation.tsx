import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, Save, Trash2 } from 'lucide-react';

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

interface ImageUploadAnnotationProps {
  onImageUpload?: (file: File) => void;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
}

const ImageUploadAnnotation: React.FC<ImageUploadAnnotationProps> = ({
  onImageUpload,
  onAnnotationsChange,
  maxFileSize = 10,
  acceptedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'];

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!acceptedFileTypes.includes(file.type)) {
      alert(`不支持的文件类型。请选择: ${acceptedFileTypes.join(', ')}`);
      return;
    }

    // 验证文件大小
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`文件大小不能超过 ${maxFileSize}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setAnnotations([]);
      onImageUpload?.(file);
    };
    reader.readAsDataURL(file);
  }, [acceptedFileTypes, maxFileSize, onImageUpload]);

  const handleCanvasMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setStartPoint({ x, y });
  }, []);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const currentX = (event.clientX - rect.left) * scaleX;
    const currentY = (event.clientY - rect.top) * scaleY;

    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;

    setCurrentAnnotation({
      id: Date.now().toString(),
      x: Math.min(startPoint.x, currentX),
      y: Math.min(startPoint.y, currentY),
      width: Math.abs(width),
      height: Math.abs(height),
      text: '',
      color: selectedColor
    });
  }, [isDrawing, startPoint, selectedColor]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing || !currentAnnotation) return;

    setIsDrawing(false);
    setStartPoint(null);
    
    if (currentAnnotation.width > 10 && currentAnnotation.height > 10) {
      setEditingAnnotation(currentAnnotation.id);
      setAnnotationText('');
    }
    setCurrentAnnotation(null);
  }, [isDrawing, currentAnnotation]);

  const saveAnnotation = useCallback(() => {
    if (!editingAnnotation || !currentAnnotation) return;

    const newAnnotation = {
      ...currentAnnotation,
      text: annotationText
    };

    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);
    setEditingAnnotation(null);
    setAnnotationText('');
    onAnnotationsChange?.(updatedAnnotations);
  }, [editingAnnotation, currentAnnotation, annotationText, annotations, onAnnotationsChange]);

  const deleteAnnotation = useCallback((id: string) => {
    const updatedAnnotations = annotations.filter(ann => ann.id !== id);
    setAnnotations(updatedAnnotations);
    onAnnotationsChange?.(updatedAnnotations);
  }, [annotations, onAnnotationsChange]);

  const drawAnnotations = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 绘制图片
    ctx.drawImage(img, 0, 0);

    // 绘制保存的标注
    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      
      if (annotation.text) {
        ctx.fillStyle = annotation.color;
        ctx.font = '16px Arial';
        ctx.fillText(annotation.text, annotation.x, annotation.y - 5);
      }
    });

    // 绘制当前正在绘制的标注
    if (currentAnnotation) {
      ctx.strokeStyle = currentAnnotation.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(currentAnnotation.x, currentAnnotation.y, currentAnnotation.width, currentAnnotation.height);
      ctx.setLineDash([]);
    }
  }, [annotations, currentAnnotation]);

  React.useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && acceptedFileTypes.includes(file.type)) {
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      
      const syntheticEvent = {
        target: input
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  }, [acceptedFileTypes, handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            图片上传与标注
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!image ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                点击上传或拖拽图片到此处
              </p>
              <p className="text-sm text-gray-500">
                支持 JPG, PNG, GIF, WebP 格式，最大 {maxFileSize}MB
              </p>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={acceptedFileTypes.join(',')}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* 颜色选择器 */}
              <div className="flex items-center gap-2">
                <Label>选择标注颜色：</Label>
                <div className="flex gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border-2 ${
                        selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              {/* 图片和标注区域 */}
              <div className="relative inline-block">
                <img
                  ref={imageRef}
                  src={image}
                  alt="上传的图片"
                  className="max-w-full h-auto"
                  onLoad={drawAnnotations}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 cursor-crosshair"
                  style={{ width: '100%', height: '100%' }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                />
              </div>

              {/* 标注列表 */}
              {annotations.length > 0 && (
                <div className="mt-4">
                  <Label className="text-lg font-medium mb-2 block">标注列表：</Label>
                  <div className="space-y-2">
                    {annotations.map((annotation, index) => (
                      <div
                        key={annotation.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                      >
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: annotation.color }}
                        />
                        <span className="flex-1">
                          标注 {index + 1}: {annotation.text || '无文字'}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAnnotation(annotation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 重新上传按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setImage(null);
                    setAnnotations([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  重新上传
                </Button>
              </div>
            </div>
          )}

          {/* 标注文字编辑对话框 */}
          <Dialog open={!!editingAnnotation} onOpenChange={() => setEditingAnnotation(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加标注文字</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="annotation-text">标注文字：</Label>
                  <Input
                    id="annotation-text"
                    value={annotationText}
                    onChange={(e) => setAnnotationText(e.target.value)}
                    placeholder="输入标注文字（可选）"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveAnnotation}>
                    <Save className="h-4 w-4 mr-2" />
                    保存标注
                  </Button>
                  <Button variant="outline" onClick={() => setEditingAnnotation(null)}>
                    取消
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageUploadAnnotation;
