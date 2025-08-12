import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle } from "lucide-react";

interface Event {
  id: number;
  type: string;
  time: string;
  camera: string;
  status: string;
  image: string;
}

interface EventCardProps {
  event: Event;
  isSelected: boolean;
  viewMode: "grid" | "list";
  onSelect: (id: number, checked: boolean) => void;
  onView?: (eventId: number) => void;
  onConfirm?: (eventId: number) => void;
}

// 内存化的网格视图卡片组件
const GridEventCard = memo(
  ({
    event,
    isSelected,
    onSelect,
    onView,
    onConfirm,
  }: Omit<EventCardProps, "viewMode">) => {
    return (
      <Card className="group relative !p-0 hover:shadow-md transition-all duration-200">
        <CardContent className="p-0">
          <div className="relative">
            <div className="absolute top-2 left-2 z-5">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelect(event.id, checked as boolean)
                }
                className="bg-white/80 backdrop-blur-sm"
              />
            </div>
            <div className="h-48 overflow-hidden rounded-t-lg">
              <img
                src={event.image}
                alt={event.type}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                // style={{
                //   background:
                //     "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                // }}
                loading="lazy"
              />
            </div>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <Badge
                className={
                  event.status === "人工确认"
                    ? "bg-green-500 text-white"
                    : "bg-gray-500 text-white"
                }
              >
                {event.status}
              </Badge>
              <h4 className="font-medium text-sm truncate">{event.type}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{event.time}</p>
            <p className="text-xs text-muted-foreground truncate">
              {event.camera}
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onView?.(event.id)}
              >
                <Eye className="h-3 w-3 mr-1" />
                查看
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onConfirm?.(event.id)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                确认
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

// 内存化的列表视图卡片组件
const ListEventCard = memo(
  ({
    event,
    isSelected,
    onSelect,
    onView,
    onConfirm,
  }: Omit<EventCardProps, "viewMode">) => {
    return (
      <Card className="py-0 !gap-0 border-0 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                onSelect(event.id, checked as boolean)
              }
            />
            <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
              <img
                src={event.image}
                alt={event.type}
                className="w-full h-full object-cover"
                // style={{
                //   background:
                //     "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                // }}
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{event.type}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {event.time}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {event.camera}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge
                className={
                  event.status === "人工确认"
                    ? "bg-green-500 text-white"
                    : "bg-gray-500 text-white"
                }
              >
                {event.status}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView?.(event.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onConfirm?.(event.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

// 主事件卡片组件
const EventCard = memo<EventCardProps>(
  ({ event, isSelected, viewMode, onSelect, onView, onConfirm }) => {
    if (viewMode === "grid") {
      return (
        <GridEventCard
          event={event}
          isSelected={isSelected}
          onSelect={onSelect}
          onView={onView}
          onConfirm={onConfirm}
        />
      );
    }

    return (
      <ListEventCard
        event={event}
        isSelected={isSelected}
        onSelect={onSelect}
        onView={onView}
        onConfirm={onConfirm}
      />
    );
  },
);

// 设置显示名称便于调试
GridEventCard.displayName = "GridEventCard";
ListEventCard.displayName = "ListEventCard";
EventCard.displayName = "EventCard";

export default EventCard;
export type { Event, EventCardProps };
