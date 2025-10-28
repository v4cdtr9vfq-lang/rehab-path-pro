import { useEffect, useState } from "react";
interface CounterProps {
  startDate: Date;
}
export function AbstinenceCounter({
  startDate
}: CounterProps) {
  const [count, setCount] = useState({
    years: 0,
    months: 0,
    days: 0
  });
  useEffect(() => {
    const calculateTime = () => {
      // Normalize both dates to midnight to count calendar days, not hours
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      
      const diff = today.getTime() - start.getTime();
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      const years = Math.floor(totalDays / 365);
      const daysAfterYears = totalDays % 365;
      const months = Math.floor(daysAfterYears / 30);
      const days = daysAfterYears % 30;
      
      setCount({
        years,
        months,
        days
      });
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [startDate]);
  return <div className="rounded-3xl p-8 md:p-12 bg-card border border-sidebar-border">
      <p className="text-foreground text-2xl font-bold mb-8 text-left">Soy libre desde hace:</p>
      <div className="flex items-center justify-center gap-4 md:gap-6">
        <div className="text-8xl md:text-9xl font-bold text-foreground tracking-tight">
          {count.years}<span className="text-5xl md:text-6xl ml-2">A</span>
        </div>
        <div className="text-8xl md:text-9xl font-bold text-foreground tracking-tight">
          {count.months}<span className="text-5xl md:text-6xl ml-2">M</span>
        </div>
        <div className="text-8xl md:text-9xl font-bold text-foreground tracking-tight">
          {count.days}<span className="text-5xl md:text-6xl ml-2">D</span>
        </div>
      </div>
    </div>;
}