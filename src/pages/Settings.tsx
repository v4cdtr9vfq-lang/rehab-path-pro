import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSubscription, SUBSCRIPTION_PLANS } from "@/contexts/SubscriptionContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subscribed, plan, subscriptionEnd, loading, checkSubscription, createCheckoutSession, openCustomerPortal } = useSubscription();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [abstinenceStartDate, setAbstinenceStartDate] = useState("");
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  useEffect(() => {
    loadAbstinenceDate();
    
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "¡Suscripción activada!",
        description: "Tu suscripción ha sido activada exitosamente. Disfruta de 30 días gratis.",
      });
      checkSubscription();
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const loadAbstinenceDate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('abstinence_start_date')
        .eq('user_id', user.id)
        .single();

      if (profile?.abstinence_start_date) {
        // Convert to local date string (YYYY-MM-DD)
        const date = new Date(profile.abstinence_start_date);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];
        setAbstinenceStartDate(localDate);
      }
    } catch (error) {
      console.error('Error loading abstinence date:', error);
    }
  };

  const handleUpdateAbstinenceDate = async () => {
    if (!abstinenceStartDate) {
      toast({
        title: "Error",
        description: "Por favor selecciona una fecha válida",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingDate(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Convert local date to ISO timestamp
      const dateObj = new Date(abstinenceStartDate + 'T00:00:00');
      
      const { error } = await supabase
        .from('profiles')
        .update({ abstinence_start_date: dateObj.toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Fecha actualizada",
        description: "Tu fecha de inicio de abstinencia ha sido actualizada exitosamente",
      });

      // Notify Dashboard to update
      window.dispatchEvent(new CustomEvent('abstinenceDateUpdated'));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la fecha",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;

      toast({
        title: "Email actualizado",
        description: "Se ha enviado un correo de confirmación a tu nueva dirección",
      });
      setNewEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu contraseña actual",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // First, verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No se pudo obtener el email del usuario");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "La contraseña actual es incorrecta",
          variant: "destructive",
        });
        return;
      }

      // If verification successful, update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ""
      );
      
      if (error) throw error;

      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada permanentemente",
      });
      
      // Sign out and redirect to landing page
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cuenta",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Configuración</h1>
        <p className="text-muted-foreground text-lg">Personaliza tu experiencia en Rehapp</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">Cambiar Email</Label>
              <div className="flex gap-2">
                <Input
                  id="new-email"
                  type="email"
                  placeholder="nuevo@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Button 
                  onClick={handleUpdateEmail} 
                  disabled={isUpdatingEmail}
                >
                  {isUpdatingEmail ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Se enviará un correo de confirmación a tu nueva dirección
              </p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔒</span>
                <Label>Cambiar Contraseña</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña Actual</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Ingresa tu contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repite tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleUpdatePassword} 
                disabled={isUpdatingPassword}
                className="w-full"
              >
                {isUpdatingPassword ? "Actualizando..." : "Actualizar Contraseña"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">💳</span>
            Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Current Plan Status */}
              {subscribed && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-primary">✅</span>
                    <span className="font-semibold">
                      {plan === "monthly" ? "Plan Mensual Activo" : "Plan Anual Activo"}
                    </span>
                  </div>
                  {subscriptionEnd && (
                    <p className="text-sm text-muted-foreground">
                      Se renueva el: {new Date(subscriptionEnd).toLocaleDateString('es-ES')}
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={openCustomerPortal}
                    className="w-full mt-2"
                  >
                    Gestionar Suscripción
                  </Button>
                </div>
              )}

              {/* Subscription Plans */}
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {subscribed ? "Cambiar de Plan" : "Elige tu Plan"}
                  </h3>
                </div>

                {/* Basic Plan (Free) */}
                <div className={`border rounded-lg p-4 space-y-3 ${plan === "free" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">Plan Básico</h4>
                      <p className="text-2xl font-bold text-primary mt-1">Gratis<span className="text-sm text-muted-foreground">/30 días</span></p>
                    </div>
                    {plan === "free" && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        Tu Plan
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✅</span>
                      Acceso completo a todas las funciones.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✅</span>
                      Chat comunitario.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✅</span>
                      Seguimiento personalizado.
                    </li>
                  </ul>
                  {plan === "free" && (
                    <Button 
                      disabled
                      variant="destructive"
                      className="w-full mt-16"
                    >
                      Plan Actual
                    </Button>
                  )}
                </div>

                {/* Monthly Plan */}
                <div className={`border rounded-lg p-4 space-y-3 ${plan === "monthly" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">Plan Mensual</h4>
                      <p className="text-2xl font-bold text-primary mt-1">6€<span className="text-sm text-muted-foreground">/mes</span></p>
                    </div>
                    {plan === "monthly" && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        Tu Plan
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✅</span>
                      Acceso completo a todas las funciones.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✅</span>
                      Chat comunitario.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✅</span>
                      Seguimiento personalizado.
                    </li>
                  </ul>
                  {plan === "monthly" ? (
                    <Button 
                      disabled
                      variant="destructive"
                      className="w-full mt-16"
                    >
                      Plan Actual
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => createCheckoutSession(SUBSCRIPTION_PLANS.monthly.priceId)}
                      className="w-full mt-16"
                    >
                      Actualiza tu plan
                    </Button>
                  )}
                </div>

                {/* Annual Plan */}
                <div className={`border rounded-lg p-4 space-y-3 relative ${plan === "annual" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-semibold">
                    Ahorra 50%
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">Plan Anual</h4>
                      <p className="text-2xl font-bold text-primary mt-1">30€<span className="text-sm text-muted-foreground">/año</span></p>
                      <p className="text-xs text-muted-foreground">Solo 2.5€/mes</p>
                    </div>
                    {plan === "annual" && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        Tu Plan
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✅</span>
                      Todo lo del plan mensual.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✅</span>
                      Ahorra 42€ al año.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✅</span>
                      Mejor valor por tu dinero.
                    </li>
                  </ul>
                  {plan === "annual" ? (
                    <Button 
                      disabled
                      variant="destructive"
                      className="w-full mt-16"
                    >
                      Plan Actual
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => createCheckoutSession(SUBSCRIPTION_PLANS.annual.priceId)}
                      className="w-full mt-16"
                    >
                      Actualiza tu plan
                    </Button>
                  )}
                </div>
              </div>

            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            Configuración de Recuperación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="start-date">Fecha de Inicio de Abstinencia</Label>
            <div className="flex gap-2">
              <Input 
                id="start-date" 
                type="date" 
                value={abstinenceStartDate}
                onChange={(e) => setAbstinenceStartDate(e.target.value)}
              />
              <Button 
                onClick={handleUpdateAbstinenceDate}
                disabled={isUpdatingDate}
              >
                {isUpdatingDate ? "Actualizando..." : "Guardar"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta fecha se usará para calcular tu tiempo de abstinencia en el dashboard
            </p>
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
          <div className="flex flex-col gap-2">
            <Button variant="link" className="p-0 h-auto justify-start">
              Política de Privacidad
            </Button>
            <Button variant="link" className="p-0 h-auto justify-start">
              Términos de Servicio
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <span className="text-lg">🗑️</span>
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-destructive font-semibold">Eliminar Cuenta</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Esta acción es permanente y no se puede deshacer. Todos tus datos serán eliminados permanentemente.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <span className="mr-2">🗑️</span>
                  Eliminar mi cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta y todos tus datos de nuestros servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sí, eliminar mi cuenta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
