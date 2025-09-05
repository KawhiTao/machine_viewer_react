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
import { useState, useEffect, useRef, useCallback } from "react";
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
// import axios from "axios";
import { get } from "@/utils/request";
import { API_ENDPOINTS, API_CONFIG } from "@/config/api";
import { motion, AnimatePresence } from "motion/react";

// 定义API返回的事件数据接口
interface ApiEvent {
  id: number;
  eventType: string;
  eventTime: number;
  milestone: string;
  extra?: string;
  source: string;
  photos?: Array<{ url: string }>;
  sourceRepr: string;
}

// 定义API响应接口
interface ApiResponse<T = unknown> {
  data: {
    records: T[];
    total: number;
    pages: number;
    current: number;
  };
  code: number;
  message: string;
  success: boolean;
}

// 将API返回的事件数据转换为组件需要的Event类型
const mapApiEventToComponentEvent = (apiEvent: ApiEvent): Event => {
  return {
    id: apiEvent.id,
    type: apiEvent.eventType,
    time: formatEventTime(apiEvent.eventTime.toString()), // 转换为字符串进行格式化
    camera: `${apiEvent.milestone} ${apiEvent.extra || ""}`,
    status: apiEvent.sourceRepr,
    image:
      apiEvent.photos && apiEvent.photos.length > 0
        ? `${API_CONFIG.BASE_URL}/${apiEvent.photos[0].url}`
        : "/images/demo.jpg", // 默认图片
  };
};

