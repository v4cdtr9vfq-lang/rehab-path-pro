import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Trash2, Pencil, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface SupportContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  notes?: string;
}

export default function SupportNetwork() {
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<SupportContact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "",
    notes: ""
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("support_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contacts:", error);
      return;
    }

    setContacts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debes iniciar sesión para gestionar contactos");
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.relationship) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    const contactData = {
      user_id: user.id,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      relationship: formData.relationship,
      notes: formData.notes.trim() || null
    };

    if (editingContact) {
      // Update existing contact
      const { error } = await supabase
        .from("support_contacts")
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          relationship: formData.relationship,
          notes: formData.notes.trim() || null
        })
        .eq("id", editingContact.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating contact:", error);
        toast.error(`Error al actualizar contacto: ${error.message}`);
        return;
      }

      toast.success("Contacto actualizado exitosamente");
    } else {
      // Create new contact
      const { error } = await supabase
        .from("support_contacts")
        .insert(contactData);

      if (error) {
        console.error("Error adding contact:", error);
        toast.error(`Error al añadir contacto: ${error.message}`);
        return;
      }

      toast.success("Contacto añadido exitosamente");
    }

    setFormData({ name: "", phone: "", email: "", relationship: "", notes: "" });
    setEditingContact(null);
    setIsDialogOpen(false);
    fetchContacts();
  };

  const handleEdit = (contact: SupportContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || "",
      relationship: contact.relationship,
      notes: contact.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null);
    const { error } = await supabase
      .from("support_contacts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting contact:", error);
      toast.error("Error al eliminar contacto");
      return;
    }

    toast.success("Contacto eliminado");
    fetchContacts();
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingContact(null);
      setFormData({ name: "", phone: "", email: "", relationship: "", notes: "" });
    }
  };

  return (
    <div className="space-y-[30px] animate-in fade-in duration-500">
      <Card className="border-primary/20">
        <CardContent className="p-6">
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Mi red de apoyo</h2>
              <p className="text-muted-foreground mb-4">No tienes contactos guardados aún</p>
              <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Phone className="h-4 w-4" />
                    Añadir primer contacto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingContact ? "Editar contacto" : "Añadir contacto"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nombre del contacto"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+34 600 000 000"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contacto@ejemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="relationship">Relación *</Label>
                      <Select
                        value={formData.relationship}
                        onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                      >
                        <SelectTrigger id="relationship">
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
                    <div>
                      <Label htmlFor="notes">Notas</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Notas adicionales sobre este contacto"
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingContact ? "Actualizar Contacto" : "Guardar Contacto"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Phone className="h-4 w-4" />
                      Añadir Contacto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingContact ? "Editar contacto" : "Añadir contacto"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Nombre del contacto"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+34 600 000 000"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="contacto@ejemplo.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="relationship">Relación *</Label>
                        <Select
                          value={formData.relationship}
                          onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                        >
                          <SelectTrigger id="relationship">
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
                      <div>
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Notas adicionales sobre este contacto"
                          rows={3}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        {editingContact ? "Actualizar Contacto" : "Guardar Contacto"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {contacts.map((contact) => (
                  <Card key={contact.id} className="border-primary/10 hover:border-primary/20 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground">{contact.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{contact.relationship}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(contact)}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(contact.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-sm text-foreground hover:text-primary flex items-center gap-2 transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                          {contact.phone}
                        </a>
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-sm text-foreground hover:text-primary flex items-center gap-2 transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                            {contact.email}
                          </a>
                        )}
                      </div>

                      {contact.notes && (
                        <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                          {contact.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar este contacto? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Sí
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
