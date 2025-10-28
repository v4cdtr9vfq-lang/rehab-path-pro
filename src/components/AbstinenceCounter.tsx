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
      <p className="text-foreground text-2xl font-bold mb-8 text-left">Tiempo de recuperación</p>
      <div className="flex items-center justify-center gap-2 md:gap-3">
        {/* Years */}
        <div className="flex items-center gap-1">
          <div className="bg-black/40 border-2 border-amber-500/30 rounded-lg px-4 py-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
            <span className="text-6xl md:text-7xl font-mono font-bold text-amber-400 tracking-wider" style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }}>
              {count.years}
            </span>
          </div>
          <div className="bg-black/40 border-2 border-amber-500/30 rounded-lg px-3 py-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
            <span className="text-4xl md:text-5xl font-mono font-bold text-amber-400/80">A</span>
          </div>
        </div>
        
        {/* Months */}
        <div className="flex items-center gap-1">
          <div className="bg-black/40 border-2 border-amber-500/30 rounded-lg px-4 py-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
            <span className="text-6xl md:text-7xl font-mono font-bold text-amber-400 tracking-wider" style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }}>
              {count.months}
            </span>
          </div>
          <div className="bg-black/40 border-2 border-amber-500/30 rounded-lg px-3 py-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
            <span className="text-4xl md:text-5xl font-mono font-bold text-amber-400/80">M</span>
          </div>
        </div>
        
        {/* Days */}
        <div className="flex items-center gap-1">
          <div className="bg-black/40 border-2 border-amber-500/30 rounded-lg px-4 py-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
            <span className="text-6xl md:text-7xl font-mono font-bold text-amber-400 tracking-wider" style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }}>
              {count.days}
            </span>
          </div>
          <div className="bg-black/40 border-2 border-amber-500/30 rounded-lg px-3 py-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
            <span className="text-4xl md:text-5xl font-mono font-bold text-amber-400/80">D</span>
          </div>
        </div>
      </div>
    </div>;
}