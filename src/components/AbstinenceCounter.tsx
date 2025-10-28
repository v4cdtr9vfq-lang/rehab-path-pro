import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AddAddictionDialog } from "./AddAddictionDialog";
import { toast } from "sonner";
import { useAddictions } from "@/hooks/useAddictions";

interface CounterProps {
  startDate?: Date;
}

export function AbstinenceCounter({ startDate }: CounterProps) {
  const { addictions, addAddiction, canAddMore } = useAddictions();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [count, setCount] = useState({
    years: 0,
    months: 0,
    days: 0
  });

  // Reset selectedIndex if it's out of bounds
  useEffect(() => {
    if (selectedIndex >= addictions.length && addictions.length > 0) {
      setSelectedIndex(addictions.length - 1);
    }
  }, [addictions.length, selectedIndex]);

  const getCurrentStartDate = (): Date | null => {
    if (addictions.length > 0 && addictions[selectedIndex]) {
      return new Date(addictions[selectedIndex].start_date);
    }
    return startDate || null;
  };

  useEffect(() => {
    const currentStartDate = getCurrentStartDate();
    if (!currentStartDate) {
      setCount({ years: 0, months: 0, days: 0 });
      return;
    }
    
    const calculateTime = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth(), currentStartDate.getDate());
      
      const diff = today.getTime() - start.getTime();
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      const years = Math.floor(totalDays / 365);
      const daysAfterYears = totalDays % 365;
      const months = Math.floor(daysAfterYears / 30);
      const days = daysAfterYears % 30;
      
      setCount({ years, months, days });
    };
    
    calculateTime();
    const interval = setInterval(calculateTime, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [addictions.length, selectedIndex, startDate?.getTime()]);

  const handleAddAddiction = () => {
    if (!canAddMore) {
      toast.error("Máximo 3 adicciones permitidas");
      return;
    }
    setShowAddDialog(true);
  };

  const handleAddSubmit = (addictionType: string, startDate: Date) => {
    addAddiction({ addictionType, startDate });
    setShowAddDialog(false);
  };

  const currentAddiction = addictions[selectedIndex];
  return (
    <>
      <div className="rounded-3xl p-8 md:p-12 bg-card border border-sidebar-border relative">
        {/* Circles in top right corner */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {addictions.length === 0 ? (
            // Show default "1" circle when no addictions
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground cursor-default"
            >
              1
            </button>
          ) : (
            // Show all addiction circles with hover effect
            addictions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedIndex(index);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                  selectedIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border-2 border-primary text-primary-foreground hover:bg-primary"
                }`}
              >
                {index + 1}
              </button>
            ))
          )}
          {addictions.length < 3 && (
            <button
              onClick={handleAddAddiction}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-background border-2 border-primary hover:bg-primary transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-primary-foreground" />
            </button>
          )}
        </div>
        
        <p className="text-foreground text-2xl font-bold mb-8 text-left">
          Tiempo de recuperación:
        </p>

        <div className="flex items-center justify-center gap-4 md:gap-6">
          <div className="text-7xl md:text-8xl font-bold text-foreground tracking-tight">
            {count.years}<span className="ml-1">A</span>
          </div>
          <div className="text-7xl md:text-8xl font-bold text-foreground tracking-tight">
            {count.months}<span className="ml-1">M</span>
          </div>
          <div className="text-7xl md:text-8xl font-bold text-foreground tracking-tight">
            {count.days}<span className="ml-1">D</span>
          </div>
        </div>
      </div>

      <AddAddictionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddSubmit}
      />
    </>
  );
}