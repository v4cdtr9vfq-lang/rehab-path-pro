import { useEffect, useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { AddAddictionDialog } from "./AddAddictionDialog";
import { toast } from "sonner";
import { useAddictions } from "@/hooks/useAddictions";
import { supabase } from "@/integrations/supabase/client";

interface CounterProps {
  startDate?: Date;
  onAddictionChange?: (addictionId: string, days: number) => void;
}

export function AbstinenceCounter({ startDate, onAddictionChange }: CounterProps) {
  const { addictions, addAddiction } = useAddictions();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [rehabilitationType, setRehabilitationType] = useState<string | null>(null);

  // Load rehabilitation type from profile - ONCE
  useEffect(() => {
    let mounted = true;
    const loadRehabType = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('rehabilitation_type')
        .eq('user_id', user.id)
        .single();

      if (profile?.rehabilitation_type && mounted) {
        setRehabilitationType(profile.rehabilitation_type);
      }
    };
    loadRehabType();
    return () => { mounted = false; };
  }, []);

  // Combine original addiction with additional ones
  const allAddictions = useMemo(() => [
    ...(startDate ? [{
      id: 'original',
      addiction_type: rehabilitationType || 'Recuperación',
      start_date: startDate.toISOString(),
      isOriginal: true
    }] : []),
    ...addictions.map(a => ({ ...a, isOriginal: false }))
  ], [startDate, rehabilitationType, addictions]);

  const canAddMoreAddictions = addictions.length < 2;

  // Calculate count - pure function, no side effects
  const calculateCount = (addiction: any) => {
    const dateToUse = new Date(addiction.start_date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate());
    
    const diff = today.getTime() - start.getTime();
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(totalDays / 365);
    const daysAfterYears = totalDays % 365;
    const months = Math.floor(daysAfterYears / 30);
    const days = daysAfterYears % 30;
    
    return { years, months, days, totalDays };
  };

  // Get current addiction
  const currentAddiction = allAddictions[selectedIndex] || allAddictions[0];
  const count = currentAddiction ? calculateCount(currentAddiction) : { years: 0, months: 0, days: 0, totalDays: 0 };

  // Notify parent ONLY on mount and when selection changes
  useEffect(() => {
    if (!currentAddiction || !onAddictionChange) return;
    const { totalDays } = calculateCount(currentAddiction);
    onAddictionChange(currentAddiction.id, totalDays);
  }, [selectedIndex, currentAddiction?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset selectedIndex if out of bounds
  useEffect(() => {
    if (allAddictions.length > 0 && selectedIndex >= allAddictions.length) {
      setSelectedIndex(0);
    }
  }, [allAddictions.length]);

  const handleAddAddiction = () => {
    if (!canAddMoreAddictions) {
      toast.error("Máximo 3 adicciones permitidas");
      return;
    }
    setShowAddDialog(true);
  };

  const handleAddSubmit = (addictionType: string, startDate: Date) => {
    addAddiction({ addictionType, startDate });
    setShowAddDialog(false);
  };

  const handleCircleClick = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <>
      <div className="rounded-3xl p-8 md:p-12 bg-card border border-sidebar-border relative">
        {/* Title in top left corner */}
        <p className="absolute top-[22px] left-8 text-foreground text-xl md:text-2xl font-bold text-left">
          Tiempo limpio:
        </p>

        {/* Circles in top right corner */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {allAddictions.length === 0 ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">
              1
            </div>
          ) : (
            allAddictions.map((addiction, index) => (
              <button
                key={addiction.id}
                onClick={() => handleCircleClick(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  selectedIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border-2 border-primary text-foreground hover:bg-primary/20"
                }`}
              >
                {index + 1}
              </button>
            ))
          )}
          {canAddMoreAddictions && (
            <button
              onClick={handleAddAddiction}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-background border-2 border-primary hover:bg-primary/20 transition-all"
            >
              <Plus className="h-4 w-4 text-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 mt-8">
          <div className="text-5xl sm:text-6xl md:text-8xl font-bold text-foreground tracking-tight">
            {count.years}<span className="ml-1">A</span>
          </div>
          <div className="text-5xl sm:text-6xl md:text-8xl font-bold text-foreground tracking-tight">
            {count.months}<span className="ml-1">M</span>
          </div>
          <div className="text-5xl sm:text-6xl md:text-8xl font-bold text-foreground tracking-tight">
            {count.days}<span className="ml-1">D</span>
          </div>
        </div>
      </div>

      <AddAddictionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddSubmit}
        existingAddictions={[
          ...(rehabilitationType ? [rehabilitationType.toLowerCase()] : []),
          ...addictions.map(a => a.addiction_type.toLowerCase())
        ]}
      />
    </>
  );
}
