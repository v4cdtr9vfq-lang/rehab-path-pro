import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Anchor, Phone, AlertCircle, HeartPulse, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SupportContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  notes?: string;
}

export default function Tools() {
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    relationship: "",
    notes: ""
  });

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
      toast.error("Debes iniciar sesión para añadir contactos");
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.relationship) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    const { error } = await supabase
      .from("support_contacts")
      .insert({
        user_id: user.id,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        relationship: formData.relationship,
        notes: formData.notes.trim() || null
      });

    if (error) {
      console.error("Error adding contact:", error);
      toast.error("Error al añadir contacto");
      return;
    }

    toast.success("Contacto añadido exitosamente");
    setFormData({ name: "", phone: "", relationship: "", notes: "" });
    setIsDialogOpen(false);
    fetchContacts();
  };

  const handleDelete = async (id: string) => {
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

  const tools = [
    {
      icon: Wind,
      title: "Ejercicio de Respiración",
      description: "Calma tu mente con técnicas de respiración guiada",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: Anchor,
      title: "Ejercicio de Anclaje",
      description: "Conéctate con el momento presente usando la técnica 5-4-3-2-1",
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      icon: AlertCircle,
      title: "Plan de Crisis",
      description: "Tu plan personalizado para momentos difíciles",
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      icon: HeartPulse,
      title: "Menú de Autocuidado",
      description: "Actividades rápidas para apoyar tu bienestar",
      color: "text-accent",
      bgColor: "bg-accent/10"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Herramientas</h1>
        <p className="text-muted-foreground text-lg">Recursos para apoyarte en momentos desafiantes</p>
      </div>

      <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">¿En Crisis?</h3>
              <p className="text-sm text-foreground/80 mb-4">
                Si estás en peligro inmediato o experimentando una crisis, por favor busca ayuda inmediatamente.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="destructive" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Llamar Línea de Crisis
                </Button>
                <Button variant="outline">
                  Contactar Mi Padrino
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <Card
              key={index}
              className="border-primary/20 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${tool.bgColor}`}>
                    <Icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80">{tool.description}</p>
              </CardContent>
            </Card>
          );
        })}

        {/* Contactos de Emergencia Card with full functionality */}
        <Card className="border-primary/20 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Contactos de Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No tienes contactos guardados aún</p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Phone className="h-4 w-4" />
                      Añadir Contacto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Contacto de Emergencia</DialogTitle>
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
                        <Label htmlFor="relationship">Relación *</Label>
                        <Select
                          value={formData.relationship}
                          onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                          required
                        >
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
                      <div>
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Notas adicionales sobre este contacto"
                          rows={3}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Guardar Contacto
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-3">
                  {contacts.map((contact) => (
                    <Card key={contact.id} className="border-primary/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{contact.name}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{contact.relationship}</p>
                            <a
                              href={`tel:${contact.phone}`}
                              className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                            >
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </a>
                            {contact.notes && (
                              <p className="text-sm text-muted-foreground mt-2">{contact.notes}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(contact.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2">
                      <Phone className="h-4 w-4" />
                      Añadir Otro Contacto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Contacto de Emergencia</DialogTitle>
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
                        <Label htmlFor="relationship">Relación *</Label>
                        <Select
                          value={formData.relationship}
                          onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                          required
                        >
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
                      <div>
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Notas adicionales sobre este contacto"
                          rows={3}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Guardar Contacto
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
