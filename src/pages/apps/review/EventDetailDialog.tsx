import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Camera, Clock, Tag } from "lucide-react";

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
  if (!event) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "已处理":
      case "processed":
        return "bg-green-100 text-green-800 border-green-300";
      case "待处理":
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "异常":
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
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

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="p-4 sm:max-w-[1200px] max-h-[85vh] overflow-hidden flex flex-col">
        <AlertDialogHeader className="flex-shrink-0">
          <AlertDialogTitle className="flex items-center gap-2 text-xl m-0">
            <span className="text-2xl">{getTypeIcon(event.type)}</span>
            事件详情 #{event.type}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <AlertDialogDescription asChild>
          <div className="flex-1 overflow-auto pr-2 space-y-4">
            {/* 事件图像 */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={event.image}
                  alt={`事件 ${event.id}`}
                  className="max-w-full h-auto rounded-lg border shadow-md"
                  style={{ maxHeight: "300px" }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-image.jpg";
                  }}
                />
              </div>
            </div>

            {/* 事件基本信息 */}
            <div className="grid grid-cols-1 gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">事件类型：</span>
                <Badge variant="outline" className="ml-auto">
                  {event.type}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">发生时间：</span>
                <span className="ml-auto text-gray-600">{event.time}</span>
              </div>

              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">摄像头：</span>
                <span className="ml-auto text-gray-600">{event.camera}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">处理状态：</span>
                <Badge className={`ml-auto ${getStatusColor(event.status)}`}>
                  {event.status}
                </Badge>
              </div>
            </div>

            {/* 操作建议 */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">处理建议</h4>
              <p className="text-sm text-blue-700">
                {event.type === "入侵检测" &&
                  "建议立即派遣安保人员到现场查看，确认是否存在安全威胁。"}
                {event.type === "人员识别" &&
                  "已识别到人员活动，请确认是否为授权人员。"}
                {event.type === "车辆检测" &&
                  "检测到车辆活动，请核实车辆信息和停放区域。"}
                {event.type === "异常行为" &&
                  "发现异常行为模式，建议进一步分析和处理。"}
                {!["入侵检测", "人员识别", "车辆检测", "异常行为"].includes(
                  event.type,
                ) && "请根据事件类型和现场情况采取相应的处理措施。"}
              </p>
            </div>
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter className="flex-shrink-0 flex gap-2 sm:gap-2 pt-4 mt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            关闭
          </Button>
          <Button
            onClick={() => {
              // 这里可以添加标记为已处理的逻辑
              console.log(`标记事件 ${event.id} 为已处理`);
              onClose();
            }}
            className="flex-1"
            disabled={event.status === "已处理"}
          >
            {event.status === "已处理" ? "已处理" : "标记已处理"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EventDetailDialog;
