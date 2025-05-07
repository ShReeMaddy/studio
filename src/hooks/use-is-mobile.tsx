// src/hooks/use-is-mobile.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';

const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

export function useIsMobile(defaultState = false): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(defaultState);

  const checkDevice = useCallback(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return; // Guard against SSR
    }
    // Initial check
    checkDevice();

    window.addEventListener('resize', checkDevice);
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, [checkDevice]);

  return isMobile;
}
