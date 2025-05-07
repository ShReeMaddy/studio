import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"; 
import { Menu, MonitorSmartphone, Settings, RadioTower, Video } from "lucide-react";
import type { Dispatch, SetStateAction } from 'react';
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  currentTab: string;
  setCurrentTab: Dispatch<SetStateAction<string>>;
}

export default function AppHeader({ currentTab, setCurrentTab }: AppHeaderProps) {
  const navItems = [
    { id: "connection", label: "Connect", icon: RadioTower },
    { id: "control", label: "Control", icon: MonitorSmartphone },
    { id: "display", label: "Display", icon: Video },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 fill-primary transition-colors duration-500 ease-in-out" // Use fill-primary for SVG
            aria-label="DualCast Logo"
          >
            <path
              d="M7 4C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H10V13H14V20H17C18.1046 20 19 19.1046 19 18V6C19 4.89543 18.1046 4 17 4H7ZM7 6H17V11H7V6Z"
              fill="currentColor" // currentColor will inherit from fill-primary
            />
            <path
              d="M10 13H14V18H10V13Z"
              fill="currentColor" // currentColor will inherit from fill-primary
              opacity="0.7"
            />
          </svg>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">DualCast</h1>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <Avatar className="h-8 w-8 md:h-9 md:w-9">
            <AvatarImage src="https://picsum.photos/40/40" alt="User Avatar" data-ai-hint="user avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className={cn(
                  "w-[280px] p-0", 
                  "bg-sidebar text-sidebar-foreground border-sidebar-border transition-colors duration-500 ease-in-out" 
                )}
              >
                <SheetHeader className="p-4 border-b border-sidebar-border">
                  <div className="flex items-center">
                      <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-2 fill-primary transition-colors duration-500 ease-in-out" 
                          aria-label="DualCast Logo"
                      >
                          <path
                          d="M7 4C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H10V13H14V20H17C18.1046 20 19 19.1046 19 18V6C19 4.89543 18.1046 4 17 4H7ZM7 6H17V11H7V6Z"
                          fill="currentColor"
                          />
                          <path
                          d="M10 13H14V18H10V13Z"
                          fill="currentColor"
                          opacity="0.7"
                          />
                      </svg>
                      <SheetTitle className="text-xl font-bold text-sidebar-foreground">DualCast Menu</SheetTitle>
                  </div>
                </SheetHeader>
                <nav className="grid gap-3 p-4">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.id}>
                       <Button
                          variant={currentTab === item.id ? "default" : "ghost"} 
                          onClick={() => {
                            setCurrentTab(item.id);
                          }}
                          className={cn(
                            "flex items-center space-x-3 justify-start p-3 text-base",
                            currentTab === item.id && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
                            currentTab !== item.id && "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                          aria-current={currentTab === item.id ? "page" : undefined}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Button>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
