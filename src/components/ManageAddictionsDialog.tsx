import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";

interface Addiction {
  id: string;
  addiction_type: string;
  start_date: string;
  is_active: boolean;
}

interface ManageAddictionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddictionsChanged: () => void;
}

export function ManageAddictionsDialog({ 
  open, 
  onOpenChange,
  onAddictionsChanged
}: ManageAddictionsDialogProps) {
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchAddictions();
    }
  }, [open]);

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
      toast.error("Error al cargar las adicciones");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("addictions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Adicción eliminada");
      fetchAddictions();
      onAddictionsChanged();
    } catch (error) {
      console.error("Error deleting addiction:", error);
      toast.error("Error al eliminar la adicción");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestionar adicciones</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Cargando...
          </div>
        ) : addictions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No tienes adicciones registradas
          </div>
        ) : (
          <div className="space-y-3">
            {addictions.map((addiction) => (
              <Card key={addiction.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {addiction.addiction_type}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      Desde {format(new Date(addiction.start_date), "PPP", { locale: es })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(addiction.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Button onClick={() => onOpenChange(false)} className="w-full">
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
}