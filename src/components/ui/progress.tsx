import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  delay?: number;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, delay = 0, ...props }, ref) => {
  const [animatedValue, setAnimatedValue] = React.useState(0);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    if (!hasAnimated.current && value !== undefined) {
      hasAnimated.current = true;
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, 50 + delay);
      
      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary"
        style={{ 
          transform: `translateX(-${100 - animatedValue}%)`,
          transition: 'transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
