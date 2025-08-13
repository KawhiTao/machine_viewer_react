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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Camera,
  Clock,
  Tag,
  MapPin,
  AlertTriangle,
  X,
  Info,
} from "lucide-react";

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
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="!max-w-4xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        {/* Header */}
        <AlertDialogHeader className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">{getTypeIcon(event.type)}</span>
              事件详情 - {event.type}
            </AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 hover:bg-background/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription asChild>
          <div className="overflow-auto">
            <div className="p-4 space-y-4 pt-0">
              {/* Main Content */}
              <div className="grid lg:grid-cols-1 gap-y-4">
                {/* Left: Event Image */}
                <div className="lg:col-span-1">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Camera className="h-4 w-4" />
                      现场图像
                    </div>
                    <div className="relative border rounded-lg overflow-hidden">
                      <img
                        src={event.image}
                        alt={`事件 ${event.id}`}
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-image.jpg";
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={getStatusVariant(event.status)}
                          className="text-xs"
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Event Information */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      事件信息
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Tag className="h-3.5 w-3.5" />
                          事件类型
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          处理状态
                        </div>
                        <Badge
                          variant={getStatusVariant(event.status)}
                          className="text-xs"
                        >
                          {event.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          发生时间
                        </div>
                        <div className="text-sm font-mono">{event.time}</div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          监控位置
                        </div>
                        <div className="text-sm">{event.camera}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Processing Advice */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="space-y-1">
                    <div className="font-medium">处理建议</div>
                    <div className="text-muted-foreground">
                      {getProcessingAdvice(event.type)}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </AlertDialogDescription>

        {/* Footer */}
        <AlertDialogFooter className="px-4 py-3 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose} size="sm">
            关闭
          </Button>
          <Button
            onClick={() => {
              console.log(`标记事件 ${event.id} 为已处理`);
              onClose();
            }}
            disabled={event.status === "已处理"}
            size="sm"
          >
            {event.status === "已处理" ? "已处理" : "标记已处理"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EventDetailDialog;