// 格式化时间为"YYYY.MM.DD HH:MM"格式
const formatEventTime = (timeString: string): string => {
  const date = new Date(timeString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

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
  const [events, setEvents] = useState<Event[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  // 返回顶部相关状态
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // API请求相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [direction, setDirection] = useState<string[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

  // 返回顶部函数
  const scrollToTop = useCallback(() => {
    try {
      // 优先使用现代API
      if ("scrollTo" in window) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        // 降级处理
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    } catch (error) {
      console.warn("滚动到顶部失败:", error);
      // 最后的降级处理
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  // 将API响应数据转换为Event类型
  const processApiResponse = (apiResponse: unknown): Event[] => {
    const response = apiResponse as ApiResponse<ApiEvent>;
    if (response && response.data && Array.isArray(response.data.records)) {
      return response.data.records.map(mapApiEventToComponentEvent);
    }
    return [];
  };

  // 初始加载数据
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        // 构建查询参数
        const params: Record<
          string,
          string | number | boolean | null | undefined
        > = {
          current: currentPage,
          size: pageSize,
        };

        // 添加事件类型过滤
        if (selectedEventTypes.length > 0) {
          params.eventType = selectedEventTypes[0]; // API可能只支持单个类型过滤
        }

        // 添加来源过滤
        if (sourceFilter) {
          params.source = sourceFilter;
        }

        // 添加时间过滤
        if (startDate) {
          params.startTime = Math.floor(startDate.getTime() / 1000);
        }

        if (endDate) {
          params.endTime = Math.floor(endDate.getTime() / 1000);
        }

        // 调用API
        const response = await get(API_ENDPOINTS.EVENTS.LIST, params);

        // 处理响应数据
        const typedResponse = response as ApiResponse<ApiEvent>;
        const eventData = processApiResponse(typedResponse);
        setEvents(eventData);

        // 更新分页信息
        setHasMore(typedResponse.data.current < typedResponse.data.pages);
        console.log(
          `初始加载完成，当前页: ${typedResponse.data.current}/${typedResponse.data.pages}，数据数量: ${eventData.length}`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [
    currentPage,
    pageSize,
    selectedEventTypes,
    sourceFilter,
    startDate,
    endDate,
  ]);

  // 加载更多数据
  // 当前是否正在进行API请求的标志
  const isRequestingRef = useRef(false);

  const loadMore = useCallback(async () => {
    // 只有在加载中才跳过，允许尝试加载下一页
    if (loadingMore || isRequestingRef.current) return;

    // 延迟设置加载状态，减少闪烁
    const loadingTimer = setTimeout(() => setLoadingMore(true), 200);
    let hasNewData = false; // 标记是否获取到了新数据
    setError(null);
    isRequestingRef.current = true;
    try {
      // 构建查询参数，页码+1
      const nextPage = currentPage + 1;
      const params: Record<
        string,
        string | number | boolean | null | undefined
      > = {
        current: nextPage,
        size: pageSize,
      };

      // 添加事件类型过滤
      if (selectedEventTypes.length > 0) {
        params.eventType = selectedEventTypes[0]; // API可能只支持单个类型过滤
      }

      // 添加来源过滤
      if (sourceFilter) {
        params.source = sourceFilter;
      }

      // 添加时间过滤
      if (startDate) {
        params.startTime = Math.floor(startDate.getTime() / 1000);
      }

      if (endDate) {
        params.endTime = Math.floor(endDate.getTime() / 1000);
      }

      // 调用API
      const response = await get(API_ENDPOINTS.EVENTS.LIST, params);

      // 处理响应数据
      const typedResponse = response as ApiResponse<ApiEvent>;
      const moreEvents = processApiResponse(typedResponse);

      console.log(`加载第${nextPage}页数据: ${moreEvents.length}条`);

      // 清除之前可能设置的loadingTimer
      clearTimeout(loadingTimer);

      if (moreEvents.length > 0) {
        setEvents((prev) => [...prev, ...moreEvents]);
        setCurrentPage(nextPage);
        hasNewData = true;
      }

      // 判断是否还有更多数据
      if (
        !typedResponse.data?.records ||
        moreEvents.length < pageSize ||
        typedResponse.data.current >= typedResponse.data.pages
      ) {
        setHasMore(false);
        console.log("没有更多数据了");
      }
    } catch (err) {
      console.error("加载更多数据失败:", err);
      setError(err instanceof Error ? err.message : "加载更多失败");
      setHasMore(false); // 请求失败也设为没有更多数据
    } finally {
      // 如果有数据返回时才使用延迟清除加载状态
      if (hasNewData) {
        setTimeout(() => {
          setLoadingMore(false);
          isRequestingRef.current = false;
          console.log(
            "加载状态已清除，isRequestingRef:",
            isRequestingRef.current,
          );
        }, 100);
      }
    }
  }, [
    loadingMore,
    currentPage,
    pageSize,
    selectedEventTypes,
    sourceFilter,
    startDate,
    endDate,
  ]);

  // 防止频繁触发的时间戳
  const lastLoadTimeRef = useRef<number>(0);

  // 设置滚动监听
  useEffect(() => {
    if (initialLoading) return; // 只在初始加载时不设置监听

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 如果底部元素可见且没在加载中，就触发加载下一页
        if (entries[0].isIntersecting && !loadingMore) {
          // 简单的时间节流，防止频繁触发
          const now = Date.now();
          if (now - lastLoadTimeRef.current < 800) return; // 增大间隔，减少频繁加载

          console.log("检测到底部元素可见，尝试加载下一页");
          lastLoadTimeRef.current = now;
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "150px", // 预加载距离
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

  // 监听滚动位置，控制返回顶部按钮显示
  useEffect(() => {
    let ticking = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const getScrollTop = (): number => {
      try {
        return Math.max(
          window.scrollY || 0,
          window.pageYOffset || 0,
          document.documentElement.scrollTop || 0,
          document.body.scrollTop || 0,
        );
      } catch (error) {
        console.warn("获取滚动位置失败:", error);
        return 0;
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = getScrollTop();
          const shouldShow = scrollTop > 300;
          setShowScrollToTop(shouldShow);
          ticking = false;
        });
        ticking = true;
      }
    };

    // 备用检测机制，定期检查滚动位置
    const fallbackCheck = () => {
      const scrollTop = getScrollTop();
      const shouldShow = scrollTop > 300;
      setShowScrollToTop(shouldShow);
    };

    // 初始检查
    handleScroll();

    // 主要滚动事件监听器
    const scrollOptions = { passive: true, capture: false };
    try {
      window.addEventListener("scroll", handleScroll, scrollOptions);
      document.addEventListener("scroll", handleScroll, scrollOptions);
    } catch (error) {
      console.warn("添加滚动事件监听器失败:", error);
    }

    // 备用定时检查（每500ms检查一次）
    timeoutId = setInterval(fallbackCheck, 500);

    return () => {
      try {
        window.removeEventListener("scroll", handleScroll, scrollOptions);
        document.removeEventListener("scroll", handleScroll, scrollOptions);
      } catch (error) {
        console.warn("移除滚动事件监听器失败:", error);
      }

      if (timeoutId) {
        clearInterval(timeoutId);
      }
    };
  }, []);

  // 方向筛选处理
  const handleDirectionChange = (directionName: string, checked: boolean) => {
    setDirection((prev) => {
      if (checked) {
        return [...prev, directionName];
      } else {
        return prev.filter((d) => d !== directionName);
      }
    });

    // 重置并触发新查询
    setCurrentPage(1);
    setEvents([]);
  };

  // 相机选择处理
  const handleCameraChange = (camera: string) => {
    setSelectedCamera(camera);
    setCurrentPage(1);
    setEvents([]);
  };

  // 事件类型选择处理
  const handleEventTypeChange = (type: string, checked: boolean) => {
    setSelectedEventTypes((prev) => {
      if (checked) {
        return [...prev, type];
      } else {
        return prev.filter((t) => t !== type);
      }
    });

    setCurrentPage(1);
    setEvents([]);
  };

  // 日期范围变更
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setCurrentPage(1);
    setEvents([]);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    setCurrentPage(1);
    setEvents([]);
  };

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
      setSelectedItems(new Set(events.map((event) => event.id)));
    }
    setSelectAll(!selectAll);
  }, [selectAll, events]);

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
    const foundEvent = events.find((event) => event.id === eventId);
    setCurrentEvent(foundEvent || null);
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
                      <Checkbox
                        id="up"
                        checked={direction.includes("上行")}
                        onCheckedChange={(checked) =>
                          handleDirectionChange("上行", checked as boolean)
                        }
                      />
                      <label htmlFor="up" className="text-sm">
                        上行
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="down"
                        checked={direction.includes("下行")}
                        onCheckedChange={(checked) =>
                          handleDirectionChange("下行", checked as boolean)
                        }
                      />
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
                    <Select
                      onValueChange={handleCameraChange}
                      value={selectedCamera || undefined}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="选择相机" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S12K42+270">S12K42+270</SelectItem>
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
                    {["逆行", "抛洒物", "非法车辆"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={selectedEventTypes.includes(type)}
                          onCheckedChange={(checked) =>
                            handleEventTypeChange(type, checked as boolean)
                          }
                        />
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
                      setDate={handleStartDateChange}
                      placeholder="选择开始时间"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      结束时间:
                    </label>
                    <DateTimePicker
                      date={endDate}
                      setDate={handleEndDateChange}
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
                    <Select
                      onValueChange={(value) =>
                        setSourceFilter(value === "marked" ? "auto" : "manual")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="标记" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marked">AI标记</SelectItem>
                        <SelectItem value="unmarked">人工标记</SelectItem>
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
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

            <Button variant="outline" size="sm">
              开始图审
            </Button>
          </div>
        </div>

        {/* 事件展示区域 */}
        <div className="flex-1 flex flex-col relative">
          {viewMode === "grid" ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4 relative"
              style={{ isolation: "isolate" }}
            >
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
                        setCurrentPage(1);
                        setInitialLoading(true);
                        setError(null);
                      }
                    }}
                  />
                </div>
              )}

              {/* 滚动加载触发器 */}
              <div
                ref={loadingRef}
                className="col-span-full flex justify-center py-4"
                style={{ minHeight: "50px", transition: "all 0.3s ease" }}
                data-loading={loadingMore ? "true" : "false"}
              >
                {loadingMore && !isRequestingRef.current && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>加载更多...</span>
                  </div>
                )}

                {!loadingMore && !hasMore && events.length > 0 && !error && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>已加载全部数据 ({events.length} 条)</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="space-y-4 relative"
              style={{ isolation: "isolate" }}
            >
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
                      setCurrentPage(1);
                      setInitialLoading(true);
                      setError(null);
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

      {/* 返回顶部按钮 */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              duration: 0.3,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-8 right-8 z-[9999]"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToTop}
              className="group h-14 w-14 p-0 rounded-full bg-primary/90 text-primary-foreground border-primary/20 hover:bg-primary hover:border-primary/40 transition-all duration-300 shadow-2xl hover:shadow-3xl backdrop-blur-md"
              title="返回顶部"
            >
              <svg
                className="w-6 h-6 transition-transform duration-300 group-hover:-translate-y-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <EventDetailDialog
        event={currentEvent}
        open={!!currentEvent}
        onClose={() => setCurrentEvent(null)}
      />
    </div>
  );
}

export default Review;
