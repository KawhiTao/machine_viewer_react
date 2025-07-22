import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export default function ContextMenuDemo({
  children,
}: {
  children: React.ReactNode;
}) {
  function refreshPage() {
    window.location.reload();
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={refreshPage}>刷新</ContextMenuItem>
        <ContextMenuItem>New Folder</ContextMenuItem>
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuItem variant="destructive">删除</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
