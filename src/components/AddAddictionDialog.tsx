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
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AddAddictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (addictionType: string, startDate: Date) => void;
}

export function AddAddictionDialog({ open, onOpenChange, onAdd }: AddAddictionDialogProps) {
  const [addictionType, setAddictionType] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());

  const handleSubmit = () => {
    if (addictionType.trim()) {
      onAdd(addictionType, startDate);
      setAddictionType("");
      setStartDate(new Date());
      onOpenChange(false);
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
                <SelectItem value="Adicción 1">Adicción 1</SelectItem>
                <SelectItem value="Adicción 2">Adicción 2</SelectItem>
                <SelectItem value="Adicción 3">Adicción 3</SelectItem>
                <SelectItem value="Alcohol">Alcohol</SelectItem>
                <SelectItem value="Narcóticos">Narcóticos</SelectItem>
                <SelectItem value="Cocaína">Cocaína</SelectItem>
                <SelectItem value="Cannabis">Cannabis</SelectItem>
                <SelectItem value="Tabaco">Tabaco</SelectItem>
                <SelectItem value="Juego">Juego</SelectItem>
                <SelectItem value="Comida">Comida</SelectItem>
                <SelectItem value="Compras">Compras</SelectItem>
                <SelectItem value="Sexo">Sexo</SelectItem>
                <SelectItem value="Pornografía">Pornografía</SelectItem>
                <SelectItem value="Internet">Internet</SelectItem>
                <SelectItem value="Videojuegos">Videojuegos</SelectItem>
                <SelectItem value="Trabajo">Trabajo</SelectItem>
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
                  {startDate ? format(startDate, "PPP", { locale: es }) : "Selecciona una fecha"}
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
