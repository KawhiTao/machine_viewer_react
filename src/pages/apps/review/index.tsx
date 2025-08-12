import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EventDetailDialog from "@/pages/apps/review/EventDetailDialog";
import { Input } from "@/components/ui/input";

import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePassiveScrollOptimization } from "@/hooks/usePassiveEventListener";
import EventCard, { type Event } from "@/components/EventCard";
import {
  Grid3X3,
  List,
  Check,
  Cog,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Uploader from "@/pages/apps/review/Uploader";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function Review() {
  // 使用性能优化的被动事件监听器
  usePassiveScrollOptimization();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<typeof mockEvents>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  // 模拟事件数据
  const mockEvents = useMemo(
    (): Event[] => [
      {
        id: 1,
        type: "违停事件",
        time: "2025.06.09--12：58",
        camera: "相机1 南向",
        status: "AI图审",
        image: "/images/demo.jpg",
      },
      {
        id: 2,
        type: "违停事件",
        time: "2025.06.09--12：58",
        camera: "相机1 南向",
        status: "人工确认",
        image: "/images/demo.jpg",
      },
      {
        id: 3,
        type: "违停事件",
        time: "2025.06.09--12：58",
        camera: "相机2 南向",
        status: "AI图审",
        image: "/images/demo.jpg",
      },
      {
        id: 4,
        type: "违停事件",
        time: "2025.06.09--12：58",
        camera: "相机1 南向",
        status: "AI图审",
        image: "/images/demo.jpg",
      },
      {
        id: 5,
        type: "违停事件",
        time: "2025.06.09--12：58",
        camera: "相机2 南向",
        status: "人工确认",
        image: "/images/demo.jpg",
      },
      {
        id: 6,
        type: "违停事件",
        time: "2025.06.09--12：58",
        camera: "相机2 南向",
        status: "AI图审",
        image: "/images/demo.jpg",
      },
      {
        id: 7,
        type: "行人事件",
        time: "2025.06.09--13：15",
        camera: "相机3 北向",
        status: "AI图审",
        image: "/images/demo.jpg",
      },
      {
        id: 8,
        type: "抛洒物事件",
        time: "2025.06.09--13：22",
        camera: "相机1 南向",
        status: "人工确认",
        image: "/images/demo.jpg",
      },
      {
        id: 9,
        type: "烟火事件",
        time: "2025.06.09--13：30",
        camera: "相机2 南向",
        status: "AI图审",
        image: "/images/demo.jpg",
      },
      {
        id: 10,
        type: "违规行驶",
        time: "2025.06.09--13：45",
        camera: "相机3 北向",
        status: "AI图审",
        image: "/images/demo.jpg",
      },
      {
        id: 11,
        type: "违停事件",
        time: "2025.06.09--14：00",
        camera: "相机1 南向",
        status: "人工确认",
        image: "/images/demo.jpg",
      },
      {
        id: 12,
        type: "行人事件",
        time: "2025.06.09--14：15",
        camera: "相机2 南向",
        status: "AI图审",
        image: "/images/demo.jpg",
      },
      {
        id: 13,
        type: "违停事件",
        time: "2025.06.09--14：30",
        camera: "相机3 北向",
        status: "AI图审",
        image: "/images/demo.jpg",
      },
      {
        id: 14,
        type: "抛洒物事件",
        time: "2025.06.09--14：45",
        camera: "相机1 南向",
        status: "人工确认",
        image: "/images/demo.jpg",
      },
      {
        id: 15,
        type: "违停事件",
        time: "2025.06.09--15：00",
        camera: "相机2 南向",
        status: "AI图审",
        image: "/images/demo.jpg",
      },
    ],
    [],
  );

  // 初始加载数据
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 200));

        // 模拟偶发性网络错误（已禁用）
        // if (Math.random() < 0.01) {
        //   throw new Error("网络连接失败，请稍后重试");
        // }

        setEvents(mockEvents.slice(0, 6));
        setHasMore(mockEvents.length > 6);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [mockEvents]);

  // 优化的加载更多函数
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError(null);
    try {
      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 模拟偶发性加载错误（已禁用）
      // if (Math.random() < 0.001) {
      //   throw new Error("加载更多数据失败");
      // }

      const currentLength = events.length;
      const moreEvents = mockEvents.slice(currentLength, currentLength + 6);

      if (moreEvents.length === 0) {
        setHasMore(false);
      } else {
        setEvents((prev) => [...prev, ...moreEvents]);
        setHasMore(currentLength + moreEvents.length < mockEvents.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载更多失败");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, events.length, mockEvents]);

  // 设置滚动监听
  useEffect(() => {
    if (loadingMore || initialLoading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !initialLoading
        ) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      },
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadingMore, hasMore, initialLoading, loadMore]);

  // 简单的错误提示组件
  const ErrorAlert = ({
    message,
    onRetry,
  }: {
    message: string;
    onRetry: () => void;
  }) => (
    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={initialLoading || loadingMore}
          className="border-red-200 text-red-700 hover:bg-red-100"
        >
          重试
        </Button>
      </div>
    </div>
  );

  // 骨架屏组件
  const EventSkeleton = () => (
    <Card className="group relative !p-0">
      <CardContent className="p-0">
        <div className="relative">
          <Skeleton className="h-48 w-full rounded-t-lg" />
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );

  const ListItemSkeleton = () => (
    <Card className="py-0 !gap-0 border-0 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-12 w-16 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32 mb-1" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-16 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 处理单选
  const handleItemSelect = useCallback((id: number, checked: boolean) => {
    setSelectedItems((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
      return newSelected;
    });
  }, []);

  // 处理全选
  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(mockEvents.map((event) => event.id)));
    }
    setSelectAll(!selectAll);
  }, [selectAll, mockEvents]);

  const [isAutoReview, setIsAutoReview] = useState<boolean>(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  // 处理自动审核
  const handleAutoReviewChange = useCallback((checked: boolean) => {
    setIsAutoReview(checked);
    setIsPopoverOpen(false); // 关闭Popover
  }, []);

  // 切换视图模式
  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
  }, []);

  // 处理事件确认
  const handleEventConfirm = useCallback((eventId: number) => {
    // 这里可以添加确认事件的逻辑，比如调用API
    console.log("确认事件:", eventId);
  }, []);

  const showDialogEventDetail = (eventId: number) => {
    // 查看事件详情的逻辑
    const foundEvent = mockEvents.find((event) => event.id === eventId);
    setCurrentEvent(foundEvent || null);
    // setIsPopoverOpen(false); // 关闭Popover
  };

  return (
    <div className="flex h-full">
      <aside className="w-64 lg:w-72 flex-shrink-0 p-4 pr-0 sticky top-0 self-start">
        <div className="h-full overflow-y-auto pr-2">
          {/* 常规筛选 */}
          <div className="space-y-4">
            {/* 方位选择 */}
            <div className="space-y-3">
              <Card className="rounded-md py-3 !gap-0 border-0 shadow-sm">
                <CardContent className="px-3">
                  <label className="text-sm text-muted-foreground">方位:</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="up" />
                      <label htmlFor="up" className="text-sm">
                        上行
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="down" />
                      <label htmlFor="down" className="text-sm">
                        下行
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 相机选择 */}
            <div className="space-y-3">
              <Card className="py-3 !gap-0 border-0 shadow-sm">
                <CardContent className="px-3 leading-0">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">
                      相机:
                    </label>
                    <Select>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="相机1" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camera1">相机1</SelectItem>
                        <SelectItem value="camera2">相机2</SelectItem>
                        <SelectItem value="camera3">相机3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 报警类型 */}
            <div className="space-y-3">
              <Card className="py-3 !gap-0 border-0 shadow-sm">
                <CardContent className="space-y-3 px-3">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    报警类型:
                  </label>
                  <div className="space-y-2">
                    {[
                      "违停事件",
                      "行人事件",
                      "抛洒物事件",
                      "烟火事件",
                      "违规行驶",
                    ].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox id={type} />
                        <label htmlFor={type} className="text-sm">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 时间筛选 */}
            <div className="space-y-4">
              <Card className="py-3 !gap-0 border-0 shadow-sm">
                <CardContent className="px-3 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      开始时间:
                    </label>
                    <DateTimePicker
                      date={startDate}
                      setDate={setStartDate}
                      placeholder="选择开始时间"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      结束时间:
                    </label>
                    <DateTimePicker
                      date={endDate}
                      setDate={setEndDate}
                      placeholder="选择结束时间"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI图审状态 */}
            <div className="space-y-3">
              <Card className="py-3 !gap-0 border-0 shadow-sm">
                <CardContent className="relative px-3">
                  <label className="text-sm text-muted-foreground">
                    AI图审状态:
                  </label>
                  <div className="relative">
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="标记" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marked">已标记</SelectItem>
                        <SelectItem value="unmarked">未标记</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col p-4 relative">
        {/* 顶部控制栏 */}
        <div className="flex items-center justify-between sticky top-0 bg-accent/80 backdrop-blur-md z-10 pb-4 -mx-4 px-4 -mt-4 pt-4">
          <div className="flex items-center gap-4">
            {/* 视图切换 */}
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className="rounded-none border-0"
                onClick={() => handleViewModeChange("grid")}
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                图标
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className="rounded-none border-0 border-l"
                onClick={() => handleViewModeChange("list")}
              >
                <List className="h-4 w-4 mr-1" />
                列表
              </Button>
            </div>

            {/* 全选 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              全选
            </Button>
            {/* 开关 */}
            <div className="flex items-center gap-2">
              {/*<Switch
                checked={isAutoReview}
                onCheckedChange={handleAutoReviewChange}
                className="ml-2"
              />*/}
              {/*<HoverCard openDelay={100} closeDelay={500}>
                <HoverCardTrigger>
                  <Label className="hover:underline underline-offset-3">
                    AI自动图审
                  </Label>
                </HoverCardTrigger>
                <HoverCardContent sideOffset={12}>
                  每一小时自动图审
                </HoverCardContent>
              </HoverCard>*/}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isAutoReview
                              ? "bg-green-500 dark:bg-green-400"
                              : "bg-gray-400 dark:bg-gray-500"
                          } ${
                            isAutoReview
                              ? "animate-pulse"
                              : "animate-pulse opacity-60"
                          }`}
                        />
                        {isAutoReview && (
                          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-ping opacity-75" />
                        )}
                      </div>
                      {/*<Cog className="h-4 w-4" />*/}
                      <span>AI自动图审</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2">
                        <Cog className="h-5 w-5" />
                        <h4 className="leading-none font-medium">设置</h4>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        配置自动图审规则
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="hour">每小时</Label>
                        <Input
                          id="hour"
                          defaultValue="1"
                          className="col-span-2 h-8"
                          type="number"
                          min={0}
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="minute">每分钟</Label>
                        <Input
                          id="minute"
                          defaultValue="30"
                          className="col-span-2 h-8"
                          type="number"
                          min={0}
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="height">秒</Label>
                        <Input
                          id="height"
                          defaultValue="0"
                          className="col-span-2 h-8"
                          type="number"
                          min={0}
                        />
                      </div>
                      <div className="grid grid-cols-2 items-center gap-4 justify-center">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAutoReviewChange(true)}
                        >
                          开启
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAutoReviewChange(false)}
                        >
                          关闭
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="gap-4 flex flex-row">
            <Drawer direction="right">
              <DrawerTrigger asChild>
                <Button variant="default" size="sm">
                  手动上传
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-full h-full flex flex-col">
                  <DrawerHeader>
                    <DrawerTitle>人工图片上传</DrawerTitle>
                    <DrawerDescription>手动上传图片进行识别</DrawerDescription>
                    <DrawerClose asChild className="absolute right-4 top-4">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </DrawerClose>
                  </DrawerHeader>
                  <div className="p-4 pb-0 h-[calc(100%-100px)]">
                    <Uploader></Uploader>
                    {/*<div className="flex items-center justify-center space-x-2"></div>
                    <div className="mt-3 h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart>
                          <Bar
                            dataKey="goal"
                            style={
                              {
                                fill: "hsl(var(--foreground))",
                                opacity: 0.9,
                              } as React.CSSProperties
                            }
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>*/}
                  </div>
                  {/*<DrawerFooter>
                    <Button>Submit</Button>
                    <DrawerClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                  </DrawerFooter>*/}
                </div>
              </DrawerContent>
            </Drawer>

            <Button variant="outline" size="sm">
              开始图审
            </Button>
          </div>
        </div>

        {/* 事件展示区域 */}
        <div className="flex-1 flex flex-col">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isSelected={selectedItems.has(event.id)}
                  viewMode="grid"
                  onSelect={handleItemSelect}
                  onView={showDialogEventDetail}
                  onConfirm={handleEventConfirm}
                />
              ))}

              {/* 初始加载骨架屏 */}
              {initialLoading && events.length === 0 && (
                <>
                  {[...Array(6)].map((_, index) => (
                    <EventSkeleton key={`initial-skeleton-${index}`} />
                  ))}
                </>
              )}

              {/* 加载更多骨架屏 */}
              {loadingMore && (
                <>
                  {[...Array(3)].map((_, index) => (
                    <EventSkeleton key={`more-skeleton-${index}`} />
                  ))}
                </>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="col-span-full">
                  <ErrorAlert
                    message={error}
                    onRetry={() => {
                      if (events.length === 0) {
                        setInitialLoading(true);
                        setError(null);
                        setTimeout(async () => {
                          try {
                            await new Promise((resolve) =>
                              setTimeout(resolve, 2000),
                            );
                            setEvents(mockEvents.slice(0, 6));
                            setHasMore(mockEvents.length > 6);
                          } catch (err) {
                            setError(
                              err instanceof Error ? err.message : "加载失败",
                            );
                          } finally {
                            setInitialLoading(false);
                          }
                        }, 100);
                      }
                    }}
                  />
                </div>
              )}

              {/* 滚动加载触发器 */}
              {hasMore && !error && !initialLoading && (
                <div
                  ref={loadingRef}
                  className="col-span-full flex justify-center py-4"
                >
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>加载更多...</span>
                    </div>
                  )}
                </div>
              )}

              {/* 没有更多数据提示 */}
              {!hasMore && events.length > 0 && !error && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <p>已加载全部数据 ({events.length} 条)</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isSelected={selectedItems.has(event.id)}
                  viewMode="list"
                  onSelect={handleItemSelect}
                  onView={showDialogEventDetail}
                  onConfirm={handleEventConfirm}
                />
              ))}

              {/* 初始加载骨架屏 */}
              {initialLoading && events.length === 0 && (
                <>
                  {[...Array(6)].map((_, index) => (
                    <ListItemSkeleton key={`initial-list-skeleton-${index}`} />
                  ))}
                </>
              )}

              {/* 加载更多骨架屏 */}
              {loadingMore && (
                <>
                  {[...Array(3)].map((_, index) => (
                    <ListItemSkeleton key={`more-list-skeleton-${index}`} />
                  ))}
                </>
              )}

              {/* 错误提示 */}
              {error && (
                <ErrorAlert
                  message={error}
                  onRetry={() => {
                    if (events.length === 0) {
                      setInitialLoading(true);
                      setError(null);
                      setTimeout(async () => {
                        try {
                          await new Promise((resolve) =>
                            setTimeout(resolve, 2000),
                          );
                          setEvents(mockEvents.slice(0, 6));
                          setHasMore(mockEvents.length > 6);
                        } catch (err) {
                          setError(
                            err instanceof Error ? err.message : "加载失败",
                          );
                        } finally {
                          setInitialLoading(false);
                        }
                      }, 100);
                    }
                  }}
                />
              )}

              {/* 滚动加载触发器 */}
              {hasMore && !error && !initialLoading && (
                <div ref={loadingRef} className="flex justify-center py-4">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>加载更多...</span>
                    </div>
                  )}
                </div>
              )}

              {/* 没有更多数据提示 */}
              {!hasMore && events.length > 0 && !error && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>已加载全部数据 ({events.length} 条)</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <EventDetailDialog
        event={currentEvent}
        open={!!currentEvent}
        onClose={() => setCurrentEvent(null)}
      />
    </div>
  );
}

export default Review;
