import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetDescription } from "@/components/ui/sheet"; 
import { Menu, MonitorSmartphone, Settings, RadioTower, Video, User, LogOut } from "lucide-react";
import type { Dispatch, SetStateAction } from 'react';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Timestamp } from "firebase/firestore";


interface UserProfile {
  uid: string;
  email: string | null;
  username?: string;
  profilePictureUrl?: string;
  deviceType?: string;
  lastLoginTime?: Timestamp;
  themePref?: string; 
  enableGradient?: boolean;
}

interface AppHeaderProps {
  currentTab: string;
  setCurrentTab: Dispatch<SetStateAction<string>>;
  userProfile: UserProfile | null;
  onLogout: () => void;
}

export default function AppHeader({ currentTab, setCurrentTab, userProfile, onLogout }: AppHeaderProps) {
  const navItems = [
    { id: "connection", label: "Connect", icon: RadioTower },
    { id: "control", label: "Control", icon: MonitorSmartphone },
    { id: "display", label: "Display", icon: Video },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-lg supports-[backdrop-filter]:bg-background/50 transition-colors duration-500 ease-in-out-cubic">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 fill-activity transition-all duration-600 ease-in-out-cubic" 
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
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground transition-colors duration-600 ease-in-out-cubic">DualCast</h1>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {userProfile ? (
             <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                 <Avatar className="h-8 w-8 md:h-9 md:w-9">
                   <AvatarImage src={userProfile.profilePictureUrl || `https://avatar.vercel.sh/${userProfile.email}.png`} alt={userProfile.username || "User Avatar"} data-ai-hint="user avatar" />
                   <AvatarFallback>{userProfile.username ? userProfile.username.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                 </Avatar>
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent className="w-56 bg-popover/80 backdrop-blur-md" align="end" forceMount>
               <DropdownMenuLabel className="font-normal">
                 <div className="flex flex-col space-y-1">
                   <p className="text-sm font-medium leading-none">{userProfile.username || "User"}</p>
                   <p className="text-xs leading-none text-muted-foreground">
                     {userProfile.email}
                   </p>
                 </div>
               </DropdownMenuLabel>
               <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCurrentTab('settings')} className="cursor-pointer">
                 <Settings className="mr-1 h-3 w-3" />
                 Settings
               </DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 dark:text-red-500 focus:bg-red-100 dark:focus:bg-red-800/50 focus:text-red-700 dark:focus:text-red-400">
                 <LogOut className="mr-1 h-3 w-3"/>
                 Logout
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
          ) : (
             <Button variant="outline" onClick={() => { /* This might navigate to a login page or open a modal if page doesn't handle auth view directly */ console.log("Login button clicked"); }}>
               <User className="mr-2 h-4 w-4" /> Login
             </Button>
          )}
         
          {userProfile && ( 
            <div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 transition-all duration-500 ease-in-out-cubic active:scale-90">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className={cn(
                    "w-[280px] p-0", 
                    userProfile.enableGradient ? "sidebar-dynamic-gradient-bg" : "bg-sidebar", // Conditional gradient
                    "text-sidebar-foreground border-sidebar-border transition-all duration-700 ease-in-out-cubic"
                  )}
                >
                    <SheetHeader className="p-4 border-b border-sidebar-border/70">
                        <SheetTitle className="sr-only">DualCast Menu</SheetTitle>
                        <DialogTitle className="sr-only">DualCast Menu</DialogTitle>
                        <SheetDescription className="sr-only">Navigation menu for DualCast application features.</SheetDescription>
                        <div className="flex items-center">
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="mr-2 fill-activity transition-all duration-600 ease-in-out-cubic"
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
                            <span className="text-xl font-bold text-sidebar-foreground transition-colors duration-600 ease-in-out-cubic">DualCast Menu</span>
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
                              "flex items-center space-x-3 justify-start p-3 text-base transition-all duration-500 ease-in-out-cubic active:scale-95",
                              currentTab === item.id && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/80 shadow-md",
                              currentTab !== item.id && "hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                            )}
                            aria-current={currentTab === item.id ? "page" : undefined}
                          >
                            <item.icon className="h-5 w-5 text-activity transition-colors duration-600 ease-in-out-cubic" />
                            <span className="transition-colors duration-600 ease-in-out-cubic">{item.label}</span>
                          </Button>
                      </SheetClose>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
           )}
        </div>
      </div>
    </header>
  );
}
