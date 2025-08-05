import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Bar, BarChart, ResponsiveContainer } from "recharts";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Input } from "@/components/ui/input";

import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  CheckCircle,
  Eye,
  Grid3X3,
  List,
  Check,
  Loader2,
  AlertCircle,
  Cog,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Uploader from "@/pages/apps/review/Uploader";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function Review() {
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

  // 模拟事件数据
  const mockEvents = useMemo(
    () => [
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

  // 设置滚动监听
  useEffect(() => {
    if (loadingMore || initialLoading) return;

    if (observerRef.current) observerRef.current.disconnect();

    const loadMore = async () => {
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
    };

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
  }, [loadingMore, hasMore, initialLoading, events.length, mockEvents]);

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
  const handleItemSelect = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  // 处理全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(mockEvents.map((event) => event.id)));
    }
    setSelectAll(!selectAll);
  };

  const [isAutoReview, setIsAutoReview] = useState<boolean>(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  // 处理自动审核
  const handleAutoReviewChange = (checked: boolean) => {
    setIsAutoReview(checked);
    setIsPopoverOpen(false); // 关闭Popover
  };

  // 切换视图模式
  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="!py-0 !px-0 !gap-0 overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-200"
                >
                  <CardContent className="p-0">
                    {/* 图片区域 */}
                    <div className="relative overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.type}
                        className="w-full h-40 object-cover"
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        }}
                      />
                      {/* 选择框 */}
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          checked={selectedItems.has(event.id)}
                          onCheckedChange={(checked) =>
                            handleItemSelect(event.id, checked as boolean)
                          }
                        />
                      </div>
                      {/* 右上角状态标签 */}
                      <div className="absolute top-2 right-2">
                        {event.status === "人工确认" ? (
                          <Badge className="bg-green-500/90 backdrop-blur text-white px-2 py-0.5 text-xs">
                            {event.status}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500/90 backdrop-blur text-white px-2 py-0.5 text-xs">
                            {event.status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 信息区域 */}
                    <div className="p-3">
                      <div className="mb-2">
                        <h4 className="font-medium text-foreground text-sm">
                          {event.type}
                        </h4>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>{event.camera}</span>
                        </div>
                      </div>

                      {/* 底部操作按钮 */}
                      <div className="flex gap-1 mt-3 pt-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          查看
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          确认
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                <Card
                  key={event.id}
                  className="py-0 !gap-0 border-0 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedItems.has(event.id)}
                        onCheckedChange={(checked) =>
                          handleItemSelect(event.id, checked as boolean)
                        }
                      />
                      <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={event.image}
                          alt={event.type}
                          className="w-full h-full object-cover"
                          style={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.type}</h4>
                        <p className="text-xs text-muted-foreground">
                          {event.time}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.camera}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
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
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
    </div>
  );
}

export default Review;
