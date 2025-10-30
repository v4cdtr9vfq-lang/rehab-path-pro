import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface AddAddictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (addictionType: string, startDate: Date) => void;
  existingAddictions?: string[];
}

export function AddAddictionDialog({ open, onOpenChange, onAdd, existingAddictions = [] }: AddAddictionDialogProps) {
  const { i18n } = useTranslation();
  const dateLocale = i18n.language === 'en' ? enUS : es;
  const [addictionType, setAddictionType] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());

  const allOptions = [
    { id: 'adiccion_1', label: 'Adicción 1' },
    { id: 'adiccion_2', label: 'Adicción 2' },
    { id: 'adiccion_3', label: 'Adicción 3' },
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
  ];

  // Filter out already selected addictions
  const availableOptions = allOptions.filter(option => 
    !existingAddictions.includes(option.id.toLowerCase())
  );

  const handleSubmit = () => {
    if (addictionType.trim()) {
      onAdd(addictionType, startDate);
      setAddictionType("");
      setStartDate(new Date());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>¿De qué quieres rehabilitarte?</DialogTitle>
          <DialogDescription>
            Añade una nueva adicción para trackear tu recuperación:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="addiction">Tipo de dependencia:</Label>
            <Select value={addictionType} onValueChange={setAddictionType}>
              <SelectTrigger id="addiction">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fecha de inicio de recuperación:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: dateLocale }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                  locale={es}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!addictionType.trim()}>
            Añadir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
