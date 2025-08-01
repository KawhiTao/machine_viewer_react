"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { RouteConfigManager } from "./RouteConfigManager";

interface RouteConfigDialogProps {
  children?: React.ReactNode;
}

export function RouteConfigDialog({ children }: RouteConfigDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4 mr-2" />
            路由配置
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            路由配置管理
          </DialogTitle>
          <DialogDescription>
            动态配置导航菜单的显示状态、权限和排序
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <RouteConfigManager />
        </div>
      </DialogContent>
    </Dialog>
  );
}
