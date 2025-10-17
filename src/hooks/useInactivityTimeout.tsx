import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useInactivityTimeout = (timeoutMinutes: number = 3) => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Tu sesión se cerró por inactividad",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const showWarning = () => {
    toast({
      title: "Cerrando sesión pronto",
      description: "Tu sesión se cerrará en 30 segundos por inactividad",
    });
  };

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Show warning 30 seconds before logout
    const warningTime = (timeoutMinutes * 60 - 30) * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      showWarning();
    }, warningTime);

    // Set new logout timer
    const timeoutMs = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  };

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Events to track user activity
      const events = [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
        'click',
      ];

      // Set initial timer
      resetTimer();

      // Add event listeners
      events.forEach((event) => {
        document.addEventListener(event, resetTimer);
      });

      // Cleanup
      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, resetTimer);
        });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }
      };
    };

    const cleanup = checkAuth();

    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, [timeoutMinutes]);
};
