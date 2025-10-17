import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Anchor, Phone, AlertCircle, HeartPulse, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddContactDialog } from "@/components/AddContactDialog";

interface SupportContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  notes?: string;
}

export default function Tools() {
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("support_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Error al cargar contactos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (contact: {
    name: string;
    phone: string;
    relationship: string;
    notes?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("support_contacts")
        .insert({
          ...contact,
          user_id: user.id,
        });

      if (error) throw error;
      
      toast.success("Contacto añadido correctamente");
      fetchContacts();
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Error al añadir contacto");
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from("support_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Contacto eliminado");
      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Error al eliminar contacto");
    }
  };

  const handleCallContact = (phone: string, name: string) => {
    window.location.href = `tel:${phone}`;
    toast.success(`Llamando a ${name}...`);
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
      icon: Phone,
      title: "Contactos de Emergencia",
      description: "Acceso rápido a tu red de apoyo",
      color: "text-primary",
      bgColor: "bg-primary/10"
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
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Mi Red de Apoyo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando contactos...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No tienes contactos guardados aún</p>
              <Button className="gap-2" onClick={() => setDialogOpen(true)}>
                <Phone className="h-4 w-4" />
                Añadir Contacto
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{contact.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{contact.relationship}</p>
                      {contact.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{contact.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCallContact(contact.phone, contact.name)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full gap-2" onClick={() => setDialogOpen(true)}>
                <Phone className="h-4 w-4" />
                Añadir Contacto
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <AddContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleAddContact}
      />
    </div>
  );
}
