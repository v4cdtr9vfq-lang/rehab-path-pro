import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (contact: {
    name: string;
    phone: string;
    relationship: string;
    notes?: string;
  }) => void;
}

export function AddContactDialog({ open, onOpenChange, onSave }: AddContactDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!name || !phone || !relationship) return;
    
    onSave({
      name,
      phone,
      relationship,
      notes: notes || undefined,
    });

    // Reset form
    setName("");
    setPhone("");
    setRelationship("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Contacto</DialogTitle>
          <DialogDescription>
            Añade un contacto a tu red de apoyo
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del contacto"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 XXX XXX XXX"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="relationship">Relación</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una relación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="padrino">Padrino/Madrina</SelectItem>
                <SelectItem value="familiar">Familiar</SelectItem>
                <SelectItem value="amigo">Amigo/a</SelectItem>
                <SelectItem value="terapeuta">Terapeuta</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cualquier nota adicional..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name || !phone || !relationship}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
