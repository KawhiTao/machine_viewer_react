import { useState } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

// 模拟数据
const eventCategoryData = [
  { name: "违停事件", value: 52, color: "#00D4AA" },
  { name: "行人事件", value: 52, color: "#8B5CF6" },
  { name: "抛洒物事件", value: 52, color: "#F59E0B" },
  { name: "烟火事件", value: 52, color: "#EF4444" },
  { name: "违规行驶", value: 52, color: "#06B6D4" },
  { name: "拥堵事件", value: 18, color: "#6B7280" },
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

function Home() {
  const [timeRange, setTimeRange] = useState("today");

  return (
    <div className="p-6 min-h-full">
      {/* 事件概况 */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-1.5 h-6 bg-[#3b82f6] mr-3 rounded-full"></div>
            <h2 className="text-xl font-semibold text-foreground">事件概况</h2>
          </div>
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList className="bg-muted border border-border">
              <TabsTrigger
                value="today"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2"
              >
                今日
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2"
              >
                本周
              </TabsTrigger>
              <TabsTrigger
                value="month"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2"
              >
                本月
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-8">
          {/* 今日事件 */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-muted-foreground rounded-full mr-3"></div>
              <span className="text-sm text-muted-foreground">今日事件</span>
            </div>
            <div className="text-3xl font-bold text-foreground">80</div>
          </div>

          {/* 历史总事件 */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-muted-foreground rounded-full mr-3"></div>
              <span className="text-sm text-muted-foreground">历史总事件</span>
            </div>
            <div className="text-3xl font-bold text-foreground">1010</div>
          </div>

          {/* 累计图审 */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-muted-foreground rounded-full mr-3"></div>
              <span className="text-sm text-muted-foreground">累计图审</span>
            </div>
            <div className="text-3xl font-bold text-foreground">88</div>
          </div>

          {/* 重复事件 */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-muted-foreground rounded-full mr-3"></div>
              <span className="text-sm text-muted-foreground">重复事件</span>
            </div>
            <div className="text-3xl font-bold text-foreground">1000</div>
          </div>

          {/* 误报事件 */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
              <span className="text-sm text-muted-foreground">误报事件</span>
            </div>
            <div className="text-3xl font-bold text-foreground">100</div>
          </div>

          {/* 提升度 */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <span className="text-sm text-muted-foreground">提升度</span>
            </div>
            <div className="text-3xl font-bold text-[#10b981]">12%</div>
          </div>
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
                <ResponsiveContainer width="100%" height={280}>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
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
                </ResponsiveContainer>
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
                          style={{ backgroundColor: item.color }}
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={secondaryAuditData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="value1" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="value2" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    // backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
