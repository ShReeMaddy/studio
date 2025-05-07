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
import { RadioTower, Wifi, Bluetooth, Usb, Video, Square, CloudUpload, MonitorSmartphone, Settings, Film, Link2, ScanLine, Loader2, Smartphone, Save, Trash2, PlayCircle, Image as ImageIcon, PauseCircle, AlertTriangle, CheckCircle2, Palette, User, LogOut, Info, Eye, EyeOff, FileText, Download, Languages, HelpCircle, X } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn, getFirebaseErrorMessage } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import ModeToggle from '@/components/ModeToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, Timestamp, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { getRemoteConfig, fetchAndActivate, getString } from "firebase/remote-config";
import { createFirebaseApp, initializeFirebaseServices } from '@/lib/firebase'; 


interface RecentRecording {
  id: string;
  name: string;
  timestamp: string;
  thumbnailUrl?: string;
  downloadUrl?: string; 
  duration: string;
  "data-ai-hint"?: string;
}

type ThemePreference = 'dynamic' | 'daylight' | 'night';
type ActivityStatus = 'idle' | 'recording' | 'playback' | 'connecting' | 'syncing';
type AuthView = 'login' | 'signup' | 'resetPassword' | 'emailVerification';


interface ThemeHslColors {
  primary: string;
  primaryForeground: string;
  ring: string;
  gradientStart: string;
  gradientEnd: string;
}

