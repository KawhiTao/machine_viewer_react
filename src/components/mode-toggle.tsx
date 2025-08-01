import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useMemo } from "react";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  const whichTheme = useMemo(() => {
    if (theme === "light") return "明亮";
    if (theme === "dark") return "黑暗";
    return "系统";
  }, [theme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem
          className={
            whichTheme === "明亮" ? "bg-accent text-accent-foreground" : ""
          }
          onClick={() => setTheme("light")}
        >
          明亮
        </DropdownMenuItem>
        <DropdownMenuItem
          className={
            whichTheme === "黑暗" ? "bg-accent text-accent-foreground" : ""
          }
          onClick={() => setTheme("dark")}
        >
          黑暗
        </DropdownMenuItem>
        <DropdownMenuItem
          className={
            whichTheme === "系统" ? "bg-accent text-accent-foreground" : ""
          }
          onClick={() => setTheme("system")}
        >
          系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
