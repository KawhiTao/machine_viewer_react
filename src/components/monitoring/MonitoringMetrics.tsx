import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonitoringMetricsProps {
  className?: string;
}

interface MetricsData {
  totalReviewed: number;
  correctCount: number;
  accuracyRate: number;
  lastUpdated: Date;
}

export default function MonitoringMetrics({
  className,
}: MonitoringMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalReviewed: 0,
    correctCount: 0,
    accuracyRate: 0,
    lastUpdated: new Date(),
  });

  // 模拟实时数据更新
  useEffect(() => {
    const fetchMetrics = () => {
      // 这里应该从实际的API获取数据
      // 目前使用模拟数据
      const totalReviewed = Math.floor(Math.random() * 1000) + 500;
      const correctCount = Math.floor(
        totalReviewed * (0.85 + Math.random() * 0.1),
      );
      const accuracyRate =
        totalReviewed > 0 ? (correctCount / totalReviewed) * 100 : 0;

      setMetrics({
        totalReviewed,
        correctCount,
        accuracyRate,
        lastUpdated: new Date(),
      });
    };

    // 初始加载
    fetchMetrics();

    // 每30秒更新一次
    const interval = setInterval(fetchMetrics, 1000);

    return () => clearInterval(interval);
  }, []);

  const getAccuracyColor = (rate: number) => {
    if (rate >= 95) return "text-green-600 dark:text-green-400";
    if (rate >= 90) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAccuracyBadgeVariant = (rate: number) => {
    if (rate >= 95) return "default";
    if (rate >= 90) return "secondary";
    return "destructive";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="p-0" asChild>
          <Card
            className={cn(
              "border-none shadow-none cursor-pointer hover:bg-accent/50 transition-colors",
              className,
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-center space-x-4">
                {/* 图审总数 */}
                <div className="flex items-center space-x-2 min-w-[80px]">
                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      图审总数
                    </span>
                    <span className="text-sm font-medium font-mono min-w-[48px] text-right">
                      {metrics.totalReviewed.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 分隔线 */}
                <div className="h-6 w-px bg-border flex-shrink-0" />

                {/* 正确数量 */}
                <div className="flex items-center space-x-2 min-w-[80px]">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      正确数量
                    </span>
                    <span className="text-sm font-medium font-mono min-w-[48px] text-right">
                      {metrics.correctCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 分隔线 */}
                <div className="h-6 w-px bg-border flex-shrink-0" />

                {/* 正确率 */}
                <div className="flex items-center space-x-2 min-w-[80px]">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      准确率
                    </span>
                    <div className="flex items-center space-x-1">
                      <span
                        className={cn(
                          "text-sm font-medium font-mono min-w-[42px] text-right",
                          getAccuracyColor(metrics.accuracyRate),
                        )}
                      >
                        {metrics.accuracyRate.toFixed(1)}%
                      </span>
                      {/*<Badge
                        variant={getAccuracyBadgeVariant(metrics.accuracyRate)}
                        className="text-xs px-1.5 py-0.5 h-auto w-[60px] justify-center flex-shrink-0"
                      >
                        {metrics.accuracyRate >= 95
                          ? "优　秀"
                          : metrics.accuracyRate >= 90
                            ? "良　好"
                            : "待改进"}
                      </Badge>*/}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>

        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium text-sm">实时监控指标</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">总审核数:</span>
                <span className="font-mono text-right min-w-[60px]">
                  {metrics.totalReviewed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">正确数量:</span>
                <span className="text-green-600 dark:text-green-400 font-mono text-right min-w-[60px]">
                  {metrics.correctCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">错误数量:</span>
                <span className="text-red-600 dark:text-red-400 font-mono text-right min-w-[60px]">
                  {(
                    metrics.totalReviewed - metrics.correctCount
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">准确率:</span>
                <span
                  className={cn(
                    "font-mono text-right min-w-[50px]",
                    getAccuracyColor(metrics.accuracyRate),
                  )}
                >
                  {metrics.accuracyRate.toFixed(2)}%
                </span>
              </div>
              <div className="pt-1 border-t border-border">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    更新时间: {metrics.lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