const timeSlots = [
  { startHour: 4, endHour: 7, name: "Early Morning", light: { primary: "39 100% 85%", ring: "39 100% 75%", gradientStart: "39 100% 88%", gradientEnd: "39 95% 82%" }, dark: { primary: "39 80% 65%", ring: "39 80% 55%", gradientStart: "39 80% 68%", gradientEnd: "39 75% 62%" } },
  { startHour: 7, endHour: 11, name: "Morning", light: { primary: "208 100% 82%", ring: "208 100% 72%", gradientStart: "208 100% 85%", gradientEnd: "208 95% 79%" }, dark: { primary: "208 70% 60%", ring: "208 70% 50%", gradientStart: "208 70% 63%", gradientEnd: "208 65% 57%" } },
  { startHour: 11, endHour: 16, name: "Afternoon", light: { primary: "125 88% 85%", ring: "125 88% 75%", gradientStart: "125 88% 88%", gradientEnd: "125 83% 82%" }, dark: { primary: "125 60% 65%", ring: "125 60% 55%", gradientStart: "125 60% 68%", gradientEnd: "125 55% 62%" } },
  { startHour: 16, endHour: 19, name: "Evening", light: { primary: "0 100% 84%", ring: "0 100% 74%", gradientStart: "0 100% 87%", gradientEnd: "0 95% 81%" }, dark: { primary: "0 80% 65%", ring: "0 80% 55%", gradientStart: "0 80% 68%", gradientEnd: "0 75% 62%" } },
  { startHour: 19, endHour: 22, name: "Night", light: { primary: "273 47% 82%", ring: "273 47% 72%", gradientStart: "273 47% 85%", gradientEnd: "273 42% 79%" }, dark: { primary: "273 35% 60%", ring: "273 35% 50%", gradientStart: "273 35% 63%", gradientEnd: "273 30% 57%" } },
  { startHour: 22, endHour: 24, name: "Late Night", light: { primary: "353 48% 83%", ring: "353 48% 73%", gradientStart: "353 48% 86%", gradientEnd: "353 43% 80%" }, dark: { primary: "353 35% 60%", ring: "353 35% 50%", gradientStart: "353 35% 63%", gradientEnd: "353 30% 57%" } },
  { startHour: 0, endHour: 4, name: "Late Night", light: { primary: "353 48% 83%", ring: "353 48% 73%", gradientStart: "353 48% 86%", gradientEnd: "353 43% 80%" }, dark: { primary: "353 35% 60%", ring: "353 35% 50%", gradientStart: "353 35% 63%", gradientEnd: "353 30% 57%" } },
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
  const lightFg = "240 10% 3.9%";
  const darkFg = "0 0% 98%";
  
  switch (activityStatus) {
    case 'recording': return { activityAccent: isDarkMode ? "0 70% 55%" : "0 80% 60%", activityAccentForeground: isDarkMode ? darkFg : lightFg };
    case 'playback': return { activityAccent: isDarkMode ? "210 70% 55%" : "210 80% 60%", activityAccentForeground: isDarkMode ? darkFg : lightFg };
    case 'connecting': return { activityAccent: isDarkMode ? "45 70% 55%" : "45 80% 60%", activityAccentForeground: isDarkMode ? darkFg : lightFg }; 
    case 'syncing': return { activityAccent: isDarkMode ? "120 70% 50%" : "120 70% 55%", activityAccentForeground: isDarkMode ? darkFg: lightFg }; 
    case 'idle':
    default: return { activityAccent: isDarkMode ? "240 5% 35%" : "250 30% 88%", activityAccentForeground: isDarkMode ? darkFg : lightFg };
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

interface UserProfile {
  uid: string;
  email: string | null;
  username?: string;
  profilePictureUrl?: string;
  deviceType?: string;
  lastLoginTime?: Timestamp;
  themePref?: ThemePreference;
  enableGradient?: boolean;
}

interface ConnectionStatus {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
}


export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState<string | null>(null);

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
  const { theme, systemTheme, setTheme } = useTheme();
  const isSystemDarkMode = theme === "system" ? systemTheme === "dark" : theme === "dark";

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string, forceUpdate: boolean, message: string } | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('en'); 
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [gradientEnabled, setGradientEnabled] = useState(true); 

  const { toast } = useToast();

  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [storage, setStorage] = useState<any>(null);
  const [remoteConfig, setRemoteConfig] = useState<any>(null);


  const recordingSettingsForm = useForm<z.infer<typeof recordingSettingsSchema>>({
    resolver: zodResolver(recordingSettingsSchema),
    defaultValues: {
      connectionType: "wifi",
      pinOrIp: "",
      resolution: "1080p",
      fps: "30fps",
      storagePreference: "cloud",
    },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });
  
  const passwordResetForm = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    const initializeFirebase = async () => {
      const app = createFirebaseApp();
      if (app) {
        await initializeFirebaseServices(app);
        setFirebaseApp(app);
        setAuth(getAuth(app));
        setDb(getFirestore(app));
        setStorage(getStorage(app));
        setRemoteConfig(getRemoteConfig(app));
      } else {
        console.error("Firebase initialization failed. Check your configuration.");
      }
    };

    initializeFirebase();
    setIsMounted(true); 
  }, []);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          if (user.emailVerified) {
            setCurrentUser(user);
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const profileData = userDocSnap.data() as UserProfile;
              setUserProfile(profileData);
              if (profileData.themePref) setThemePreference(profileData.themePref);
              if (profileData.enableGradient !== undefined) setGradientEnabled(profileData.enableGradient);

            } else {
              setUserProfile({ uid: user.uid, email: user.email });
            }
            const isFirstLoginStorageKey = `onboarding_complete_${user.uid}`;
            const isFirstLogin = localStorage.getItem(isFirstLoginStorageKey) === null;
            if (isFirstLogin) {
              setShowOnboarding(true);
              // Don't set item here, set it after onboarding is dismissed by user
            }
          } else {
            setCurrentUser(null);
            setUserProfile(null);
            setEmailForVerification(user.email);
            setAuthView('emailVerification');
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
          setAuthView('login');
        }
        setIsMounted(true); 
      });
      return () => unsubscribe();
    }
  }, [auth, db]);
 
  useEffect(() => {
    if (currentUser && currentUser.emailVerified && db) {
      const fetchProfile = async () => {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data() as UserProfile;
          setUserProfile(profileData);
          if (profileData.themePref) setThemePreference(profileData.themePref);
          if (profileData.enableGradient !== undefined) setGradientEnabled(profileData.enableGradient);
          if (recordingSettingsForm.getValues("storagePreference") === "cloud") {
            fetchCloudRecordings();
          }
        }
      };
      fetchProfile();
    }
  }, [currentUser, recordingSettingsForm, db]);


  const updateThemeVariables = useCallback(() => {
    if (typeof window === 'undefined' || !isMounted) return;
    const currentHour = new Date().getHours();
    const root = document.documentElement;
    
    const currentIsSystemDark = theme === "system" ? systemTheme === "dark" : theme === "dark";

    const themeColors = calculateThemeSettings(currentHour, currentIsSystemDark, themePreference);
    
    if (gradientEnabled) {
      root.style.setProperty('--primary-hsl-dynamic', themeColors.primary); 
      root.style.setProperty('--primary-foreground-hsl-dynamic', themeColors.primaryForeground);
      root.style.setProperty('--ring-hsl-dynamic', themeColors.ring);
      root.style.setProperty('--primary-gradient-start-hsl-dynamic', themeColors.gradientStart);
      root.style.setProperty('--primary-gradient-end-hsl-dynamic', themeColors.gradientEnd);

      root.style.setProperty('--sidebar-gradient-start-hsl-dynamic', themeColors.gradientStart);
      root.style.setProperty('--sidebar-gradient-end-hsl-dynamic', themeColors.gradientEnd);
    } else { 
      root.style.setProperty('--primary-hsl-dynamic', themeColors.primary);
      root.style.setProperty('--primary-foreground-hsl-dynamic', themeColors.primaryForeground);
      root.style.setProperty('--ring-hsl-dynamic', themeColors.ring);
      root.style.setProperty('--primary-gradient-start-hsl-dynamic', themeColors.primary);
      root.style.setProperty('--primary-gradient-end-hsl-dynamic', themeColors.primary);
      root.style.setProperty('--sidebar-gradient-start-hsl-dynamic', themeColors.primary);
      root.style.setProperty('--sidebar-gradient-end-hsl-dynamic', themeColors.primary);
    }
    
    root.style.setProperty('--sidebar-primary-hsl', themeColors.primary);
    root.style.setProperty('--sidebar-primary-foreground-hsl', themeColors.primaryForeground);
    root.style.setProperty('--sidebar-ring-hsl', themeColors.ring);

    const activityColors = getActivityAccentHsl(activityStatus, currentIsSystemDark);
    root.style.setProperty('--activity-accent-hsl', activityColors.activityAccent);
    root.style.setProperty('--activity-accent-foreground-hsl', activityColors.activityAccentForeground);

  }, [theme, systemTheme, themePreference, activityStatus, isMounted, gradientEnabled]);


  useEffect(() => {
    const storedThemePreference = localStorage.getItem('themePreference') as ThemePreference | null;
    if (storedThemePreference && ['dynamic', 'daylight', 'night'].includes(storedThemePreference)) {
      setThemePreference(storedThemePreference);
    } else {
      setThemePreference('dynamic'); 
    }
    const storedGradientPref = localStorage.getItem('gradientEnabled');
    if (storedGradientPref !== null) {
        setGradientEnabled(JSON.parse(storedGradientPref));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      updateThemeVariables();
    }
  }, [isMounted, updateThemeVariables]);


  useEffect(() => {
    if(isMounted && currentUser && db) { 
      localStorage.setItem('themePreference', themePreference);
      updateThemeVariables(); 
      updateDoc(doc(db, "users", currentUser.uid), { themePref: themePreference });
    }
  }, [themePreference, isMounted, currentUser, updateThemeVariables, db]);

  useEffect(() => {
    if(isMounted && currentUser && db) {
        localStorage.setItem('gradientEnabled', JSON.stringify(gradientEnabled));
        updateThemeVariables();
        updateDoc(doc(db, "users", currentUser.uid), { enableGradient: gradientEnabled });
    }
  }, [gradientEnabled, isMounted, currentUser, updateThemeVariables, db]);


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
      setConnectionStatus({ message: `Recording at ${recordingSettingsForm.getValues("fps")}`, type: 'info', icon: <PlayCircle className="h-4 w-4 text-red-500 animate-pulse" /> });
      timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (activityStatus === 'recording') {
        setActivityStatus('idle');
        setConnectionStatus(null);
      }
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording, activityStatus, recordingSettingsForm]);


  useEffect(() => {
    if(isMounted && currentUser && storage) { 
        if (recordingSettingsForm.getValues("storagePreference") === "cloud") {
            fetchCloudRecordings();
        } else {
            const localRecordings = localStorage.getItem(`recentRecordings_${currentUser.uid}`);
            if (localRecordings) {
                setRecentRecordings(JSON.parse(localRecordings));
            } else {
                 setRecentRecordings([
                    { id: 'rec_local_1', name: 'Local Demo.mp4', timestamp: new Date(Date.now() - 3600000).toLocaleString(), thumbnailUrl: `https://picsum.photos/seed/local1/120/80`, duration: "05:32", "data-ai-hint": "local demo" },
                ]);
            }
        }
    } else if (isMounted && !currentUser) { 
        setRecentRecordings([]);
    }
  }, [isMounted, currentUser, recordingSettingsForm.getValues("storagePreference"), storage]);


  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setAuthLoading(true);
    try {
      await setPersistence(auth, values.rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      if (!userCredential.user.emailVerified) {
        setEmailForVerification(userCredential.user.email);
        setAuthView('emailVerification');
        toast({ title: "Email Not Verified", description: "Please check your email to verify your account.", variant: "destructive" });
      } else {
        await updateDoc(doc(db, "users", userCredential.user.uid), {
          lastLoginTime: Timestamp.now(),
          deviceType: navigator.userAgent, 
        });
        toast({ title: "Login Successful", description: `Welcome back!` });
      }
    } catch (error: any) {
      toast({ title: "Login Failed", description: getFirebaseErrorMessage(error), variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await sendEmailVerification(userCredential.user);
      
      const newUserProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        username: values.username,
        profilePictureUrl: `https://avatar.vercel.sh/${values.email}.png`, 
        deviceType: navigator.userAgent,
        lastLoginTime: Timestamp.now(),
        themePref: 'dynamic', 
        enableGradient: true, 
      };
      await setDoc(doc(db, "users", userCredential.user.uid), newUserProfile);

      setEmailForVerification(values.email);
      setAuthView('emailVerification');
      toast({ title: "Signup Successful", description: "Verification email sent. Please check your inbox." });
    } catch (error: any) {
      toast({ title: "Signup Failed", description: getFirebaseErrorMessage(error), variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async (values: z.infer<typeof passwordResetSchema>) => {
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({ title: "Password Reset Email Sent", description: "Check your email for instructions." });
      setAuthView('login');
    } catch (error: any) {
      toast({ title: "Password Reset Failed", description: getFirebaseErrorMessage(error), variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      toast({ title: "Logout Failed", description: getFirebaseErrorMessage(error), variant: "destructive" });
    }
  };

  const resendVerificationEmail = async () => {
    setAuthLoading(true);
    const userToVerify = auth.currentUser || (emailForVerification ? { email: emailForVerification } as FirebaseUser : null) ;

    if (userToVerify && userToVerify.email) { // Check if email exists
        if(auth.currentUser && !auth.currentUser.emailVerified) { // If user is currently signed in but not verified
             try {
                await sendEmailVerification(auth.currentUser);
                toast({ title: "Verification Email Resent", description: "Please check your inbox." });
            } catch (error: any) {
                toast({ title: "Error Resending Email", description: getFirebaseErrorMessage(error), variant: "destructive" });
            }
        } else if (!auth.currentUser && emailForVerification) { // User was never fully logged in, likely from failed attempt
             toast({ title: "Action Required", description: "Please try logging in again. If verification is still needed, the system will guide you.", variant: "destructive"});
        } else {
            toast({ title: "Email Already Verified or User Issue", description: "Your email might already be verified, or there's an issue. Try logging in.", variant: "destructive"});
        }
    } else {
        toast({ title: "Cannot Resend", description: "No email address found to resend verification. Please try signing in or signing up again.", variant: "destructive"});
    }
    setAuthLoading(false);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleConnect = (values: z.infer<typeof recordingSettingsSchema>) => {
    setIsConnecting(true);
    setActivityStatus('connecting');
    setConnectionStatus({ message: "Connecting to remote device...", type: 'info', icon: <Loader2 className="h-4 w-4 animate-spin" /> });
    console.log("Attempting to connect with:", values);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setActivityStatus('idle');
      setConnectionStatus({ message: `Connected via ${values.connectionType}`, type: 'success', icon: <CheckCircle2 className="text-green-500" /> });
      toast({
        title: "Connected Successfully!",
        description: `Connected via ${values.connectionType}. You can now control the remote device.`,
        action: <CheckCircle2 className="text-green-500" />,
      });
      setCurrentTab("control");
      if (currentUser) pairDevices(currentUser.uid, `device_B_uuid_${Date.now()}`);
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsRecording(false); 
    setActivityStatus('idle');
    setConnectionStatus({ message: "Disconnected", type: 'error', icon: <AlertTriangle className="text-yellow-500"/> });
    toast({
      title: "Disconnected",
      description: "Successfully disconnected from the remote device.",
      variant: "destructive",
      action: <AlertTriangle className="text-yellow-500" />,
    });
  };

  const uploadRecording = async (file: File, recordingName: string): Promise<string | null> => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload recordings.", variant: "destructive" });
      return null;
    }
    setActivityStatus('syncing');
    setConnectionStatus({ message: "Uploading recording...", type: 'info', icon: <CloudUpload className="h-4 w-4 animate-pulse" /> });
    try {
      const storageRef = ref(storage, `recordings/${currentUser.uid}/${recordingName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setActivityStatus('idle');
      setConnectionStatus({ message: "Upload complete!", type: 'success', icon: <CheckCircle2 className="text-green-500"/> });
      toast({ title: "Upload Successful", description: "Recording saved to cloud." });
      return downloadURL;
    } catch (error: any) {
      setActivityStatus('idle');
      setConnectionStatus({ message: "Upload failed.", type: 'error', icon: <AlertTriangle className="text-red-500"/> });
      toast({ title: "Upload Failed", description: getFirebaseErrorMessage(error), variant: "destructive" });
      return null;
    }
  };
  
  const fetchCloudRecordings = async () => {
    if (!currentUser || !storage) return;
    setActivityStatus('syncing');
    setConnectionStatus({ message: "Fetching cloud recordings...", type: 'info', icon: <Loader2 className="h-4 w-4 animate-spin"/> });
    try {
      const recordingsRef = ref(storage, `recordings/${currentUser.uid}/`);
      const result = await listAll(recordingsRef);
      const fetchedRecordings: RecentRecording[] = await Promise.all(
        result.items.map(async (itemRef) => {
          const downloadUrl = await getDownloadURL(itemRef);
          return {
            id: itemRef.name,
            name: itemRef.name,
            timestamp: new Date().toLocaleString(), 
            thumbnailUrl: `https://picsum.photos/seed/${itemRef.name}/120/80`, 
            downloadUrl,
            duration: "00:00", 
            "data-ai-hint": "cloud recording"
          };
        })
      );
      setRecentRecordings(fetchedRecordings);
      setActivityStatus('idle');
      setConnectionStatus(null);
    } catch (error: any) {
      setActivityStatus('idle');
      setConnectionStatus({ message: "Failed to fetch recordings.", type: 'error', icon: <AlertTriangle className="text-red-500"/> });
      toast({ title: "Error Fetching Recordings", description: getFirebaseErrorMessage(error), variant: "destructive" });
    }
  };


  const handleStartRecording = async () => {
    setIsRecording(true);
    const now = new Date();
    const recordingName = `Recording_${now.toISOString().replace(/[:.]/g, '-')}.mp4`;
    
    let thumbnailUrl = `https://picsum.photos/120/80?random=${Math.floor(Math.random() * 100)}`;
    let downloadUrl: string | undefined = undefined;

    if (recordingSettingsForm.getValues("storagePreference") === "cloud" && currentUser && storage) {
      const blob = new Blob(["Simulated video content for demo purposes."], { type: "video/mp4" }); // Dummy content
      const dummyFile = new File([blob], recordingName, { type: "video/mp4" });
      const cloudUrl = await uploadRecording(dummyFile, recordingName);
      if (cloudUrl) {
          downloadUrl = cloudUrl;
      } else {
          // Handle upload failure: maybe switch to local or notify user
          toast({title: "Cloud Upload Failed", description: "Recording will be saved locally if possible.", variant: "destructive"});
          recordingSettingsForm.setValue("storagePreference", "local"); // Switch to local as fallback
      }
    }

    const newRecording: RecentRecording = {
      id: `rec_${now.getTime()}`,
      name: recordingName,
      timestamp: now.toLocaleString(),
      thumbnailUrl,
      downloadUrl,
      duration: "00:00",
      "data-ai-hint": "new recording"
    };

    setRecentRecordings(prev => {
        const updated = [newRecording, ...prev.slice(0,4)];
        if (currentUser && recordingSettingsForm.getValues("storagePreference") === "local") {
            localStorage.setItem(`recentRecordings_${currentUser.uid}`, JSON.stringify(updated));
        }
        return updated;
    });

    toast({
      title: "Recording Started",
      description: `Resolution: ${recordingSettingsForm.getValues("resolution")}, FPS: ${recordingSettingsForm.getValues("fps")}`,
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
      if (currentUser && recordingSettingsForm.getValues("storagePreference") === "local") {
        localStorage.setItem(`recentRecordings_${currentUser.uid}`, JSON.stringify(updatedRecordings));
      }
      return updatedRecordings;
    });
    toast({
      title: "Recording Stopped",
      description: `Recording saved to ${recordingSettingsForm.getValues("storagePreference")}. Duration: ${formatTime(recordingTime)}`,
      action: <Save className="text-primary" />
    });
    setRecordingTime(0);
  };
  
  const deleteRecording = async (id: string, name: string) => {
    if (recordingSettingsForm.getValues("storagePreference") === "cloud" && currentUser && storage) {
        try {
            const recordingRef = ref(storage, `recordings/${currentUser.uid}/${name}`);
            await deleteObject(recordingRef);
            toast({ title: "Cloud Recording Deleted", description: "The recording has been removed from Firebase Storage." });
        } catch (error: any) {
            toast({ title: "Cloud Deletion Failed", description: getFirebaseErrorMessage(error), variant: "destructive" });
            return; 
        }
    }
    
    setRecentRecordings(prev => {
        const updated = prev.filter(rec => rec.id !== id);
        if (currentUser && recordingSettingsForm.getValues("storagePreference") === "local") {
            localStorage.setItem(`recentRecordings_${currentUser.uid}`, JSON.stringify(updated));
        }
        return updated;
    });

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

  const pairDevices = async (userId: string, deviceBUuid: string) => {
    if (!currentUser || !db) return;
    try {
        await addDoc(collection(db, "paired_devices"), {
            deviceA_uid: userId, 
            deviceB_uuid: deviceBUuid, 
            pairedAt: Timestamp.now(),
            status: "pending_confirmation", 
            deviceA_info: { os: navigator.platform, model: "Web Browser" },
        });
        toast({ title: "Pairing Initiated", description: "Waiting for Device B to confirm." });
    } catch (error: any) {
        toast({ title: "Pairing Failed", description: getFirebaseErrorMessage(error), variant: "destructive" });
    }
  };

  const ConnectionIcon = ({ type }: { type: string }) => {
    const iconClasses = "mr-2 h-5 w-5 text-primary transition-colors duration-600 ease-in-out-cubic";
    if (type === 'wifi') return <Wifi className={iconClasses} />;
    if (type === 'bluetooth') return <Bluetooth className={iconClasses} />;
    if (type === 'usb') return <Usb className={iconClasses} />;
    if (type === 'lan') return <Link2 className={iconClasses} />;
    return <RadioTower className={iconClasses} />;
  };

  const onboardingSteps = [
    { title: "Welcome to DualCast!", description: "Let's quickly show you around.", icon: <HelpCircle className="h-12 w-12 text-primary mb-4" /> },
    { title: "Pairing Devices", description: "Use the 'Connect' tab to pair with another device using Wi-Fi, Bluetooth, USB, or LAN.", icon: <RadioTower className="h-12 w-12 text-primary mb-4" /> },
    { title: "Controlling Recordings", description: "Once connected, the 'Control' tab lets you set resolution, FPS, and start/stop recording.", icon: <MonitorSmartphone className="h-12 w-12 text-primary mb-4" /> },
    { title: "Live Display & Settings", description: "View the live screen in 'Display' and manage recordings or app settings in 'Settings'. Access all via menu on larger screens.", icon: <Settings className="h-12 w-12 text-primary mb-4" /> },
  ];

  const nextOnboardingStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(prev => prev + 1);
    } else {
      setShowOnboarding(false);
      setOnboardingStep(0); 
      if(currentUser) localStorage.setItem(`onboarding_complete_${currentUser.uid}`, 'true');
    }
  };

  useEffect(() => {
    const checkAppVersion = async () => {
      try {
        await fetchAndActivate(remoteConfig);
        const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"; 
        const latestVersion = getString(remoteConfig, "latest_app_version");
        const forceUpdateBelowVersion = getString(remoteConfig, "force_update_below_version");
        const updateMessage = getString(remoteConfig, "update_message");

        if (latestVersion && appVersion < latestVersion) {
          const mustForceUpdate = forceUpdateBelowVersion ? appVersion < forceUpdateBelowVersion : false;
          setUpdateInfo({ version: latestVersion, forceUpdate: mustForceUpdate, message: updateMessage || `A new version (${latestVersion}) is available. Please update for the best experience.` });
          setShowUpdatePrompt(true);
        }
      } catch (err: any) {
        console.error("Error checking/fetching remote config for update:", err);
        toast({title: "Failed to fetch app update information", description: getFirebaseErrorMessage(err), variant: "destructive"});
      }
    };

    if (isMounted && remoteConfig) {
      checkAppVersion();
    }
  }, [isMounted, toast, remoteConfig]);

  const exportLogs = () => {
    const dummyLogs = [
      { timestamp: new Date().toISOString(), level: "INFO", message: "App started" },
      { timestamp: new Date().toISOString(), level: "DEBUG", message: `User theme preference: ${themePreference}` },
      { timestamp: new Date().toISOString(), level: "ERROR", message: "Simulated connection error to device XYZ" },
      currentUser ? {timestamp: new Date().toISOString(), level: "INFO", message: `User: ${currentUser.email}`} : {timestamp: new Date().toISOString(), level: "INFO", message: "No user logged in"},
      {timestamp: new Date().toISOString(), level: "DEBUG", message: `Gradient enabled: ${gradientEnabled}`}
    ];
    const logData = JSON.stringify(dummyLogs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dualcast_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Logs Exported", description: "Debug logs have been downloaded." });
  };
  
  const translations: Record<string, Record<string, string>> = {
      en: {
          connectTitle: "Connect Devices",
          connectDescription: "Establish a connection with another device.",
          controlTitle: "Remote Control",
          controlDescription: "Manage recording settings and actions.",
          displayTitle: "Live Display",
          displayDescription: "Real-time view from the connected device.",
          settingsTitle: "Settings",
          settingsDescription: "Manage app preferences and recordings.",
          welcomeToDualcast: "Welcome to DualCast",
          createAccount: "Create Account",
          resetPassword: "Reset Password",
          verifyYourEmail: "Verify Your Email",
      },
      hi: {
          connectTitle: "उपकरणों को कनेक्ट करें",
          connectDescription: "किसी अन्य डिवाइस के साथ कनेक्शन स्थापित करें।",
          controlTitle: "रिमोट कंट्रोल",
          controlDescription: "रिकॉर्डिंग सेटिंग्स और क्रियाएं प्रबंधित करें।",
          displayTitle: "लाइव डिस्प्ले",
          displayDescription: "कनेक्टेड डिवाइस से रीयल-टाइम दृश्य।",
          settingsTitle: "सेटिंग्स",
          settingsDescription: "ऐप प्राथमिकताएं और रिकॉर्डिंग प्रबंधित करें।",
          welcomeToDualcast: "डुअलकास्ट में आपका स्वागत है",
          createAccount: "अकाउंट बनाएं",
          resetPassword: "पासवर्ड रीसेट",
          verifyYourEmail: "अपना ईमेल सत्यापित करें",
      },
      mr: {
          connectTitle: "डिव्हाइस कनेक्ट करा",
          connectDescription: "दुसऱ्या डिव्हाइससोबत कनेक्शन स्थापित करा.",
          controlTitle: "रिमोट कंट्रोल",
          controlDescription: "रेकॉर्डिंग सेटिंग्ज आणि क्रिया व्यवस्थापित करा.",
          displayTitle: "थेट प्रदर्शन",
          displayDescription: "कनेक्ट केलेल्या डिव्हाइसवरून रिअल-टाइम दृश्य.",
          settingsTitle: "सेटिंग्ज",
          settingsDescription: "अॅप प्राधान्ये आणि रेकॉर्डिंग व्यवस्थापित करा.",
          welcomeToDualcast: "डुअलकास्टमध्ये आपले स्वागत आहे",
          createAccount: "खाते तयार करा",
          resetPassword: "पासवर्ड रीसेट करा",
          verifyYourEmail: "तुमचा ईमेल सत्यापित करा",
      }
  };
  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  };
  
  if (!isMounted) {
    return <div className="flex flex-col min-h-screen items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>; 
  }
  
  if (!currentUser || !currentUser.emailVerified) {
    return (
      <div className={cn("flex flex-col min-h-screen items-center justify-center bg-background text-foreground p-4 transition-colors duration-600 ease-in-out-cubic", gradientEnabled ? "dynamic-gradient-background": "")}>
        <Card className="w-full max-w-md shadow-2xl backdrop-blur-lg bg-card/70 border-border">
          <CardHeader>
            <CardTitle className={cn("text-3xl font-bold text-center", gradientEnabled && "dynamic-gradient-text")}>
              {authView === 'login' && t("welcomeToDualcast")}
              {authView === 'signup' && t("createAccount")}
              {authView === 'resetPassword' && t("resetPassword")}
              {authView === 'emailVerification' && t("verifyYourEmail")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authView === 'login' && (
              
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={loginForm.control} name="rememberMe" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal">Remember Me</FormLabel>
                    </FormItem>
                  )} />
                  <Button type="submit" className={cn("w-full", gradientEnabled && "dynamic-gradient-background")} disabled={authLoading}>
                    {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                  </Button>
                  <p className="text-center text-sm">
                    <Button variant="link" onClick={() => setAuthView('resetPassword')}>Forgot password?</Button>
                  </p>
                </form>
              </Form>
              
            )}
            {authView === 'signup' && (
               
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <FormField control={signupForm.control} name="username" render={({ field }) => (
                    <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="Your Username" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signupForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signupForm.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel>
                     <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className={cn("w-full", gradientEnabled && "dynamic-gradient-background")} disabled={authLoading}>
                    {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Account
                  </Button>
                </form>
              </Form>
              
            )}
            {authView === 'resetPassword' && (
               
              <Form {...passwordResetForm}>
                <form onSubmit={passwordResetForm.handleSubmit(handlePasswordReset)} className="space-y-6">
                  <FormField control={passwordResetForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className={cn("w-full", gradientEnabled && "dynamic-gradient-background")} disabled={authLoading}>
                    {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send Reset Link
                  </Button>
                </form>
              </Form>
              
            )}
            {authView === 'emailVerification' && (
                <div className="space-y-6 text-center">
                    <p>A verification link has been sent to <strong>{emailForVerification || auth?.currentUser?.email}</strong>.</p>
                    <p>Please check your inbox (and spam folder) and click the link to activate your account.</p>
                    <Button onClick={resendVerificationEmail} className={cn("w-full", gradientEnabled && "dynamic-gradient-background")} disabled={authLoading}>
                        {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Resend Verification Email
                    </Button>
                    <Button variant="link" onClick={() => {signOut(auth); setAuthView('login');}}>Back to Login</Button>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            {authView === 'login' && (
              <p className="text-sm">Don't have an account? <Button variant="link" onClick={() => setAuthView('signup')}>Sign up</Button></p>
            )}
            {(authView === 'signup' || authView === 'resetPassword') && (
              <p className="text-sm">Already have an account? <Button variant="link" onClick={() => setAuthView('login')}>Login</Button></p>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }


  const getCardDynamicClass = () => {
    switch(activityStatus) {
      case 'recording': return 'card-recording-active';
      case 'playback': return 'card-playback-active';
      case 'connecting': return 'card-connecting-active animate-pulse'; 
      case 'syncing': return 'card-syncing-active animate-pulse'; 
      case 'idle': return 'card-idle-dim';
      default: return '';
    }
  };

  const getButtonDynamicClass = (buttonType: 'start' | 'stop' | 'other') => {
    if (activityStatus === 'recording' && buttonType === 'start') return 'button-recording-active';
    return '';
  };


  return (
    
    <FormProvider {...recordingSettingsForm}>
    <div className={cn("flex flex-col min-h-screen bg-background text-foreground transition-colors duration-600 ease-in-out-cubic", gradientEnabled && "dynamic-gradient-background")}>
      <AppHeader 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        userProfile={userProfile} 
        onLogout={handleLogout}
      />

      {connectionStatus && (
          <div className={cn(
              "fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 p-3 rounded-lg shadow-xl text-sm flex items-center space-x-2 transition-all duration-500 ease-in-out-cubic",
              "bg-card/80 backdrop-blur-md border", 
              connectionStatus.type === 'success' && "text-green-700 dark:text-green-400 border-green-500/50",
              connectionStatus.type === 'error' && "text-red-700 dark:text-red-400 border-red-500/50",
              connectionStatus.type === 'warning' && "text-yellow-700 dark:text-yellow-400 border-yellow-500/50",
              connectionStatus.type === 'info' && "text-primary-foreground border-primary/50",
          )}>
              {connectionStatus.icon || (
                connectionStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5"/> :
                connectionStatus.type === 'error' ? <AlertTriangle className="h-5 w-5"/> :
                connectionStatus.type === 'warning' ? <AlertTriangle className="h-5 w-5"/> :
                <Info className="h-5 w-5"/> 
              )}
              <span>{connectionStatus.message}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => setConnectionStatus(null)}>
                  <X className="h-4 w-4"/>
              </Button>
          </div>
      )}

       {showOnboarding && (
        <Dialog open={showOnboarding} onOpenChange={(open) => { if(!open) {setShowOnboarding(false); setOnboardingStep(0); if(currentUser) localStorage.setItem(`onboarding_complete_${currentUser.uid}`, 'true'); }}}>
          <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-lg border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center">
                {onboardingSteps[onboardingStep].icon}
                <span className="ml-2">{onboardingSteps[onboardingStep].title}</span>
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                {onboardingSteps[onboardingStep].description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button onClick={nextOnboardingStep} className={cn("w-full", gradientEnabled && "dynamic-gradient-background")}>
                {onboardingStep < onboardingSteps.length - 1 ? "Next" : "Got it!"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showUpdatePrompt && updateInfo && (
        <Dialog open={showUpdatePrompt} onOpenChange={setShowUpdatePrompt}>
          <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-lg border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">App Update Available</DialogTitle>
              <DialogDescription className="text-center pt-2">
                {updateInfo.message} (New Version: {updateInfo.version})
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2">
              {!updateInfo.forceUpdate && (
                <Button variant="outline" onClick={() => setShowUpdatePrompt(false)}>Later</Button>
              )}
              <Button onClick={() => { window.open("https://play.google.com/store/apps/details?id=your.app.id", "_blank"); }} className={cn("flex-1", gradientEnabled && "dynamic-gradient-background")}>
                Update Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}


      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full max-w-3xl">
         { (isMobile === true || (isMobile === null && !isConnected)) && (
            <TabsList className={cn("grid w-full mb-8 transition-all duration-500 ease-in-out-cubic", "grid-cols-2 md:grid-cols-4")}>
              <TabsTrigger value="connection" className="transition-all duration-300 ease-in-out-cubic"><RadioTower className="mr-1 md:mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />{t('connectTitle')}</TabsTrigger>
              <TabsTrigger value="control" disabled={!isConnected} className="transition-all duration-300 ease-in-out-cubic"><MonitorSmartphone className="mr-1 md:mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />{t('controlTitle')}</TabsTrigger>
              <TabsTrigger value="display" disabled={!isConnected} className="transition-all duration-300 ease-in-out-cubic"><Video className="mr-1 md:mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />{t('displayTitle')}</TabsTrigger>
              <TabsTrigger value="settings" className="transition-all duration-300 ease-in-out-cubic"><Settings className="mr-1 md:mr-2 h-4 w-4 text-primary transition-colors duration-600 ease-in-out-cubic" />{t('settingsTitle')}</TabsTrigger>
            </TabsList>
          )}


          <TabsContent value="connection">
            <Card className={cn("w-full", getCardDynamicClass())}>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">{t('connectTitle')}</CardTitle>
                <CardDescription>
                  {isConnected ? "Connected to a device. You can now proceed to control." : t('connectDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="text-center space-y-4">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                    <p className="text-lg text-foreground mb-4">Successfully connected!</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => setCurrentTab("control")} className={cn("mr-2 transition-all duration-300 ease-in-out-cubic active:scale-95", gradientEnabled && "dynamic-gradient-background")}>
                        Go to Control Panel
                        </Button>
                        <Button variant="destructive" onClick={handleDisconnect} className="transition-all duration-300 ease-in-out-cubic active:scale-95">
                        Disconnect
                        </Button>
                    </div>
                  </div>
                ) : (
                <Form {...recordingSettingsForm}>
                  <form onSubmit={recordingSettingsForm.handleSubmit(handleConnect)} className="space-y-6">
                    <FormField
                      control={recordingSettingsForm.control}
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

                    {recordingSettingsForm.watch("connectionType") === 'lan' && (
                      <FormField
                        control={recordingSettingsForm.control}
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
                     {(recordingSettingsForm.watch("connectionType") === 'wifi' || recordingSettingsForm.watch("connectionType") === 'bluetooth') && (
                      <FormField
                        control={recordingSettingsForm.control}
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
                    
                    <Button type="submit" className={cn("w-full transition-all duration-500 ease-in-out-cubic active:scale-95", gradientEnabled && "dynamic-gradient-background")} size="lg" disabled={isConnecting}>
                      {isConnecting ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <ConnectionIcon type={recordingSettingsForm.getValues("connectionType")} />
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
                <CardTitle className="text-3xl font-bold">{t('controlTitle')}</CardTitle>
                <CardDescription>{t('controlDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...recordingSettingsForm}>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={recordingSettingsForm.control}
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
                        control={recordingSettingsForm.control}
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
                        control={recordingSettingsForm.control}
                        name="storagePreference"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Save Recording To</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    if(value === 'cloud' && currentUser && storage) fetchCloudRecordings();
                                }}
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
                <CardTitle className="text-3xl font-bold">{t('displayTitle')}</CardTitle>
                <CardDescription>{t('displayDescription')}</CardDescription>
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
                    Resolution: {recordingSettingsForm.getValues("resolution")} | FPS: {recordingSettingsForm.getValues("fps")}
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
                                    <Image src={rec.thumbnailUrl || "https://picsum.photos/120/80"} data-ai-hint={rec["data-ai-hint"] || "video thumbnail"} alt={rec.name} width={60} height={40} className="rounded-md object-cover" />
                                    <div>
                                    <p className="font-medium text-sm">{rec.name}</p>
                                    <p className="text-xs text-muted-foreground">{rec.timestamp} &bull; {rec.duration}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    {rec.downloadUrl && (
                                        <Button variant="ghost" size="icon" onClick={() => window.open(rec.downloadUrl, '_blank')} aria-label="Download recording" className="transition-transform duration-200 ease-in-out-cubic active:scale-90">
                                            <Download className="h-5 w-5 text-primary transition-colors duration-600 ease-in-out-cubic" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => simulatePlayback(rec.name)} aria-label="Play recording" className="transition-transform duration-200 ease-in-out-cubic active:scale-90">
                                        <PlayCircle className="h-5 w-5 text-primary transition-colors duration-600 ease-in-out-cubic" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteRecording(rec.id, rec.name)} aria-label="Delete recording" className="transition-transform duration-200 ease-in-out-cubic active:scale-90">
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
                            <p className="text-sm text-muted-foreground">Start recording or check cloud storage settings.</p>
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
                      
                      <Separator />
                       <div className="flex items-center justify-between">
                            <Label htmlFor="gradient-toggle" className="text-base">
                                Enable Gradient Effects
                            </Label>
                            <Switch
                                id="gradient-toggle"
                                checked={gradientEnabled}
                                onCheckedChange={setGradientEnabled}
                            />
                        </div>
                        <Separator />
                        <div>
                            <Label className="text-base flex items-center"><Languages className="mr-2 h-5 w-5"/>Language</Label>
                            <p className="text-sm text-muted-foreground mb-3">
                                Select your preferred language for the app. (UI will update on next interaction)
                            </p>
                            <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover/80 backdrop-blur-md">
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                                    <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                         <Separator />
                        <div className="space-y-2">
                            <Button variant="outline" onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className="w-full">
                                {showAdvancedSettings ? "Hide" : "Show"} Advanced Settings
                            </Button>
                            {showAdvancedSettings && (
                                <div className="p-4 border rounded-md mt-2 space-y-4 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="debug-log-export" className="text-base flex items-center">
                                            <FileText className="mr-2 h-5 w-5"/> Debug Log
                                        </Label>
                                        <Button id="debug-log-export" onClick={exportLogs} variant="secondary" size="sm">
                                            Export Logs
                                        </Button>
                                    </div>
                                     <p className="text-xs text-muted-foreground">This will download a JSON file with application logs for troubleshooting.</p>
                                </div>
                            )}
                        </div>


                    </CardContent>
                </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t transition-colors duration-600 ease-in-out-cubic">
        © {new Date().getFullYear()} DualCast. All rights reserved. Powered by Firebase.
      </footer>
    </div>
    </FormProvider>
    
  );
}
const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address."),
});


const recordingSettingsSchema = z.object({
  connectionType: z.string().min(1, "Please select a connection type."),
  pinOrIp: z.string().optional(),
  resolution: z.string().min(1, "Please select a resolution."),
  fps: z.string().min(1, "Please select a frame rate."),
  storagePreference: z.enum(["cloud", "local"]).default("cloud"),
});
