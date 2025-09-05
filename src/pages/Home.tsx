import { useState } from "react";
import {
  TrendingUp,
  Calendar,
  Activity,
  BarChart3,
  AlertCircle,
  RefreshCw,
  XCircle,
  ArrowUp,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

// 模拟数据
const eventCategoryData = [
  { name: "违停事件", value: 52, fill: "#00D4AA" },
  { name: "行人事件", value: 52, fill: "#8B5CF6" },
  { name: "抛洒物事件", value: 52, fill: "#F59E0B" },
  { name: "烟火事件", value: 52, fill: "#EF4444" },
  { name: "违规行驶", value: 52, fill: "#06B6D4" },
  { name: "拥堵事件", value: 18, fill: "#6B7280" },
];

const secondaryAuditData = [
  { name: "违停", value1: 10, value2: 12 },
  { name: "行人事件", value1: 5, value2: 8 },
  { name: "抛洒物事件", value1: 12, value2: 10 },
  { name: "烟火事件", value1: 11, value2: 13 },
  { name: "违规行驶", value1: 11, value2: 12 },
  { name: "拥堵事件", value1: 10, value2: 11 },
  { name: "其他事件", value1: 10, value2: 9 },
];

const historicalData = [
  { date: "03-11", value: 35 },
  { date: "03-12", value: 28 },
  { date: "03-13", value: 42 },
  { date: "03-14", value: 78 },
  { date: "03-15", value: 45 },
  { date: "03-16", value: 22 },
  { date: "03-17", value: 18 },
];

// 图表配置
const pieChartConfig = {
  违停事件: { label: "违停事件", color: "#00D4AA" },
  行人事件: { label: "行人事件", color: "#8B5CF6" },
  抛洒物事件: { label: "抛洒物事件", color: "#F59E0B" },
  烟火事件: { label: "烟火事件", color: "#EF4444" },
  违规行驶: { label: "违规行驶", color: "#06B6D4" },
  拥堵事件: { label: "拥堵事件", color: "#6B7280" },
};

const barChartConfig = {
  value1: { label: "一次审查", color: "#3b82f6" },
  value2: { label: "二次审查", color: "#64748b" },
};

const areaChartConfig = {
  value: { label: "事件数量", color: "#3b82f6" },
};

function Home() {
  const [timeRange, setTimeRange] = useState("today");

  return (
    <div className="p-6 min-h-full">
      {/* 事件概况 */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-1.5 h-6 bg-primary mr-3 rounded-full"></div>
            <h2 className="text-xl font-semibold text-foreground">事件概况</h2>
          </div>
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="today">今日</TabsTrigger>
              <TabsTrigger value="week">本周</TabsTrigger>
              <TabsTrigger value="month">本月</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* 今日事件 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-blue-500" />
                  今日事件
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-3xl font-bold">80</CardTitle>
            </CardContent>
          </Card>

          {/* 历史总事件 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-purple-500" />
                  历史总事件
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-3xl font-bold">1010</CardTitle>
            </CardContent>
          </Card>

          {/* 累计图审 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                  累计图审
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-3xl font-bold">88</CardTitle>
            </CardContent>
          </Card>

          {/* 重复事件 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 text-cyan-500" />
                  重复事件
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-3xl font-bold">1000</CardTitle>
            </CardContent>
          </Card>

          {/* 误报事件 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="flex items-center">
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  误报事件
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-3xl font-bold">100</CardTitle>
            </CardContent>
          </Card>

          {/* 提升度 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="flex items-center">
                  <ArrowUp className="h-4 w-4 mr-2 text-green-500" />
                  提升度
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-3xl font-bold text-green-600">
                12%
              </CardTitle>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 下半部分：统计图表 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* 左侧：事件占比统计 */}
        <div className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
            <div className="flex items-center">
              <div className="w-1.5 h-8 bg-[#3b82f6] mr-4 rounded-full"></div>
              <h3 className="text-lg font-semibold text-foreground">
                事件占比统计
              </h3>
            </div>
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList className="bg-muted border border-border">
                <TabsTrigger
                  value="today"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-1.5 text-sm"
                >
                  今日
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-1.5 text-sm"
                >
                  本周
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-1.5 text-sm"
                >
                  本月
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1 relative">
                <ChartContainer
                  config={pieChartConfig}
                  className="h-[280px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={eventCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      dataKey="value"
                      startAngle={90}
                      endAngle={450}
                    >
                      {eventCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <text
                      x="50%"
                      y="45%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-muted-foreground text-base font-medium"
                    >
                      事件总计
                    </text>
                    <text
                      x="50%"
                      y="55%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground text-2xl font-bold"
                    >
                      80
                    </text>
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="w-40 ml-6">
                <div className="space-y-3">
                  {eventCategoryData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.fill }}
                        ></div>
                        <span className="text-foreground text-sm">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：二次图审对比 */}
        <div className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              二次图审对比
            </h3>
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList className="bg-muted border border-border">
                <TabsTrigger
                  value="today"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-1.5 text-sm"
                >
                  今日
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-1.5 text-sm"
                >
                  本周
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-1.5 text-sm"
                >
                  本月
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="p-6">
            <ChartContainer
              config={barChartConfig}
              className="h-[280px] w-full"
            >
              <BarChart data={secondaryAuditData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value1"
                  fill="var(--color-value1)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="value2"
                  fill="var(--color-value2)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>

      {/* 底部：事件准确率和历史曲线 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 事件准确率 */}
        <div className="bg-card rounded-xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="mb-6">
            <span className="text-sm text-muted-foreground">事件准确率：</span>
            <span className="text-sm text-red-500 font-medium ml-2">
              计算方法=（误报+重复）/总事件
            </span>
          </div>
          <div className="text-5xl font-bold text-foreground mb-4">50%</div>
          <div className="flex items-center">
            <span className="text-muted-foreground mr-2">周同比</span>
            <TrendingUp className="w-4 h-4 text-[#10b981] mr-1" />
            <span className="text-[#10b981] font-medium">12%</span>
          </div>
        </div>

        {/* 历史曲线 */}
        <div className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">历史曲线</h3>
            <div className="flex items-center space-x-2">
              <Tabs defaultValue="week">
                <TabsList className="bg-muted border border-border">
                  <TabsTrigger
                    value="week"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-1.5 text-sm"
                  >
                    本周
                  </TabsTrigger>
                  <TabsTrigger
                    value="month"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-1.5 text-sm"
                  >
                    本月
                  </TabsTrigger>
                  <TabsTrigger
                    value="year"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-1.5 text-sm"
                  >
                    全年
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-sm text-muted-foreground border border-border">
                <Calendar className="w-4 h-4 mr-2" />
                2024-03-11 ~ 2024-03-17
              </div>
            </div>
          </div>
          <div className="p-6">
            <ChartContainer
              config={areaChartConfig}
              className="h-[240px] w-full"
            >
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-value)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-value)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  fill="url(#colorArea)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
