"use client";

import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import { ModeToggle } from "@/components/mode-toggle";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
];

export function NavigationMenuDemo() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 80);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${
        isScrolled ? "px-8 py-4" : "px-0 py-0"
      }`}
      style={{ pointerEvents: isScrolled ? "none" : "auto" }}
    >
      <NavigationMenu
        className={`flex w-full nav-smooth-transition shadow-accent ${
          isScrolled
            ? "nav-capsule px-8 py-3 mx-auto max-w-fit"
            : "bg-background p-4 shadow-sm w-full"
        }`}
        viewport={false}
        style={{ pointerEvents: "auto" }}
      >
        <NavigationMenuList className="flex flex-row items-center">
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={cn(
                navigationMenuTriggerStyle(),
                isActive("/") && "bg-accent text-accent-foreground",
              )}
            >
              <Link to="/">
                <span
                  className={`font-semibold transition-all duration-500 ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  视图大模型
                </span>
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          {!isScrolled && (
            <>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/auto") && "bg-accent text-accent-foreground",
                  )}
                >
                  <Link to="/auto">自动检测</Link>
                </NavigationMenuLink>
                {/* <NavigationMenuTrigger>Components</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {components.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent> */}
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/search") && "bg-accent text-accent-foreground",
                  )}
                >
                  <Link to="/search">以文搜图</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/online") && "bg-accent text-accent-foreground",
                  )}
                >
                  <Link to="/online">在线微调</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/video") && "bg-accent text-accent-foreground",
                  )}
                >
                  <Link to="/video">视频解析</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/demo") && "bg-accent text-accent-foreground",
                  )}
                >
                  <Link to="/demo">demo</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>List</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[300px] gap-4">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link to="#">
                          <div className="font-medium">Components</div>
                          <div className="text-muted-foreground">
                            Browse all components in the library.
                          </div>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link to="#">
                          <div className="font-medium">Documentation</div>
                          <div className="text-muted-foreground">
                            Learn how to use the library.
                          </div>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link to="#">
                          <div className="font-medium">Blog</div>
                          <div className="text-muted-foreground">
                            Read our latest blog posts.
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Simple</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-4">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link to="#">Components</Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link to="#">Documentation</Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link to="#">Blocks</Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-4">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link to="#" className="flex-row items-center gap-2">
                          <CircleHelpIcon />
                          Backlog
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link to="#" className="flex-row items-center gap-2">
                          <CircleIcon />
                          To Do
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link to="#" className="flex-row items-center gap-2">
                          <CircleCheckIcon />
                          Done
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </>
          )}

          {isScrolled && (
            <>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/demo") && "bg-accent text-accent-foreground",
                  )}
                >
                  <Link to="/demo">Demo</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/docs") && "bg-accent text-accent-foreground",
                  )}
                >
                  <Link to="/docs">Docs</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </>
          )}
        </NavigationMenuList>

        <div className="flex items-center space-x-2 ml-auto">
          <ModeToggle />
        </div>
      </NavigationMenu>
    </div>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link to={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
export {
  ListItem,
  components,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
};
