import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { getRoutePathTitleMap, getAllRoutePaths } from "@/config/routes";

export default function Bread() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const routeConfig = getRoutePathTitleMap();
  const validPaths = getAllRoutePaths();

  // 检查当前路径是否为有效路由
  const isValidRoute =
    validPaths.includes(location.pathname) || location.pathname === "/";

  // 生成面包屑项
  const breadcrumbItems = [];

  // 如果是404页面或者无效路由，显示首页和页面未找到
  if (!isValidRoute && location.pathname !== "/") {
    breadcrumbItems.push({
      title: "首页",
      href: "/home",
      isCurrentPage: false,
      isClickable: true,
    });
    breadcrumbItems.push({
      title: "页面未找到",
      href: "#",
      isCurrentPage: true,
      isClickable: false,
    });
  } else {
    // 添加首页
    if (pathnames.length > 0) {
      breadcrumbItems.push({
        title: "首页",
        href: "/home",
        isCurrentPage: false,
        isClickable: true,
      });
    }

    // 添加路径中的各级页面
    let currentPath = "";
    pathnames.forEach((pathname, index) => {
      currentPath += `/${pathname}`;
      const isLast = index === pathnames.length - 1;

      // 检查当前构建的路径是否为有效路由
      const isValidPath = validPaths.includes(currentPath);
      const title =
        routeConfig[currentPath] ||
        pathname.charAt(0).toUpperCase() + pathname.slice(1);

      breadcrumbItems.push({
        title,
        href: isValidPath ? currentPath : "#",
        isCurrentPage: isLast,
        isClickable: !isLast && isValidPath,
      });
    });
  }

  // 如果是首页，显示简单的首页标识
  if (location.pathname === "/home") {
    return (
      <div className="flex items-center gap-2">
        {/* <HomeIcon className="h-4 w-4 text-muted-foreground" /> */}
        <span className="font-medium text-foreground">首页</span>
      </div>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={`${item.href}-${index}`} className="flex items-center">
            <BreadcrumbItem>
              {item.isCurrentPage || !item.isClickable ? (
                <BreadcrumbPage
                  className={`font-medium ${
                    item.isCurrentPage
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.title}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    to={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {item.title}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && (
              <BreadcrumbSeparator className="text-muted-foreground" />
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
