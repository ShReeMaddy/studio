'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RadioTower, Wifi, Bluetooth, Usb, Video, Square, CloudUpload, MonitorSmartphone, Settings, Film, Link2, ScanLine, Loader2, Smartphone, Save, Trash2, PlayCircle, Image as ImageIcon, PauseCircle, AlertTriangle, CheckCircle2, Palette } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form"; // Added FormProvider
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import ModeToggle from '@/components/ModeToggle';


const formSchema = z.object({
  connectionType: z.string().min(1, "Please select a connection type."),
  pinOrIp: z.string().optional(),
  resolution: z.string().min(1, "Please select a resolution."),
  fps: z.string().min(1, "Please select a frame rate."),
  storagePreference: z.enum(["cloud", "local"]).default("cloud"),
});

interface RecentRecording {
  id: string;
  name: string;
  timestamp: string;
  thumbnailUrl?: string;
  duration: string;
  "data-ai-hint"?: string;
}

type ThemePreference = 'dynamic' | 'daylight' | 'night';
type ActivityStatus = 'idle' | 'recording' | 'playback';

interface ThemeHslColors {
  primary: string;
  primaryForeground: string;
  ring: string;
  gradientStart: string;
  gradientEnd: string;
}

// Time-based theme configuration for Primary color (replaces Lavender)
// HSL format string: "H S% L%"
// Gradient start/end are variations of the primary for a subtle effect
const timeSlots = [
  { startHour: 4, endHour: 7, name: "Early Morning", light: { primary: "39 100% 85%", ring: "39 100% 75%", gradientStart: "39 100% 88%", gradientEnd: "39 95% 82%" }, dark: { primary: "39 80% 65%", ring: "39 80% 55%", gradientStart: "39 80% 68%", gradientEnd: "39 75% 62%" } }, // Pale Peach
  { startHour: 7, endHour: 11, name: "Morning", light: { primary: "208 100% 82%", ring: "208 100% 72%", gradientStart: "208 100% 85%", gradientEnd: "208 95% 79%" }, dark: { primary: "208 70% 60%", ring: "208 70% 50%", gradientStart: "208 70% 63%", gradientEnd: "208 65% 57%" } }, // Sky Blue
  { startHour: 11, endHour: 16, name: "Afternoon", light: { primary: "125 88% 85%", ring: "125 88% 75%", gradientStart: "125 88% 88%", gradientEnd: "125 83% 82%" }, dark: { primary: "125 60% 65%", ring: "125 60% 55%", gradientStart: "125 60% 68%", gradientEnd: "125 55% 62%" } }, // Mint Green
  { startHour: 16, endHour: 19, name: "Evening", light: { primary: "0 100% 84%", ring: "0 100% 74%", gradientStart: "0 100% 87%", gradientEnd: "0 95% 81%" }, dark: { primary: "0 80% 65%", ring: "0 80% 55%", gradientStart: "0 80% 68%", gradientEnd: "0 75% 62%" } },    // Coral Pink
  { startHour: 19, endHour: 22, name: "Night", light: { primary: "273 47% 82%", ring: "273 47% 72%", gradientStart: "273 47% 85%", gradientEnd: "273 42% 79%" }, dark: { primary: "273 35% 60%", ring: "273 35% 50%", gradientStart: "273 35% 63%", gradientEnd: "273 30% 57%" } },  // Soft Lilac
  { startHour: 22, endHour: 24, name: "Late Night", light: { primary: "353 48% 83%", ring: "353 48% 73%", gradientStart: "353 48% 86%", gradientEnd: "353 43% 80%" }, dark: { primary: "353 35% 60%", ring: "353 35% 50%", gradientStart: "353 35% 63%", gradientEnd: "353 30% 57%" } }, // Dusty Rose
  { startHour: 0, endHour: 4, name: "Late Night", light: { primary: "353 48% 83%", ring: "353 48% 73%", gradientStart: "353 48% 86%", gradientEnd: "353 43% 80%" }, dark: { primary: "353 35% 60%", ring: "353 35% 50%", gradientStart: "353 35% 63%", gradientEnd: "353 30% 57%" } },   // Dusty Rose
];

