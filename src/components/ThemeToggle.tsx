import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-[140px] items-center rounded-full bg-muted transition-colors hover:bg-muted/80"
      aria-label="Toggle theme"
    >
      {/* Sliding indicator */}
      <span
        className={`absolute h-7 w-[66px] rounded-full bg-foreground transition-transform duration-300 ease-in-out ${
          isLight ? "translate-x-[68px]" : "translate-x-1"
        }`}
      />
      
      {/* Off label */}
      <span
        className={`relative z-10 flex-1 text-center text-xs font-medium transition-colors duration-300 ${
          !isLight ? "text-background" : "text-muted-foreground"
        }`}
      >
        Off
      </span>
      
      {/* On label */}
      <span
        className={`relative z-10 flex-1 text-center text-xs font-medium transition-colors duration-300 ${
          isLight ? "text-background" : "text-muted-foreground"
        }`}
      >
        On
      </span>
    </button>
  );
}
