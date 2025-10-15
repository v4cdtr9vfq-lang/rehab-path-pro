import { useEffect, useState } from "react";

interface CounterProps {
  startDate: Date;
}

export function AbstinenceCounter({ startDate }: CounterProps) {
  const [count, setCount] = useState({ years: 0, months: 0, days: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const years = Math.floor(days / 365);
      const months = Math.floor((days % 365) / 30);
      const remainingDays = days % 30;
      
      setCount({ years, months, days: remainingDays });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000 * 60 * 60); // Update every hour
    
    return () => clearInterval(interval);
  }, [startDate]);

  return (
    <div className="rounded-2xl p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
      <p className="text-center text-foreground/80 text-lg mb-6">I've been abstinent for</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-6xl font-bold text-primary mb-2">{count.years}</div>
          <div className="text-sm uppercase tracking-wider text-muted-foreground">Years</div>
        </div>
        <div className="text-center">
          <div className="text-6xl font-bold text-primary mb-2">{count.months}</div>
          <div className="text-sm uppercase tracking-wider text-muted-foreground">Months</div>
        </div>
        <div className="text-center">
          <div className="text-6xl font-bold text-primary mb-2">{count.days}</div>
          <div className="text-sm uppercase tracking-wider text-muted-foreground">Days</div>
        </div>
      </div>
    </div>
  );
}
