export default function Auto() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">自动检测</h1>
        <p className="text-muted-foreground">
          智能自动检测系统，用于实时监控和分析图像内容
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">检测状态</h3>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">运行中</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">检测精度</h3>
          <div className="text-2xl font-bold text-primary">95.2%</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">处理速度</h3>
          <div className="text-2xl font-bold text-primary">120fps</div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">最近检测结果</h2>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-center py-8">
            暂无检测数据
          </p>
        </div>
      </div>
    </div>
  );
}
