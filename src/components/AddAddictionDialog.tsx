import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AddAddictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddictionAdded: () => void;
  currentCount: number;
}

export function AddAddictionDialog({ 
  open, 
  onOpenChange, 
  onAddictionAdded,
  currentCount 
}: AddAddictionDialogProps) {
  const [addictionType, setAddictionType] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentCount >= 3) {
      toast.error("Máximo 3 adicciones permitidas");
      return;
    }

    if (!addictionType.trim()) {
      toast.error("Por favor ingresa el tipo de adicción");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("addictions")
        .insert({
          user_id: user.id,
          addiction_type: addictionType.trim(),
          start_date: startDate.toISOString(),
          is_active: true
        });

      if (error) throw error;

      toast.success("Adicción añadida exitosamente");
      setAddictionType("");
      setStartDate(new Date());
      onOpenChange(false);
      onAddictionAdded();
    } catch (error) {
      console.error("Error adding addiction:", error);
      toast.error("Error al añadir la adicción");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>¿De qué quieres rehabilitarte?</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addiction-type">Tipo de adicción</Label>
            <Input
              id="addiction-type"
              value={addictionType}
              onChange={(e) => setAddictionType(e.target.value)}
              placeholder="Ej: Alcohol, Drogas, Juego..."
              maxLength={50}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Fecha de inicio de recuperación</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, "PPP", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Añadiendo..." : "Añadir adicción"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}