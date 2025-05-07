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
import { RadioTower, Wifi, Bluetooth, Usb, Video, Square, CloudUpload, MonitorSmartphone, Settings, Film, Link2, ScanLine, Loader2, Smartphone, Save, Trash2, PlayCircle, Image as ImageIcon, PauseCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

// Time-based theme configuration for Primary color (replaces Lavender)
// HSL format: "H S% L%"
const timeSlots = [
  // Early Morning (4 AM – 7 AM): Pale Peach #FFE5B4 
  { startHour: 4, endHour: 7, name: "Early Morning", light: { primary: "39 100% 85%", ring: "39 100% 75%" }, dark: { primary: "39 80% 65%", ring: "39 80% 55%" } },
  // Morning (7 AM – 11 AM): Sky Blue #A2D2FF 
  { startHour: 7, endHour: 11, name: "Morning", light: { primary: "208 100% 82%", ring: "208 100% 72%" }, dark: { primary: "208 70% 60%", ring: "208 70% 50%" } },
  // Afternoon (11 AM – 4 PM): Mint Green #B9FBC0
  { startHour: 11, endHour: 16, name: "Afternoon", light: { primary: "125 88% 85%", ring: "125 88% 75%" }, dark: { primary: "125 60% 65%", ring: "125 60% 55%" } },
  // Evening (4 PM – 7 PM): Coral Pink #FFADAD 
  { startHour: 16, endHour: 19, name: "Evening", light: { primary: "0 100% 84%", ring: "0 100% 74%" }, dark: { primary: "0 80% 65%", ring: "0 80% 55%" } },
  // Night (7 PM – 10 PM): Soft Lilac #D7BCE8 
  { startHour: 19, endHour: 22, name: "Night", light: { primary: "273 47% 82%", ring: "273 47% 72%" }, dark: { primary: "273 35% 60%", ring: "273 35% 50%" } },
  // Late Night (10 PM – 4 AM): Dusty Rose #E8C1C5 
  { startHour: 22, endHour: 24, name: "Late Night", light: { primary: "353 48% 83%", ring: "353 48% 73%" }, dark: { primary: "353 35% 60%", ring: "353 35% 50%" } }, // Before midnight
  { startHour: 0, endHour: 4, name: "Late Night", light: { primary: "353 48% 83%", ring: "353 48% 73%" }, dark: { primary: "353 35% 60%", ring: "353 35% 50%" } },   // After midnight
];

const getDynamicPrimaryColors = (hour: number, isDarkMode: boolean): { primary: string; primaryForeground: string; ring: string } => {
  const slot = timeSlots.find(s => hour >= s.startHour && hour < s.endHour);
  
  const lightThemePrimaryFg = "240 10% 3.9%"; // Dark Gray (for light pastel backgrounds)
  const darkThemePrimaryFg = "0 0% 98%";    // Off-white (for dark pastel backgrounds)

  const fallbackLightColors = { primary: "250 60% 65%", primaryForeground: lightThemePrimaryFg, ring: "250 60% 55%" }; // Lavender
  const fallbackDarkColors = { primary: "250 50% 55%", primaryForeground: darkThemePrimaryFg, ring: "250 50% 65%" }; // Darker Lavender

  if (slot) {
    const colors = isDarkMode ? slot.dark : slot.light;
    return { 
      primary: colors.primary, 
      primaryForeground: isDarkMode ? darkThemePrimaryFg : lightThemePrimaryFg,
      ring: colors.ring 
    };
  }
  return isDarkMode ? fallbackDarkColors : fallbackLightColors;
};


export default function HomePage() {
  const [currentTab, setCurrentTab] = useState("connection");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isDarkModeState, setIsDarkModeState] = useState(false); // Local state to track dark mode
  const [recentRecordings, setRecentRecordings] = useState<RecentRecording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile(true); // Default to true to avoid layout shifts, will be updated on mount

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

  const applyDynamicTheme = useCallback(() => {
    if (typeof window === 'undefined') return;
    const currentHour = new Date().getHours();
    // Read dark mode status directly from HTML class for immediate reflection
    const currentIsDarkMode = document.documentElement.classList.contains('dark');
    
    const dynamicColors = getDynamicPrimaryColors(currentHour, currentIsDarkMode);
    
    const root = document.documentElement;
    root.style.setProperty('--primary-dynamic', dynamicColors.primary);
    root.style.setProperty('--primary-foreground-dynamic', dynamicColors.primaryForeground);
    root.style.setProperty('--ring-dynamic', dynamicColors.ring);

    // Apply to sidebar variables as well to ensure consistency
    root.style.setProperty('--sidebar-primary-dynamic', dynamicColors.primary);
    root.style.setProperty('--sidebar-primary-foreground-dynamic', dynamicColors.primaryForeground);
    root.style.setProperty('--sidebar-ring-dynamic', dynamicColors.ring);
  }, []);


  useEffect(() => {
    setIsMounted(true);
    
    const prefersDarkModeMatcher = window.matchMedia('(prefers-color-scheme: dark)');
    const initialIsDark = prefersDarkModeMatcher.matches;
    
    setIsDarkModeState(initialIsDark); // Update local state
    if (initialIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    applyDynamicTheme();

    const systemThemeChangeHandler = (e: MediaQueryListEvent) => {
      const newIsDark = e.matches;
      setIsDarkModeState(newIsDark); // Update local state
      if (newIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      applyDynamicTheme();
    };

    prefersDarkModeMatcher.addEventListener('change', systemThemeChangeHandler);

    setRecentRecordings([
      { id: 'rec1', name: 'Product Demo.mp4', timestamp: new Date(Date.now() - 3600000).toLocaleString(), thumbnailUrl: 'https://picsum.photos/120/80?random=1', duration: "05:32", "data-ai-hint": "product demo" },
      { id: 'rec2', name: 'Gameplay Highlights.mp4', timestamp: new Date(Date.now() - 7200000).toLocaleString(), thumbnailUrl: 'https://picsum.photos/120/80?random=2', duration: "15:10", "data-ai-hint": "gaming highlights" },
      { id: 'rec3', name: 'Meeting Record.mp4', timestamp: new Date(Date.now() - 10800000).toLocaleString(), thumbnailUrl: 'https://picsum.photos/120/80?random=3', duration: "45:50", "data-ai-hint": "meeting recording" },
    ]);

    const timeCheckInterval = setInterval(() => {
      applyDynamicTheme();
    }, 60 * 1000); 
    
    return () => {
      prefersDarkModeMatcher.removeEventListener('change', systemThemeChangeHandler);
      clearInterval(timeCheckInterval);
    };

  }, [applyDynamicTheme]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleConnect = (values: z.infer<typeof formSchema>) => {
    setIsConnecting(true);
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
    toast({
      title: "Disconnected",
      description: "Successfully disconnected from the remote device.",
      variant: "destructive",
      action: <AlertTriangle className="text-yellow-500" />,
    });
  }

  const handleStartRecording = () => {
    setIsRecording(true);
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
    setIsRecording(false);
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

  const ConnectionIcon = ({ type }: { type: string }) => {
    if (type === 'wifi') return <Wifi className="mr-2 h-5 w-5" />;
    if (type === 'bluetooth') return <Bluetooth className="mr-2 h-5 w-5" />;
    if (type === 'usb') return <Usb className="mr-2 h-5 w-5" />;
    if (type === 'lan') return <Link2 className="mr-2 h-5 w-5" />;
    return <RadioTower className="mr-2 h-5 w-5" />;
  };
  
  if (!isMounted) {
    return <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>; 
  }

  return (
    <div className={cn("flex flex-col min-h-screen bg-background text-foreground")}>
      <AppHeader currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          {isMobile && (
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
              <TabsTrigger value="connection"><RadioTower className="mr-1 md:mr-2 h-4 w-4" />Connect</TabsTrigger>
              <TabsTrigger value="control" disabled={!isConnected}><MonitorSmartphone className="mr-1 md:mr-2 h-4 w-4" />Control</TabsTrigger>
              <TabsTrigger value="display" disabled={!isConnected}><Video className="mr-1 md:mr-2 h-4 w-4" />Display</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="mr-1 md:mr-2 h-4 w-4" />Settings</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="connection">
            <Card className="w-full max-w-2xl shadow-xl">
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
                        <Button onClick={() => setCurrentTab("control")} className="mr-2">
                        Go to Control Panel
                        </Button>
                        <Button variant="destructive" onClick={handleDisconnect}>
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
                              <SelectTrigger>
                                <SelectValue placeholder="Select connection method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="wifi"><Wifi className="inline-block mr-2 h-4 w-4" />Wi-Fi Direct</SelectItem>
                              <SelectItem value="bluetooth"><Bluetooth className="inline-block mr-2 h-4 w-4" />Bluetooth</SelectItem>
                              <SelectItem value="usb"><Usb className="inline-block mr-2 h-4 w-4" />USB</SelectItem>
                              <SelectItem value="lan"><Link2 className="inline-block mr-2 h-4 w-4" />LAN (IP Address)</SelectItem>
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
                    
                    <Button type="submit" className="w-full" size="lg" disabled={isConnecting}>
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
                        <Button variant="outline" type="button" className="w-full" onClick={() => alert("QR Scan: Feature coming soon!")}>
                            <ScanLine className="mr-2 h-5 w-5" /> Scan QR Code
                        </Button>
                    </div>
                  </form>
                </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="control">
            <Card className="w-full max-w-2xl shadow-xl">
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
                                <SelectTrigger>
                                  <SelectValue placeholder="Select resolution" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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
                                <SelectTrigger>
                                  <SelectValue placeholder="Select FPS" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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
                                    <CloudUpload className="mr-2 h-4 w-4" /> Cloud Storage
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="local" />
                                  </FormControl>
                                  <FormLabel className="font-normal flex items-center">
                                   <Smartphone className="mr-2 h-4 w-4" /> Local Device
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
                        <Button onClick={handleStartRecording} size="lg" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white">
                          <PlayCircle className="mr-2 h-5 w-5" /> Start Recording
                        </Button>
                      ) : (
                        <Button onClick={handleStopRecording} size="lg" variant="destructive" className="w-full sm:w-auto">
                          <Square className="mr-2 h-5 w-5" /> Stop Recording
                        </Button>
                      )}
                        <Button variant="outline" onClick={handleDisconnect} size="lg" className="w-full sm:w-auto">
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
            <Card className="w-full max-w-3xl shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Live Display</CardTitle>
                <CardDescription>Real-time view from the connected device.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden border-2 border-primary/50">
                  {isConnected ? (
                    isRecording ? 
                    <div className="absolute top-4 left-4 flex items-center bg-red-500/80 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                        <PlayCircle className="h-4 w-4 mr-1"/> REC {formatTime(recordingTime)}
                    </div>
                    : <ImageIcon className="h-24 w-24 text-muted-foreground" data-ai-hint="placeholder image" /> 
                  ) : (
                    <div className="text-center p-4">
                        <Video className="mx-auto h-16 w-16 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Connect a device to see the live display.</p>
                    </div>
                  )}
                  {isConnected && !isRecording && <Image src="https://picsum.photos/seed/dualcastdisplay/1280/720" data-ai-hint="screen content" alt="Device Screen" layout="fill" objectFit="cover" className="opacity-70" /> }
                </div>
                 <div className="mt-6 flex justify-center gap-4">
                    <Button variant="outline" disabled={!isConnected || isRecording} onClick={() => toast({title: "Snapshot Taken!", description: "Screenshot saved (simulated)."})}><ImageIcon className="mr-2 h-4 w-4"/>Take Snapshot</Button>
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
                 <Card className="w-full shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center"><Film className="mr-2 text-primary"/>Recent Recordings</CardTitle>
                        <CardDescription>Manage your saved recordings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentRecordings.length > 0 ? (
                        <ScrollArea className="h-[280px]">
                            <ul className="space-y-3">
                            {recentRecordings.map((rec) => (
                                <li key={rec.id} className="flex items-center justify-between p-3 rounded-md border hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3">
                                    <Image src={rec.thumbnailUrl || "https://picsum.photos/120/80"} data-ai-hint={rec["data-ai-hint"] || "video thumbnail"} alt={rec.name} width={60} height={40} className="rounded-md object-cover" />
                                    <div>
                                    <p className="font-medium text-sm">{rec.name}</p>
                                    <p className="text-xs text-muted-foreground">{rec.timestamp} &bull; {rec.duration}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => alert(`Playing ${rec.name}`)} aria-label="Play recording">
                                        <PlayCircle className="h-5 w-5 text-primary" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteRecording(rec.id)} aria-label="Delete recording">
                                        <Trash2 className="h-5 w-5 text-destructive" />
                                    </Button>
                                </div>
                                </li>
                            ))}
                            </ul>
                        </ScrollArea>
                        ) : (
                        <div className="text-center py-8">
                            <Film className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No recent recordings found.</p>
                            <p className="text-sm text-muted-foreground">Start recording to see them here.</p>
                        </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                         <Button variant="outline" onClick={() => alert("View all recordings: Feature coming soon!")} disabled={recentRecordings.length === 0}>
                            View All
                        </Button>
                    </CardFooter>
                </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} DualCast. All rights reserved.
      </footer>
    </div>
  );
}
