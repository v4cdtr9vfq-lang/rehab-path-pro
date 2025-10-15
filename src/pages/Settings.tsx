import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Configuración</h1>
        <p className="text-muted-foreground text-lg">Personaliza tu experiencia en Rehapp</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            Configuración de Recuperación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="start-date">Fecha de Inicio de Abstinencia</Label>
            <Input id="start-date" type="date" defaultValue="2021-01-22" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recordatorio de Check-In Diario</Label>
              <p className="text-sm text-muted-foreground">Recibe notificaciones para completar tu check-in diario</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recordatorios de Metas</Label>
              <p className="text-sm text-muted-foreground">Recibe recordatorios de próximas metas</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Privacidad y Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bloqueo de Aplicación</Label>
              <p className="text-sm text-muted-foreground">Requiere PIN o biométrico para abrir la app</p>
            </div>
            <Switch />
          </div>

          <Button variant="outline" className="w-full">
            Exportar Mis Datos
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Acerca de</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Versión</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <Button variant="link" className="p-0 h-auto">
            Política de Privacidad
          </Button>
          <Button variant="link" className="p-0 h-auto">
            Términos de Servicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
