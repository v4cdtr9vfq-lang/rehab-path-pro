import { useEffect, useState } from "react";
import SunCalc from "suncalc";

export function useSolarTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const determineTheme = (latitude: number, longitude: number) => {
      const now = new Date();
      const times = SunCalc.getTimes(now, latitude, longitude);
      
      const currentTime = now.getTime();
      const sunrise = times.sunrise.getTime();
      const sunset = times.sunset.getTime();
      
      // Si está entre el amanecer y el atardecer, tema claro
      if (currentTime >= sunrise && currentTime <= sunset) {
        setTheme("light");
      } else {
        setTheme("dark");
      }
    };

    // Intentar obtener la ubicación del usuario
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          determineTheme(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Si no se puede obtener la ubicación, usar la hora local como fallback
          const hour = new Date().getHours();
          setTheme(hour >= 6 && hour < 20 ? "light" : "dark");
        }
      );
    } else {
      // Fallback: usar hora local
      const hour = new Date().getHours();
      setTheme(hour >= 6 && hour < 20 ? "light" : "dark");
    }
  }, []);

  useEffect(() => {
    // Aplicar el tema al elemento root
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return theme;
}
