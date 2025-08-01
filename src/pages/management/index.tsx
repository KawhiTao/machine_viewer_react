import { RouteConfigManager } from "@/components/admin/RouteConfigManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, Users, Shield, Database } from "lucide-react";

export default function ManagementPage() {
  return (
    <div className="mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings2 className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">系统管理</h1>
          <p className="text-muted-foreground">
            管理系统配置、用户权限和路由设置
          </p>
        </div>
      </div>

      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            路由配置
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            用户管理
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            权限管理
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            系统设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-6">
          <RouteConfigManager />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                用户管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">用户管理功能待开发...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                权限管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">权限管理功能待开发...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                系统设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">系统设置功能待开发...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
