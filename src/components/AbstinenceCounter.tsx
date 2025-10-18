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
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const years = Math.floor(days / 365);
      const months = Math.floor(days % 365 / 30);
      const remainingDays = days % 30;
      setCount({
        years,
        months,
        days: remainingDays
      });
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [startDate]);
  return <div className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-sky-blue/10 to-transparent border border-sky-blue/30">
      <p className="text-sky-blue text-base mb-8">Soy libre desde hace:</p>
      <div className="grid grid-cols-3 gap-6 md:gap-8">
        <div className="text-center">
          <div className="text-7xl md:text-8xl font-bold text-sky-blue mb-3 tracking-tight">{count.years}</div>
          <div className="text-sm uppercase tracking-widest text-sky-blue/80 font-medium">Años</div>
        </div>
        <div className="text-center">
          <div className="text-7xl md:text-8xl font-bold text-sky-blue mb-3 tracking-tight">{count.months}</div>
          <div className="text-sm uppercase tracking-widest text-sky-blue/80 font-medium">Meses</div>
        </div>
        <div className="text-center">
          <div className="text-7xl md:text-8xl font-bold text-sky-blue mb-3 tracking-tight">{count.days}</div>
          <div className="text-sm uppercase tracking-widest text-sky-blue/80 font-medium">Días</div>
        </div>
      </div>
    </div>;
}