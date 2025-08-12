import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Upload, Eye, Download } from "lucide-react";
interface FileWithPreview extends File {
  preview: string;
  id: string;
}

interface UploadProgress {
  [key: string]: number;
}

function Uploader() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreview = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7),
      }),
    );
    setFiles((prev) => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
    onDrop,
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const clearAllFiles = () => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    setFiles([]);
    setUploadProgress({});
  };

  const simulateUpload = (file: FileWithPreview) => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        setUploadProgress((prev) => ({
          ...prev,
          [file.id]: Math.min(progress, 100),
        }));
      }, 200);
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // 模拟上传过程
    const uploadPromises = files.map((file) => simulateUpload(file));

    try {
      await Promise.all(uploadPromises);
      console.log("所有文件上传完成");
      // 这里可以添加成功提示
    } catch (error) {
      console.error("上传失败:", error);
      // 这里可以添加错误提示
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const previewImage = (file: FileWithPreview) => {
    window.open(file.preview, "_blank");
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col space-y-4">
      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={`
          border-dashed border-2 rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">释放文件以上传...</p>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              拖拽图片到此处，或点击选择文件
            </p>
            <p className="text-sm text-gray-500">
              支持 JPG、PNG、GIF、WebP 格式
            </p>
          </div>
        )}
      </div>

      {/* 文件列表 */}
      <div className="flex-1 flex flex-col space-y-4 min-h-0">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">已选择文件 ({files.length})</h3>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFiles}
              disabled={isUploading || files.length === 0}
            >
              清空全部
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={uploadFiles}
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? "上传中..." : "开始上传"}
            </Button>
          </div>
        </div>

        <div className="flex-1 w-full border rounded-md min-h-0">
          <ScrollArea className="w-full h-full">
            <div className="h-full">
              {files.length === 0 ? (
                <div className="absolute w-full flex items-center justify-center h-full text-gray-500">
                  暂无文件，请选择或拖拽文件到上方区域
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg bg-white shadow-sm"
                    >
                      {/* 预览图 */}
                      <div className="flex-shrink-0">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      </div>

                      {/* 文件信息 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>

                        {/* 上传进度 */}
                        {uploadProgress[file.id] !== undefined && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>上传进度</span>
                              <span>
                                {Math.round(uploadProgress[file.id])}%
                              </span>
                            </div>
                            <Progress
                              value={uploadProgress[file.id]}
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewImage(file)}
                          className="p-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          disabled={isUploading}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default Uploader;