const staticThemes: Record<string, Record<string, ThemeHslColors>> = {
  daylight: { 
    light: { primary: "45 100% 90%", primaryForeground: "240 10% 3.9%", ring: "45 100% 80%", gradientStart: "45 100% 92%", gradientEnd: "45 95% 88%" },
    dark: { primary: "45 75% 65%", primaryForeground: "0 0% 98%", ring: "45 75% 55%", gradientStart: "45 75% 67%", gradientEnd: "45 70% 63%" },
  },
  night: { 
    light: { primary: "260 35% 80%", primaryForeground: "240 10% 3.9%", ring: "260 35% 70%", gradientStart: "260 35% 82%", gradientEnd: "260 30% 78%" },
    dark: { primary: "260 45% 55%", primaryForeground: "0 0% 98%", ring: "260 45% 45%", gradientStart: "260 45% 57%", gradientEnd: "260 40% 53%" },
  },
};

const getActivityAccentHsl = (activityStatus: ActivityStatus, isDarkMode: boolean): { activityAccent: string; activityAccentForeground: string } => {
  const lightFg = "240 10% 3.9%"; // Dark gray for light themes
  const darkFg = "0 0% 98%"; // Almost white for dark themes
  
  switch (activityStatus) {
    case 'recording': // Vibrant red for recording
      return { activityAccent: isDarkMode ? "0 70% 55%" : "0 80% 60%", activityAccentForeground: isDarkMode ? darkFg : lightFg };
    case 'playback': // Vibrant blue for playback
      return { activityAccent: isDarkMode ? "210 70% 55%" : "210 80% 60%", activityAccentForeground: isDarkMode ? darkFg : lightFg };
    case 'idle':
    default: // Softer, less prominent accent for idle
      return { activityAccent: isDarkMode ? "240 5% 35%" : "250 30% 88%", activityAccentForeground: isDarkMode ? darkFg : lightFg };
  }
};

const calculateThemeSettings = (
  hour: number,
  isSystemDark: boolean,
  preference: ThemePreference
): ThemeHslColors => {
  const lightThemePrimaryFg = "240 10% 3.9%";
  const darkThemePrimaryFg = "0 0% 98%";

  if (preference === 'daylight') {
    return isSystemDark ? staticThemes.daylight.dark : staticThemes.daylight.light;
  }
  if (preference === 'night') {
    return isSystemDark ? staticThemes.night.dark : staticThemes.night.light;
  }
  // Dynamic theme
  const slot = timeSlots.find(s => hour >= s.startHour && hour < s.endHour);
  const fallbackLightColors = { primary: "250 60% 75%", primaryForeground: lightThemePrimaryFg, ring: "250 60% 65%", gradientStart: "250 60% 75%", gradientEnd: "250 60% 65%" }; 
  const fallbackDarkColors = { primary: "250 50% 65%", primaryForeground: darkThemePrimaryFg, ring: "250 50% 75%", gradientStart: "250 50% 65%", gradientEnd: "250 50% 55%" };

  if (slot) {
    const colors = isSystemDark ? slot.dark : slot.light;
    return {
      primary: colors.primary,
      primaryForeground: isSystemDark ? darkThemePrimaryFg : lightThemePrimaryFg,
      ring: colors.ring,
      gradientStart: colors.gradientStart,
      gradientEnd: colors.gradientEnd,
    };
  }
  return isSystemDark ? fallbackDarkColors : fallbackLightColors;
};


