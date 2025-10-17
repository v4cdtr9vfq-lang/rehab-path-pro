import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-7 w-[100px] items-center rounded-full bg-muted transition-colors hover:bg-muted/80"
      aria-label="Toggle theme"
    >
      {/* Sliding indicator */}
      <span
        className={`absolute h-5 w-[46px] rounded-full bg-foreground transition-transform duration-300 ease-in-out ${
          isLight ? "translate-x-[50px]" : "translate-x-1"
        }`}
      />
      
      {/* Lights label */}
      <span
        className={`relative z-10 flex-1 text-center text-[10px] font-medium transition-colors duration-300 ${
          !isLight ? "text-background" : "text-muted-foreground"
        }`}
      >
        Lights
      </span>
      
      {/* On label */}
      <span
        className={`relative z-10 flex-1 text-center text-[10px] font-medium transition-colors duration-300 ${
          isLight ? "text-background" : "text-muted-foreground"
        }`}
      >
        On
      </span>
    </button>
  );
}
