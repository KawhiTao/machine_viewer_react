import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/home");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex items-center justify-center p-4 min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* 404 大数字 */}
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-primary">404</h1>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
            </div>

            {/* 错误信息 */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                页面未找到
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                抱歉，您访问的页面不存在或已被移动。
                <br />
                请检查网址是否正确，或返回首页继续浏览。
              </p>
            </div>

            <Separator />

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleGoHome} className="flex-1 sm:flex-none">
                返回首页
              </Button>
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="flex-1 sm:flex-none"
              >
                返回上页
              </Button>
            </div>

            {/* 额外信息 */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                如果问题持续存在，请联系系统管理员
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotFound;
