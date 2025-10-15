import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Plus } from "lucide-react";
import { useState } from "react";

interface Reminder {
  id: string;
  title: string;
  time: string;
  enabled: boolean;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    time: ""
  });

  const addReminder = () => {
    if (!newReminder.title.trim() || !newReminder.time) return;

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      time: newReminder.time,
      enabled: true
    };

    setReminders(prev => [...prev, reminder]);
    setNewReminder({ title: "", time: "" });
    setIsDialogOpen(false);
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(reminder =>
      reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Recordatorios</h1>
        <p className="text-muted-foreground text-lg">Mantente en el camino con notificaciones personalizadas</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Bell className="h-6 w-6 text-primary" />
            Mantente Conectado a Tus Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">
            Configura recordatorios para mantener tus prácticas diarias, conectar con tu red de apoyo 
            y mantenerte enfocado en tus metas de recuperación.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">Tus Recordatorios</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Añadir Recordatorio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Recordatorio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reminder-title">Título</Label>
                <Input
                  id="reminder-title"
                  placeholder="Ej: Meditación matutina"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-time">Hora</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <Button onClick={addReminder} className="w-full">
                Añadir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {reminders.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No tienes recordatorios configurados</p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Añadir Primer Recordatorio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Añadir Nuevo Recordatorio</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reminder-title-empty">Título</Label>
                      <Input
                        id="reminder-title-empty"
                        placeholder="Ej: Meditación matutina"
                        value={newReminder.title}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reminder-time-empty">Hora</Label>
                      <Input
                        id="reminder-time-empty"
                        type="time"
                        value={newReminder.time}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                    <Button onClick={addReminder} className="w-full">
                      Añadir
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{reminder.title}</h3>
                    <p className="text-sm text-muted-foreground">{reminder.time}</p>
                  </div>
                  <Switch 
                    checked={reminder.enabled} 
                    onCheckedChange={() => toggleReminder(reminder.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
