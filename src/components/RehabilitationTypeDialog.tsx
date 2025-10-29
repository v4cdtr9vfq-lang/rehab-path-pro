import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const REHABILITATION_TYPES = [
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'amor', label: 'Amor' },
  { id: 'azucar', label: 'Azúcar' },
  { id: 'cannabis', label: 'Cannabis' },
  { id: 'cocaina', label: 'Cocaína' },
  { id: 'codependencia', label: 'Codependencia' },
  { id: 'comida', label: 'Comida' },
  { id: 'compras', label: 'Compras' },
  { id: 'drama', label: 'Drama' },
  { id: 'medicamentos', label: 'Medicamentos' },
  { id: 'narcoticos', label: 'Narcóticos' },
  { id: 'pornografia', label: 'Pornografía' },
  { id: 'redes_sociales', label: 'Redes Sociales' },
  { id: 'sexo', label: 'Sexo' },
  { id: 'tabaco', label: 'Tabaco' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'trabajo', label: 'Trabajo' },
  { id: 'vaporizadores', label: 'Vaporizadores' },
  { id: 'videojuegos', label: 'Videojuegos' },
  { id: 'otros', label: 'Otros' },
] as const;

export default function RehabilitationTypeDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkIfNeedsDialog();
  }, []);

  const checkIfNeedsDialog = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Show dialog if rehabilitation_type is null or undefined
      if (profile && !(profile as any).rehabilitation_type) {
        setOpen(true);
      }
    } catch (error) {
      console.error('Error checking rehabilitation type:', error);
      // Show dialog on error as well (column might not exist yet)
      setOpen(true);
    }
  };

  const handleSave = async () => {
    if (!selectedType) {
      toast({
        title: "Error",
        description: "Por favor selecciona una opción",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const updateData: any = { 
        rehabilitation_type: selectedType === 'prefiero_no_decir' ? 'prefiero_no_decir' : selectedType 
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Guardado",
        description: "Tu preferencia ha sido guardada exitosamente",
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar tu preferencia",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-left text-xl pl-[17px]">
            ¿Qué quieres rehabilitar?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground pl-[17px]">
              Liberación de:
            </p>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full pl-[17px]">
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                {REHABILITATION_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
                <SelectItem value="prefiero_no_decir">
                  Prefiero no decirlo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !selectedType}
            className="w-full"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
          <Button 
            onClick={handleSkip} 
            variant="outline"
            className="w-full"
          >
            Prefiero no decir ahora.
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Podrás cambiar esto más tarde en configuración.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