export default function HomePage() {
  const [currentTab, setCurrentTab] = useState("connection");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activityStatus, setActivityStatus] = useState<ActivityStatus>('idle');
  const [themePreference, setThemePreference] = useState<ThemePreference>('dynamic');
  
  const [recentRecordings, setRecentRecordings] = useState<RecentRecording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile(true); 
  const { theme, systemTheme } = useTheme(); // Removed setTheme as it's automatic

  const isSystemDarkMode = theme === "system" ? systemTheme === "dark" : theme === "dark";


  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      connectionType: "wifi",
      pinOrIp: "",
      resolution: "1080p",
      fps: "30fps",
      storagePreference: "cloud",
    },
  });

  const updateThemeVariables = useCallback(() => {
    if (typeof window === 'undefined' || !isMounted) return;
    const currentHour = new Date().getHours();
    const root = document.documentElement;
    
    const currentIsSystemDark = theme === "system" ? systemTheme === "dark" : theme === "dark";

    // Determine primary colors based on preference and time
    const themeColors = calculateThemeSettings(currentHour, currentIsSystemDark, themePreference);
    root.style.setProperty('--primary-hsl-dynamic', themeColors.primary);
    root.style.setProperty('--primary-foreground-hsl-dynamic', themeColors.primaryForeground);
    root.style.setProperty('--ring-hsl-dynamic', themeColors.ring);
    root.style.setProperty('--primary-gradient-start-hsl-dynamic', themeColors.gradientStart);
    root.style.setProperty('--primary-gradient-end-hsl-dynamic', themeColors.gradientEnd);

    // Update sidebar dynamic colors to match main primary gradient
    root.style.setProperty('--sidebar-gradient-start-hsl-dynamic', themeColors.gradientStart);
    root.style.setProperty('--sidebar-gradient-end-hsl-dynamic', themeColors.gradientEnd);
    // Solid fallback for sidebar items, if needed by specific items
    root.style.setProperty('--sidebar-primary-hsl', themeColors.primary);
    root.style.setProperty('--sidebar-primary-foreground-hsl', themeColors.primaryForeground);
    root.style.setProperty('--sidebar-ring-hsl', themeColors.ring);


    // Determine activity accent colors
    const activityColors = getActivityAccentHsl(activityStatus, currentIsSystemDark);
    root.style.setProperty('--activity-accent-hsl', activityColors.activityAccent);
    root.style.setProperty('--activity-accent-foreground-hsl', activityColors.activityAccentForeground);

  }, [theme, systemTheme, themePreference, activityStatus, isMounted]);


  useEffect(() => {
    setIsMounted(true);
    
    const storedThemePreference = localStorage.getItem('themePreference') as ThemePreference | null;
    if (storedThemePreference && ['dynamic', 'daylight', 'night'].includes(storedThemePreference)) {
      setThemePreference(storedThemePreference);
    } else {
      setThemePreference('dynamic'); 
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      updateThemeVariables();
    }
  }, [isMounted, updateThemeVariables]);


  useEffect(() => {
    if(isMounted) {
      localStorage.setItem('themePreference', themePreference);
      updateThemeVariables(); 
    }
  }, [themePreference, isMounted, updateThemeVariables]);

  // Effect for time-based dynamic theme updates
  useEffect(() => {
    if (!isMounted || themePreference !== 'dynamic') return;

    const timeCheckInterval = setInterval(() => {
      updateThemeVariables();
    }, 60 * 1000); 

    return () => clearInterval(timeCheckInterval);
  }, [isMounted, themePreference, updateThemeVariables]);


  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      setActivityStatus('recording');
      timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (activityStatus === 'recording') { // Only switch from recording to idle if it was recording
        setActivityStatus('idle');
      }
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording, activityStatus]); // activityStatus dependency added


    useEffect(() => {
        if(isMounted) {
            setRecentRecordings([
            { id: 'rec1', name: 'Product Demo.mp4', timestamp: new Date(Date.now() - 3600000).toLocaleString(), thumbnailUrl: 'https://picsum.photos/120/80?random=1', duration: "05:32", "data-ai-hint": "product demo" },
            { id: 'rec2', name: 'Gameplay Highlights.mp4', timestamp: new Date(Date.now() - 7200000).toLocaleString(), thumbnailUrl: 'https://picsum.photos/120/80?random=2', duration: "15:10", "data-ai-hint": "gaming highlights" },
            { id: 'rec3', name: 'Meeting Record.mp4', timestamp: new Date(Date.now() - 10800000).toLocaleString(), thumbnailUrl: 'https://picsum.photos/120/80?random=3', duration: "45:50", "data-ai-hint": "meeting recording" },
            ]);
        }
    }, [isMounted]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleConnect = (values: z.infer<typeof formSchema>) => {
    setIsConnecting(true);
    // setActivityStatus('idle'); // Connect action itself is neutral, let recording/playback set active states
    console.log("Attempting to connect with:", values);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      toast({
        title: "Connected Successfully!",
        description: `Connected via ${values.connectionType}. You can now control the remote device.`,
        action: <CheckCircle2 className="text-green-500" />,
      });
      setCurrentTab("control");
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsRecording(false); 
    setActivityStatus('idle');
    toast({
      title: "Disconnected",
      description: "Successfully disconnected from the remote device.",
      variant: "destructive",
      action: <AlertTriangle className="text-yellow-500" />,
    });
  }

  const handleStartRecording = () => {
    setIsRecording(true); // This will trigger the useEffect to set activityStatus to 'recording'
    const now = new Date();
    const newRecording: RecentRecording = {
      id: `rec_${now.getTime()}`,
      name: `Recording_${now.toISOString().replace(/[:.]/g, '-')}.mp4`,
      timestamp: now.toLocaleString(),
      thumbnailUrl: `https://picsum.photos/120/80?random=${Math.floor(Math.random() * 100)}`,
      duration: "00:00",
      "data-ai-hint": "new recording"
    };
    setRecentRecordings(prev => [newRecording, ...prev.slice(0,4)]);
    toast({
      title: "Recording Started",
      description: `Resolution: ${form.getValues("resolution")}, FPS: ${form.getValues("fps")}`,
      action: <PlayCircle className="text-primary" />
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false); // This will trigger useEffect to set activityStatus (likely to 'idle')
    setRecentRecordings(prev => {
      const updatedRecordings = [...prev];
      if (updatedRecordings.length > 0) {
        updatedRecordings[0].duration = formatTime(recordingTime);
      }
      return updatedRecordings;
    });
    toast({
      title: "Recording Stopped",
      description: `Recording saved to ${form.getValues("storagePreference")}. Duration: ${formatTime(recordingTime)}`,
      action: <Save className="text-primary" />
    });
    setRecordingTime(0);
  };
  
  const deleteRecording = (id: string) => {
    setRecentRecordings(prev => prev.filter(rec => rec.id !== id));
    toast({
      title: "Recording Deleted",
      description: "The recording has been removed.",
      variant: "destructive"
    });
  }

  const simulatePlayback = (recName: string) => {
    setActivityStatus('playback');
    toast({
        title: "Playback Started",
        description: `Playing ${recName} (simulated).`,
        action: <PlayCircle className="text-primary" />
    });
    setTimeout(() => {
        if(activityStatus === 'playback') { 
          setActivityStatus('idle');
          toast({
            title: "Playback Ended",
            description: `${recName} finished (simulated).`
          });
        }
    }, 5000);
  };

  const ConnectionIcon = ({ type }: { type: string }) => {
    const iconClasses = "mr-2 h-5 w-5 text-primary transition-colors duration-600 ease-in-out-cubic";
    if (type === 'wifi') return <Wifi className={iconClasses} />;
    if (type === 'bluetooth') return <Bluetooth className={iconClasses} />;
    if (type === 'usb') return <Usb className={iconClasses} />;
    if (type === 'lan') return <Link2 className={iconClasses} />;
    return <RadioTower className={iconClasses} />;
  };
  
  if (!isMounted) {
    return <div className="flex flex-col min-h-screen items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>; 
  }

  const getCardDynamicClass = () => {
    switch(activityStatus) {
      case 'recording': return 'card-recording-active';
      case 'playback': return 'card-playback-active';
      case 'idle': return 'card-idle-dim';
      default: return '';
    }
  };

  const getButtonDynamicClass = (buttonType: 'start' | 'stop' | 'other') => {
    if (activityStatus === 'recording' && buttonType === 'start') return 'button-recording-active';
    // Add more specific button states if needed
    return '';
  };


  return (
    <FormProvider {...form}>
    <div className={cn("flex flex-col min-h-screen bg-background text-foreground transition-colors duration-600 ease-in-out-cubic")}>
      <AppHeader currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full max-w-3xl">
         {/* Show TabsList only on mobile or if isMobile check hasn't determined state yet and !isConnected */}
         { (isMobile === true || (isMobile === null && !isConnected)) && (
            <TabsList className={cn("grid w-full mb-8 transition-all duration-500 ease-in-out-cubic", "grid-cols-2 md:grid-cols-4")}>
              <TabsTrigger value="connection" className="transition-all duration-300 ease-in-out-cubic"><RadioTower className="mr-1 md:mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />Connect</TabsTrigger>
              <TabsTrigger value="control" disabled={!isConnected} className="transition-all duration-300 ease-in-out-cubic"><MonitorSmartphone className="mr-1 md:mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />Control</TabsTrigger>
              <TabsTrigger value="display" disabled={!isConnected} className="transition-all duration-300 ease-in-out-cubic"><Video className="mr-1 md:mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />Display</TabsTrigger>
              <TabsTrigger value="settings" className="transition-all duration-300 ease-in-out-cubic"><Settings className="mr-1 md:mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />Settings</TabsTrigger>
            </TabsList>
          )}


          <TabsContent value="connection">
            <Card className={cn("w-full", getCardDynamicClass())}>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Connect Devices</CardTitle>
                <CardDescription>
                  {isConnected ? "Connected to a device. You can now proceed to control." : "Establish a connection with another device."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="text-center space-y-4">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                    <p className="text-lg text-foreground mb-4">Successfully connected!</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => setCurrentTab("control")} className="mr-2 transition-all duration-300 ease-in-out-cubic active:scale-95">
                        Go to Control Panel
                        </Button>
                        <Button variant="destructive" onClick={handleDisconnect} className="transition-all duration-300 ease-in-out-cubic active:scale-95">
                        Disconnect
                        </Button>
                    </div>
                  </div>
                ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleConnect)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="connectionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Connection Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="transition-all duration-300 ease-in-out-cubic">
                                <SelectValue placeholder="Select connection method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover/80 backdrop-blur-md">
                              <SelectItem value="wifi"><Wifi className="inline-block mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />Wi-Fi Direct</SelectItem>
                              <SelectItem value="bluetooth"><Bluetooth className="inline-block mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />Bluetooth</SelectItem>
                              <SelectItem value="usb"><Usb className="inline-block mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />USB</SelectItem>
                              <SelectItem value="lan"><Link2 className="inline-block mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />LAN (IP Address)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("connectionType") === 'lan' && (
                      <FormField
                        control={form.control}
                        name="pinOrIp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IP Address</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 192.168.1.100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                     {(form.watch("connectionType") === 'wifi' || form.watch("connectionType") === 'bluetooth') && (
                      <FormField
                        control={form.control}
                        name="pinOrIp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Device PIN (Optional)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter 6-digit PIN if required" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <Button type="submit" className="w-full dynamic-gradient-background transition-all duration-500 ease-in-out-cubic active:scale-95" size="lg" disabled={isConnecting}>
                      {isConnecting ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <ConnectionIcon type={form.getValues("connectionType")} />
                      )}
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                    <Separator className="my-4" />
                    <div className="text-center">
                        <p className="text-muted-foreground mb-2">Or scan QR code from other device:</p>
                        <Button variant="outline" type="button" className="w-full transition-all duration-300 ease-in-out-cubic active:scale-95" onClick={() => toast({title: "QR Scan: Feature coming soon!", description:"This functionality will be available in a future update."})}>
                            <ScanLine className="mr-2 h-5 w-5 text-primary transition-colors duration-600 ease-in-out-cubic" /> Scan QR Code
                        </Button>
                    </div>
                  </form>
                </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="control">
            <Card className={cn("w-full", getCardDynamicClass())}>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Remote Control</CardTitle>
                <CardDescription>Manage recording settings and actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="resolution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resolution</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="transition-all duration-300 ease-in-out-cubic">
                                  <SelectValue placeholder="Select resolution" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-popover/80 backdrop-blur-md">
                                <SelectItem value="720p">720p HD</SelectItem>
                                <SelectItem value="1080p">1080p Full HD</SelectItem>
                                <SelectItem value="4k">4K Ultra HD</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fps"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frame Rate (FPS)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="transition-all duration-300 ease-in-out-cubic">
                                  <SelectValue placeholder="Select FPS" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-popover/80 backdrop-blur-md">
                                <SelectItem value="30fps">30 FPS</SelectItem>
                                <SelectItem value="60fps">60 FPS</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                        control={form.control}
                        name="storagePreference"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Save Recording To</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="cloud" />
                                  </FormControl>
                                  <FormLabel className="font-normal flex items-center">
                                    <CloudUpload className="mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" /> Cloud Storage
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="local" />
                                  </FormControl>
                                  <FormLabel className="font-normal flex items-center">
                                   <Smartphone className="mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" /> Local Device
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                      {!isRecording ? (
                        <Button onClick={handleStartRecording} size="lg" className={cn("w-full sm:w-auto bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white dark:text-white transition-all duration-500 ease-in-out-cubic active:scale-95", getButtonDynamicClass('start'))}>
                          <PlayCircle className="mr-2 h-5 w-5" /> Start Recording
                        </Button>
                      ) : (
                        <Button onClick={handleStopRecording} size="lg" variant="destructive" className={cn("w-full sm:w-auto transition-all duration-500 ease-in-out-cubic active:scale-95", getButtonDynamicClass('stop'))}>
                          <Square className="mr-2 h-5 w-5" /> Stop Recording
                        </Button>
                      )}
                        <Button variant="outline" onClick={handleDisconnect} size="lg" className={cn("w-full sm:w-auto transition-all duration-300 ease-in-out-cubic active:scale-95", getButtonDynamicClass('other'))}>
                          Disconnect
                        </Button>
                    </div>
                    {isRecording && (
                        <div className="text-center text-lg font-medium text-red-500 dark:text-red-400 animate-pulse">
                            Recording: {formatTime(recordingTime)}
                        </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display">
            <Card className={cn("w-full", getCardDynamicClass())}>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Live Display</CardTitle>
                <CardDescription>Real-time view from the connected device.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted/70 rounded-lg flex items-center justify-center relative overflow-hidden border-2 border-primary/30 backdrop-blur-sm">
                  {isConnected ? (
                    isRecording ? 
                    <div className="absolute top-4 left-4 flex items-center bg-red-600/90 text-white px-3 py-1 rounded-full text-sm animate-pulse backdrop-blur-sm">
                        <PlayCircle className="h-4 w-4 mr-1"/> REC {formatTime(recordingTime)}
                    </div>
                    : <ImageIcon className="h-24 w-24 text-primary transition-colors duration-600 ease-in-out-cubic" data-ai-hint="placeholder image" /> 
                  ) : (
                    <div className="text-center p-4">
                        <Video className="mx-auto h-16 w-16 text-primary mb-2 transition-colors duration-600 ease-in-out-cubic" />
                        <p className="text-muted-foreground">Connect a device to see the live display.</p>
                    </div>
                  )}
                  {isConnected && !isRecording && activityStatus !== 'playback' && <Image src="https://picsum.photos/seed/dualcastdisplay/1280/720" data-ai-hint="screen content" alt="Device Screen" layout="fill" objectFit="cover" className="opacity-60 transition-opacity duration-500 ease-in-out-cubic" /> }
                  {activityStatus === 'playback' && 
                    <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm">
                        <MonitorSmartphone className="h-24 w-24 text-white animate-pulse" data-ai-hint="playback active"/>
                        <p className="absolute bottom-4 text-white text-lg">Simulating Playback...</p>
                    </div>
                  }
                </div>
                 <div className="mt-6 flex justify-center gap-4">
                    <Button variant="outline" disabled={!isConnected || isRecording} onClick={() => toast({title: "Snapshot Taken!", description: "Screenshot saved (simulated).", action: <ImageIcon className="text-primary"/>})} className="transition-all duration-300 ease-in-out-cubic active:scale-95"><ImageIcon className="mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic"/>Take Snapshot</Button>
                </div>
              </CardContent>
               <CardFooter className="flex justify-end">
                <p className="text-sm text-muted-foreground">
                    Resolution: {form.getValues("resolution")} | FPS: {form.getValues("fps")}
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-8 md:grid-cols-1"> 
                 <Card className={cn("w-full", getCardDynamicClass())}>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center"><Film className="mr-2 text-primary transition-colors duration-600 ease-in-out-cubic"/>Recent Recordings</CardTitle>
                        <CardDescription>Manage your saved recordings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentRecordings.length > 0 ? (
                        <ScrollArea className="h-[280px]">
                            <ul className="space-y-3">
                            {recentRecordings.map((rec) => (
                                <li key={rec.id} className="flex items-center justify-between p-3 rounded-md border hover:shadow-lg transition-shadow duration-300 ease-in-out-cubic bg-card/50 hover:bg-card/70">
                                <div className="flex items-center space-x-3">
                                    <Image src={rec.thumbnailUrl || "httpsum.photos/120/80"} data-ai-hint={rec["data-ai-hint"] || "video thumbnail"} alt={rec.name} width={60} height={40} className="rounded-md object-cover" />
                                    <div>
                                    <p className="font-medium text-sm">{rec.name}</p>
                                    <p className="text-xs text-muted-foreground">{rec.timestamp} &bull; {rec.duration}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => simulatePlayback(rec.name)} aria-label="Play recording" className="transition-transform duration-200 ease-in-out-cubic active:scale-90">
                                        <PlayCircle className="h-5 w-5 text-primary transition-colors duration-600 ease-in-out-cubic" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteRecording(rec.id)} aria-label="Delete recording" className="transition-transform duration-200 ease-in-out-cubic active:scale-90">
                                        <Trash2 className="h-5 w-5 text-destructive" />
                                    </Button>
                                </div>
                                </li>
                            ))}
                            </ul>
                        </ScrollArea>
                        ) : (
                        <div className="text-center py-8">
                            <Film className="mx-auto h-12 w-12 text-primary mb-3 transition-colors duration-600 ease-in-out-cubic" />
                            <p className="text-muted-foreground">No recent recordings found.</p>
                            <p className="text-sm text-muted-foreground">Start recording to see them here.</p>
                        </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                         <Button variant="outline" onClick={() => toast({title: "View All: Feature coming soon!", description:"This functionality will be available in a future update."})} disabled={recentRecordings.length === 0} className="transition-all duration-300 ease-in-out-cubic active:scale-95">
                            View All
                        </Button>
                    </CardFooter>
                </Card>

                <Card className={cn("w-full", getCardDynamicClass())}>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center"><Palette className="mr-2 text-primary transition-colors duration-600 ease-in-out-cubic"/>Theme Preferences</CardTitle>
                        <CardDescription>Customize the app&apos;s appearance. System preference will be used by default.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="theme-mode-toggle" className="text-base">
                                Theme Mode
                            </Label>
                            <ModeToggle />
                        </div>
                      <Separator />
                      <div>
                        <Label className="text-base">Color Scheme</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                            Select a color scheme preference. &quot;Dynamic&quot; changes with the time of day.
                        </p>
                        <RadioGroup
                            value={themePreference}
                            onValueChange={(value: string) => setThemePreference(value as ThemePreference)}
                            className="space-y-2"
                        >
                            <FormItem className="flex items-center space-x-3">
                                <FormControl>
                                   <RadioGroupItem value="dynamic" id="dynamic-theme"/>
                                </FormControl>
                               <Label htmlFor="dynamic-theme" className="font-normal">Dynamic (Time-based)</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3">
                                <FormControl>
                                  <RadioGroupItem value="daylight" id="daylight-theme"/>
                                </FormControl>
                                <Label htmlFor="daylight-theme" className="font-normal">Soft Daylight (Static)</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3">
                               <FormControl>
                                 <RadioGroupItem value="night" id="night-theme"/>
                               </FormControl>
                               <Label htmlFor="night-theme" className="font-normal">Soft Night (Static)</Label>
                            </FormItem>
                        </RadioGroup>
                      </div>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t transition-colors duration-600 ease-in-out-cubic">
        © {new Date().getFullYear()} DualCast. All rights reserved.
      </footer>
    </div>
    </FormProvider>
  );
}

