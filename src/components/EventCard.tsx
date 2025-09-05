import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

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
      <motion.div
        layoutId={`card-container-${event.id}`}
        className="h-full relative"
        style={{
          zIndex: 1,
          transformOrigin: "center center",
        }}
        whileHover={{
          zIndex: 10,
          scale: 1.02,
          y: -4,
        }}
        transition={{
          type: "tween",
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        <Card className="group relative !p-0 hover:shadow-xl transition-all duration-300 h-full overflow-hidden rounded-xl">
          <CardContent className="p-0 h-full flex flex-col relative">
            <div className="relative">
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    onSelect(event.id, checked as boolean)
                  }
                  className="bg-white/90 backdrop-blur-sm border-white/50 shadow-sm"
                />
              </div>
              <motion.div
                layoutId={`image-container-${event.id}`}
                className="overflow-hidden relative"
                transition={{
                  type: "tween",
                  duration: 0.15,
                  ease: "easeOut",
                }}
              >
                <motion.img
                  layoutId={`image-${event.id}`}
                  src={event.image}
                  alt={event.type}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  transition={{
                    type: "tween",
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                />
                {/* 轻微的渐变叠加，为卡片风格做准备 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
              <div className="absolute top-3 right-3 z-10">
                <motion.div
                  layoutId={`badge-${event.id}`}
                  transition={{
                    type: "tween",
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                >
                  <Badge
                    variant={
                      event.status === "已处理"
                        ? "default"
                        : event.status === "待处理"
                          ? "secondary"
                          : event.status === "异常"
                            ? "destructive"
                            : "outline"
                    }
                    className="text-xs px-3 py-1 bg-white/90 backdrop-blur-sm border-white/50 shadow-sm"
                  >
                    {event.status}
                  </Badge>
                </motion.div>
              </div>
            </div>
            <motion.div
              layoutId={`content-${event.id}`}
              className="p-4 space-y-3 flex-1 flex flex-col bg-background"
              transition={{
                type: "tween",
                duration: 0.15,
                ease: "easeOut",
              }}
            >
              <motion.h4
                layoutId={`title-${event.id}`}
                className="font-semibold text-base truncate"
                transition={{
                  type: "tween",
                  duration: 0.15,
                  ease: "easeOut",
                }}
              >
                {event.type}
              </motion.h4>
              <motion.p
                layoutId={`time-${event.id}`}
                className="text-sm text-muted-foreground"
                transition={{
                  type: "tween",
                  duration: 0.15,
                  ease: "easeOut",
                }}
              >
                {event.time}
              </motion.p>
              <motion.p
                layoutId={`camera-${event.id}`}
                className="text-sm text-muted-foreground truncate"
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                }}
              >
                {event.camera}
              </motion.p>
              <div className="flex gap-2 pt-2 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => onView?.(event.id)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  查看
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 hover:bg-green-500 hover:text-white transition-colors"
                  onClick={() => onConfirm?.(event.id)}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  确认
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
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
      <motion.div
        layoutId={`card-container-${event.id}`}
        className="relative"
        style={{
          zIndex: 1,
          transformOrigin: "center center",
        }}
        whileHover={{
          zIndex: 10,
          scale: 1.01,
          y: -2,
        }}
        transition={{
          type: "tween",
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        <Card className="py-0 !gap-0 border shadow-sm hover:shadow-lg transition-all duration-300 rounded-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelect(event.id, checked as boolean)
                }
                className="bg-background shadow-sm"
              />
              <motion.div
                layoutId={`image-container-${event.id}`}
                className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 relative"
                transition={{
                  type: "tween",
                  duration: 0.15,
                  ease: "easeOut",
                }}
              >
                <motion.img
                  layoutId={`image-${event.id}`}
                  src={event.image}
                  alt={event.type}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  loading="lazy"
                  transition={{
                    type: "tween",
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                />
              </motion.div>
              <motion.div
                layoutId={`content-${event.id}`}
                className="flex-1 min-w-0"
                transition={{
                  type: "tween",
                  duration: 0.15,
                  ease: "easeOut",
                }}
              >
                <motion.h4
                  layoutId={`title-${event.id}`}
                  className="font-semibold text-sm truncate"
                  transition={{
                    type: "tween",
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                >
                  {event.type}
                </motion.h4>
                <motion.p
                  layoutId={`time-${event.id}`}
                  className="text-xs text-muted-foreground truncate"
                  transition={{
                    type: "tween",
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                >
                  {event.time}
                </motion.p>
                <motion.p
                  layoutId={`camera-${event.id}`}
                  className="text-xs text-muted-foreground truncate"
                  transition={{
                    type: "tween",
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                >
                  {event.camera}
                </motion.p>
              </motion.div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <motion.div
                  layoutId={`badge-${event.id}`}
                  transition={{
                    type: "tween",
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                >
                  <Badge
                    variant={
                      event.status === "已处理"
                        ? "default"
                        : event.status === "待处理"
                          ? "secondary"
                          : event.status === "异常"
                            ? "destructive"
                            : "outline"
                    }
                    className="text-xs px-2 py-1"
                  >
                    {event.status}
                  </Badge>
                </motion.div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => onView?.(event.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-green-500 hover:text-white transition-colors"
                    onClick={() => onConfirm?.(event.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
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
