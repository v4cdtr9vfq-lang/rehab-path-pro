import { useEffect, useState } from "react";

export function useSolarTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Siempre usar tema oscuro por defecto
    setTheme("dark");
  }, []);

  useEffect(() => {
    // Aplicar el tema al elemento root
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return theme;
}
