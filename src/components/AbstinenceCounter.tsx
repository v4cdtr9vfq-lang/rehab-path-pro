import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { AddAddictionDialog } from "./AddAddictionDialog";
import { toast } from "sonner";

interface Addiction {
  id: string;
  addiction_type: string;
  start_date: string;
  is_active: boolean;
}

interface CounterProps {
  startDate?: Date;
}

export function AbstinenceCounter({ startDate }: CounterProps) {
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [count, setCount] = useState({
    years: 0,
    months: 0,
    days: 0
  });
  useEffect(() => {
    fetchAddictions();
  }, []);

  useEffect(() => {
    const currentStartDate = getCurrentStartDate();
    if (currentStartDate) {
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
        
        setCount({
          years,
          months,
          days
        });
      };
      calculateTime();
      const interval = setInterval(calculateTime, 1000 * 60 * 60);
      return () => clearInterval(interval);
    }
  }, [addictions, selectedIndex, startDate]);

  const fetchAddictions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("addictions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAddictions(data || []);
    } catch (error) {
      console.error("Error fetching addictions:", error);
    }
  };

  const getCurrentStartDate = (): Date | null => {
    if (addictions.length > 0 && addictions[selectedIndex]) {
      return new Date(addictions[selectedIndex].start_date);
    }
    return startDate || null;
  };

  const handleAddAddiction = () => {
    if (addictions.length >= 3) {
      toast.error("Máximo 3 adicciones permitidas");
      return;
    }
    setShowAddDialog(true);
  };

  const handleAddSubmit = async (addictionType: string, startDate: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("addictions")
        .insert({
          user_id: user.id,
          addiction_type: addictionType,
          start_date: startDate.toISOString(),
          is_active: true,
        });

      if (error) throw error;
      
      toast.success("Adicción añadida correctamente");
      fetchAddictions();
    } catch (error) {
      console.error("Error adding addiction:", error);
      toast.error("No se pudo añadir la adicción");
    }
  };

  const currentAddiction = addictions[selectedIndex];
  return (
    <>
      <div className="rounded-3xl p-8 md:p-12 bg-card border border-sidebar-border relative">
        <div className="flex items-start justify-between mb-8">
          <p className="text-foreground text-2xl font-bold text-left">
            Tiempo de recuperación:{" "}
            {currentAddiction && (
              <span className="text-lg font-normal text-muted-foreground">
                {currentAddiction.addiction_type}
              </span>
            )}
          </p>
          
          <div className="flex items-center gap-2">
            {addictions.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  selectedIndex === index
                    ? "bg-destructive text-white"
                    : "bg-background border-2 border-destructive text-destructive hover:bg-destructive/10"
                }`}
              >
                {index + 1}
              </button>
            ))}
            {addictions.length < 3 && (
              <button
                onClick={handleAddAddiction}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-background border-2 border-destructive text-white hover:bg-destructive/10 transition-all"
              >
                <Plus className="h-4 w-4 text-destructive" />
              </button>
            )}
          </div>
        </div>

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