import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus } from "lucide-react";

export default function Reminders() {
  const reminders: any[] = [];

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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Añadir Recordatorio
        </Button>
      </div>

      <div className="space-y-3">
        {reminders.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No tienes recordatorios configurados</p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Añadir Primer Recordatorio
              </Button>
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
                  <Switch checked={reminder.enabled} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
