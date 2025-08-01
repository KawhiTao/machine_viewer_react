import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Wrench,
  HardHat,
  Settings,
  BarChart3,
  Camera,
  Shield,
  AlertTriangle,
  Search,
  Star,
  Download,
  Users,
} from "lucide-react";

interface AppTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  buttonText: string;
  buttonVariant?:
    | "default"
    | "secondary"
    | "outline"
    | "destructive"
    | "ghost"
    | "link";
  rating?: number;
  downloads?: number;
  isPopular?: boolean;
  tags?: string[];
}

interface AppCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  templates: AppTemplate[];
}

const appData: AppCategory[] = [
  {
    id: "all",
    title: "全部",
    icon: <BarChart3 className="h-5 w-5" />,
    templates: [
      {
        id: "traffic-video",
        title: "交通视频图审",
        description:
          "交通监控智能分析，对违章违停操作、行人推车、障碍物等异常，交通视频智能分析识别，违章违停智能分析。",
        icon: <Camera className="h-8 w-8" />,
        category: "traffic",
        buttonText: "预览分析",
        buttonVariant: "outline",
        rating: 4.8,
        downloads: 2358,
        isPopular: true,
        tags: ["AI识别", "视频分析", "交通监控"],
      },
      {
        id: "patrol-maintenance",
        title: "巡检养护",
        description:
          "对道路设施巡检、道路巡检数据检测、标准标识化、智能识别计算，交通系统智能分析识别，违章违停智能分析。",
        icon: <Shield className="h-8 w-8" />,
        category: "maintenance",
        buttonText: "选择智能",
        buttonVariant: "default",
        rating: 4.6,
        downloads: 1842,
        isPopular: false,
        tags: ["道路巡检", "智能识别", "设施管理"],
      },
      {
        id: "construction-warning",
        title: "施工预警",
        description:
          "施工区域智能监控预警系统，实时监测施工现场安全状况，智能识别违规操作，提供及时预警提醒。",
        icon: <AlertTriangle className="h-8 w-8" />,
        category: "construction",
        buttonText: "预览智能",
        buttonVariant: "secondary",
        rating: 4.4,
        downloads: 956,
        isPopular: false,
        tags: ["施工监控", "安全预警", "智能检测"],
      },
    ],
  },
  {
    id: "vehicle",
    title: "行车管理",
    icon: <Car className="h-5 w-5" />,
    templates: [
      {
        id: "traffic-video",
        title: "交通视频图审",
        description:
          "交通监控智能分析，对违章违停操作、行人推车、障碍物等异常，交通视频智能分析识别，违章违停智能分析。",
        icon: <Camera className="h-8 w-8" />,
        category: "traffic",
        buttonText: "预览分析",
        buttonVariant: "outline",
        rating: 4.8,
        downloads: 2358,
        isPopular: true,
        tags: ["AI识别", "视频分析", "交通监控"],
      },
    ],
  },
  {
    id: "maintenance",
    title: "养护管理",
    icon: <Wrench className="h-5 w-5" />,
    templates: [
      {
        id: "patrol-maintenance",
        title: "巡检养护",
        description:
          "对道路设施巡检、道路巡检数据检测、标准标识化、智能识别计算，交通系统智能分析识别，违章违停智能分析。",
        icon: <Shield className="h-8 w-8" />,
        category: "maintenance",
        buttonText: "选择智能",
        buttonVariant: "default",
        rating: 4.6,
        downloads: 1842,
        isPopular: false,
        tags: ["道路巡检", "智能识别", "设施管理"],
      },
    ],
  },
  {
    id: "construction",
    title: "施工管理",
    icon: <HardHat className="h-5 w-5" />,
    templates: [
      {
        id: "construction-warning",
        title: "施工预警",
        description:
          "施工区域智能监控预警系统，实时监测施工现场安全状况，智能识别违规操作，提供及时预警提醒。",
        icon: <AlertTriangle className="h-8 w-8" />,
        category: "construction",
        buttonText: "预览智能",
        buttonVariant: "secondary",
        rating: 4.4,
        downloads: 956,
        isPopular: false,
        tags: ["施工监控", "安全预警", "智能检测"],
      },
    ],
  },
];

export default function AppMarket() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleTemplateClick = (templateId: string) => {
    console.log(`点击应用模板: ${templateId}`);
    // 根据模板ID导航到相应页面
    switch (templateId) {
      case "traffic-video":
        navigate("/apps/preview");
        break;
      case "patrol-maintenance":
        navigate("/apps/inspection");
        break;
      case "construction-warning":
        navigate("/apps/warning");
        break;
      default:
        console.log(`未找到对应的页面: ${templateId}`);
    }
  };

  const handlePreviewClick = (templateId: string) => {
    console.log(`预览应用: ${templateId}`);
    // 这里可以添加预览应用的逻辑，比如打开模态窗口或者预览页面
  };

  const currentCategory = appData.find((cat) => cat.id === selectedCategory);

  // 过滤搜索结果
  const filteredTemplates =
    currentCategory?.templates.filter(
      (template) =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        template.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    ) || [];

  // 渲染星级评分
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-3 w-3 ${
          index < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="mx-auto px-6 py-8 space-y-8">
      {/* 页面标题和搜索 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            应用广场
          </h1>
          <p className="text-muted-foreground">
            发现和使用各种智能应用模板，提升工作效率
          </p>
        </div>

        {/* 搜索框 */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索应用模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 应用合集选项卡 */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">应用合集</h2>

          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 lg:w-fit gap-2">
              {appData.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center space-x-2"
                >
                  {category.icon}
                  <span>{category.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* 应用模板 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">应用模板</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border border-border/50 hover:border-primary/20 relative"
                onClick={() => handleTemplateClick(template.id)}
              >
                {template.isPopular && (
                  <Badge className="absolute top-3 right-3 bg-orange-500 text-white text-xs">
                    热门
                  </Badge>
                )}

                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-medium">
                          {template.title}
                        </CardTitle>
                        {template.rating && (
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="flex">
                              {renderStars(template.rating)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {template.rating}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {template.description}
                  </CardDescription>

                  {/* 标签 */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 统计信息 */}
                  {template.downloads && (
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Download className="h-3 w-3" />
                        <span>{template.downloads.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>在线使用</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      智能分析
                    </Badge>

                    <Button
                      variant={template.buttonVariant || "default"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewClick(template.id);
                      }}
                      className="text-xs"
                    >
                      {template.buttonText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 空状态 */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-muted-foreground/50">
                <Settings className="h-full w-full" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">
                {searchQuery ? "未找到匹配的应用" : "暂无应用模板"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? `没有找到包含"${searchQuery}"的应用模板，请尝试其他关键词`
                  : "该分类下暂时没有可用的应用模板"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
