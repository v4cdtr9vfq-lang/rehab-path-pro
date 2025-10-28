import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bell, Plus, Mail, BellRing, Trash2, Check, CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddAddictionDialog } from "@/components/AddAddictionDialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

interface Reminder {
  id: string;
  title: string;
  time: string;
  enabled: boolean;
  notificationType: "email" | "popup";
}

interface Addiction {
  id: string;
  addiction_type: string;
  start_date: string;
  is_active: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subscribed, plan, subscriptionEnd, loading, checkSubscription, createCheckoutSession, openCustomerPortal } = useSubscription();
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [abstinenceStartDate, setAbstinenceStartDate] = useState("");
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [trialDaysUsed, setTrialDaysUsed] = useState(0);
  const [rehabilitationType, setRehabilitationType] = useState<string>("");
  const [isUpdatingRehabType, setIsUpdatingRehabType] = useState(false);

  const REHABILITATION_TYPES = [
    { id: 'azucar', label: 'Azúcar' },
    { id: 'codependencia', label: 'Codependencia' },
    { id: 'comida', label: 'Comida' },
    { id: 'compras', label: 'Compras' },
    { id: 'drama', label: 'Drama' },
    { id: 'narcoticos', label: 'Narcóticos' },
    { id: 'pornografia', label: 'Pornografía' },
    { id: 'redes_sociales', label: 'Redes Sociales' },
    { id: 'videojuegos', label: 'Videojuegos' },
    { id: 'otros', label: 'Otros' },
    { id: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
  ] as const;
  
  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    time: "",
    notificationType: "popup" as "email" | "popup"
  });
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [editingAddictions, setEditingAddictions] = useState<{ [key: string]: string }>({});
  const [editingAddictionTypes, setEditingAddictionTypes] = useState<{ [key: string]: string }>({});
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadAbstinenceDate();
    loadUserProfile();
    calculateTrialDays();
    loadAddictions();
    
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "Suscripción activada",
        description: "Tu suscripción ha sido activada exitosamente. Disfruta de 40 días gratis.",
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

  const loadAddictions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('addictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAddictions(data || []);
    } catch (error) {
      console.error('Error loading addictions:', error);
    }
  };

  const handleUpdateAddictionDate = async (addictionId: string, newDate: string) => {
    if (!newDate) {
      toast({
        title: "Error",
        description: "Por favor selecciona una fecha válida.",
        variant: "destructive",
      });
      return;
    }

    try {
      const dateObj = new Date(newDate + 'T00:00:00');
      
      const { error } = await supabase
        .from('addictions')
        .update({ start_date: dateObj.toISOString() })
        .eq('id', addictionId);

      if (error) throw error;

      toast({
        title: "Fecha actualizada",
        description: "La fecha de la adicción ha sido actualizada.",
      });

      loadAddictions();
      setEditingAddictions(prev => {
        const newState = { ...prev };
        delete newState[addictionId];
        return newState;
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la fecha.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAddiction = async (addictionId: string, newDate: string, newType?: string) => {
    if (!newDate) {
      toast({
        title: "Error",
        description: "Por favor selecciona una fecha válida.",
        variant: "destructive",
      });
      return;
    }

    try {
      const dateObj = new Date(newDate + 'T00:00:00');
      const updateData: any = { start_date: dateObj.toISOString() };
      
      if (newType) {
        updateData.addiction_type = newType;
      }
      
      const { error } = await supabase
        .from('addictions')
        .update(updateData)
        .eq('id', addictionId);

      if (error) throw error;

      toast({
        title: "Adicción actualizada",
        description: "Los datos de la adicción han sido actualizados.",
      });

      loadAddictions();
      setEditingAddictions(prev => {
        const newState = { ...prev };
        delete newState[addictionId];
        return newState;
      });
      setEditingAddictionTypes(prev => {
        const newState = { ...prev };
        delete newState[addictionId];
        return newState;
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la adicción.",
        variant: "destructive",
      });
    }
  };

  const handleAddAddiction = async (addictionType: string, startDate: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('addictions')
        .insert({
          user_id: user.id,
          addiction_type: addictionType,
          start_date: startDate.toISOString(),
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Adicción añadida",
        description: "La adicción ha sido registrada correctamente.",
      });

      loadAddictions();
      setShowAddDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir la adicción.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAddiction = async (addictionId: string) => {
    try {
      const { error } = await supabase
        .from('addictions')
        .delete()
        .eq('id', addictionId);

      if (error) throw error;

      toast({
        title: "Adicción eliminada",
        description: "La adicción ha sido eliminada correctamente.",
      });

      loadAddictions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la adicción.",
        variant: "destructive",
      });
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile?.full_name) {
        setFullName(profile.full_name);
      }
      if ((profile as any)?.rehabilitation_type) {
        setRehabilitationType((profile as any).rehabilitation_type);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleUpdateRehabilitationType = async () => {
    if (!rehabilitationType) {
      toast({
        title: "Error",
        description: "Por favor selecciona una opción.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingRehabType(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const updateData: any = { rehabilitation_type: rehabilitationType };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Tipo de rehabilitación actualizado",
        description: "Tu preferencia ha sido actualizada exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el tipo de rehabilitación.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRehabType(false);
    }
  };

  const handleUpdateName = async () => {
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre válido.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingName(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Nombre actualizado",
        description: "Tu nombre ha sido actualizado exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el nombre.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const calculateTrialDays = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const createdAt = new Date(user.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTrialDaysUsed(Math.min(diffDays, 40));
    } catch (error) {
      console.error('Error calculating trial days:', error);
    }
  };

  const handleUpdateAbstinenceDate = async () => {
    if (!abstinenceStartDate) {
      toast({
        title: "Error",
        description: "Por favor selecciona una fecha válida.",
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
        description: "Tu fecha de inicio de abstinencia ha sido actualizada exitosamente.",
      });

      // Notify Dashboard to update
      window.dispatchEvent(new CustomEvent('abstinenceDateUpdated'));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la fecha.",
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
        description: "Por favor ingresa un email válido.",
        variant: "destructive",
      });
      return;
    }

    if (newEmail !== confirmEmail) {
      toast({
        title: "Error",
        description: "Los emails no coinciden.",
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
        description: "Se ha enviado un correo de confirmación a tu nueva dirección.",
      });
      setNewEmail("");
      setConfirmEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message + ".",
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
        description: "Por favor ingresa tu contraseña actual.",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
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
          description: "La contraseña actual es incorrecta.",
          variant: "destructive",
        });
        return;
      }

      // If verification successful, update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message + ".",
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

  // Reminder functions
  const addReminder = () => {
    if (!newReminder.title.trim() || !newReminder.time) return;

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      time: newReminder.time,
      enabled: true,
      notificationType: newReminder.notificationType
    };

    setReminders(prev => [...prev, reminder]);
    setNewReminder({ title: "", time: "", notificationType: "popup" });
    setIsReminderDialogOpen(false);
    
    toast({
      title: "Recordatorio añadido",
      description: "Tu recordatorio ha sido configurado exitosamente.",
    });
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(reminder =>
      reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
    ));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
    toast({
      title: "Recordatorio eliminado",
      description: "El recordatorio ha sido eliminado",
    });
  };


  return (
    <div className="space-y-[35px] animate-in fade-in duration-500">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Nombre completo</Label>
              <div className="flex gap-2">
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Button 
                  onClick={handleUpdateName} 
                  disabled={isUpdatingName}
                >
                  {isUpdatingName ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <Label htmlFor="rehab-type">Tipo de rehabilitación</Label>
              <div className="flex gap-2">
                <Select value={rehabilitationType} onValueChange={setRehabilitationType}>
                  <SelectTrigger id="rehab-type">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {REHABILITATION_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleUpdateRehabilitationType} 
                  disabled={isUpdatingRehabType}
                >
                  {isUpdatingRehabType ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <Label htmlFor="new-email">Cambiar Email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="nuevo@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Label htmlFor="confirm-email">Confirmar Email</Label>
              <Input
                id="confirm-email"
                type="email"
                placeholder="Repite tu nuevo email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
              <Button 
                onClick={handleUpdateEmail} 
                disabled={isUpdatingEmail}
                className="w-full"
              >
                {isUpdatingEmail ? "Actualizando..." : "Actualizar"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Se enviará un correo de confirmación a tu nueva dirección
              </p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
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
                    <span className="font-semibold">
                      {plan === "monthly" ? "Plan mensual activo" : "Plan anual activo"}
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
                    Gestionar suscripción
                  </Button>
                </div>
              )}

              {/* Subscription Plans */}
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    {subscribed ? "Cambiar de plan" : "Elige tu plan"}
                  </h3>
                </div>

                {/* Basic Plan (Free) */}
                <div className={`border rounded-lg p-4 space-y-3 ${plan === "free" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">Plan básico</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-bold text-primary">Gratis</p>
                        <span className="text-sm text-muted-foreground">+{trialDaysUsed}/40 días</span>
                      </div>
                    </div>
                    {plan === "free" && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        Tu Plan
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      Acceso completo a todas las funciones.
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      Chat comunitario.
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      Seguimiento personalizado.
                    </li>
                  </ul>
                  {plan === "free" && (
                    <Button 
                      disabled
                      variant="destructive"
                      className="w-full mt-48"
                    >
                      Plan actual
                    </Button>
                  )}
                </div>

                {/* Monthly Plan */}
                <div className={`border rounded-lg p-4 space-y-3 ${plan === "monthly" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">Plan mensual</h4>
                      <p className="text-2xl font-bold text-primary mt-1">6€<span className="text-sm text-muted-foreground">/mes</span></p>
                    </div>
                    {plan === "monthly" && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        Tu plan
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      Acceso completo a todas las funciones.
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      Chat comunitario.
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
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
                      <h4 className="font-semibold text-lg">Plan anual</h4>
                      <p className="text-2xl font-bold text-primary mt-1">30€<span className="text-sm text-muted-foreground">/año</span></p>
                      <p className="text-xs text-muted-foreground">Solo 2.5€/mes</p>
                    </div>
                    {plan === "annual" && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        Tu plan
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      Todo lo del plan mensual.
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      Ahorra 42€ al año.
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
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
            Configuración de recuperación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Old abstinence date */}
          <div className="space-y-4">
            <Label>Fecha de inicio de abstinencia (legado)</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">
                1
              </span>
              <div className="flex-1 space-y-2">
                <Select
                  value={rehabilitationType}
                  onValueChange={setRehabilitationType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una adicción" />
                  </SelectTrigger>
                  <SelectContent>
                    {REHABILITATION_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !abstinenceStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {abstinenceStartDate ? (
                        format(new Date(abstinenceStartDate), "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={abstinenceStartDate ? new Date(abstinenceStartDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                            .toISOString()
                            .split('T')[0];
                          setAbstinenceStartDate(localDate);
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Button 
                  size="sm"
                  onClick={() => {
                    handleUpdateRehabilitationType();
                    handleUpdateAbstinenceDate();
                  }}
                  disabled={isUpdatingDate || isUpdatingRehabType}
                  className="w-full mt-2"
                >
                  {(isUpdatingDate || isUpdatingRehabType) ? "..." : "Guardar"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta fecha se usará si no tienes adicciones registradas
            </p>
          </div>

          {/* List of addictions */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Otras dependencias</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{addictions.length}/2</span>
                {addictions.length < 2 && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {addictions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  No tienes adicciones adicionales registradas.
                </p>
                <Button
                  size="icon"
                  className="rounded-full h-12 w-12"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {addictions.map((addiction, index) => {
                  const dateValue = editingAddictions[addiction.id] || 
                    new Date(addiction.start_date).toISOString().split('T')[0];
                  const typeValue = editingAddictionTypes[addiction.id] || addiction.addiction_type;
                  
                  return (
                    <div key={addiction.id} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">
                        {index + 2}
                      </span>
                      <div className="flex-1 space-y-2">
                        <Select
                          value={typeValue}
                          onValueChange={(value) => setEditingAddictionTypes(prev => ({
                            ...prev,
                            [addiction.id]: value
                          }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REHABILITATION_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateValue && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateValue ? (
                                format(new Date(dateValue), "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateValue ? new Date(dateValue) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                                    .toISOString()
                                    .split('T')[0];
                                  setEditingAddictions(prev => ({
                                    ...prev,
                                    [addiction.id]: localDate
                                  }));
                                }
                              }}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <Button 
                          size="sm"
                          onClick={() => handleUpdateAddiction(addiction.id, dateValue, typeValue)}
                          className="w-full mt-2"
                        >
                          Guardar
                        </Button>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar adicción?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente "{addiction.addiction_type}" y su historial. No se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAddiction(addiction.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  );
                })}
              </div>
            )}
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recordatorios
            </CardTitle>
            <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir
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
                  <div className="space-y-2">
                    <Label>Tipo de Notificación</Label>
                    <RadioGroup 
                      value={newReminder.notificationType} 
                      onValueChange={(value: "email" | "popup") => setNewReminder(prev => ({ ...prev, notificationType: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="popup" id="popup" />
                        <Label htmlFor="popup" className="flex items-center gap-2 cursor-pointer font-normal">
                          <BellRing className="h-4 w-4" />
                          Pop-up en la aplicación
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer font-normal">
                          <Mail className="h-4 w-4" />
                          Enviar por email
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button onClick={addReminder} className="w-full">
                    Añadir
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reminders.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">No tienes recordatorios configurados</p>
              </div>
            ) : (
              reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{reminder.title}</h4>
                    <p className="text-xs text-muted-foreground">{reminder.time}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {reminder.notificationType === "email" ? (
                        <>
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Email</span>
                        </>
                      ) : (
                        <>
                          <BellRing className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Pop-up</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={reminder.enabled} 
                      onCheckedChange={() => toggleReminder(reminder.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReminder(reminder.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Privacidad y seguridad</CardTitle>
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
            Zona de peligro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Reset goals */}
            <div className="space-y-2">
              <Label className="text-orange-600 dark:text-orange-500 font-semibold">Reiniciar tus metas</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Restaura las metas a su configuración por defecto y reinicia el contador de abstinencia. 
                Todos tus demás datos (check-ins, diarios, contactos, etc.) se mantendrán intactos.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white">
                    Reiniciar metas
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Reiniciar tus metas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esto restaurará tus metas a la configuración por defecto y reiniciará el contador "Soy libre desde hace". 
                      Todos tus demás datos (check-ins, diarios, contactos, etc.) se mantendrán guardados. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) throw new Error("Usuario no autenticado");

                          const { error } = await supabase.rpc('reset_goals_and_abstinence', {
                            p_user_id: user.id
                          });

                          if (error) throw error;

                          toast({
                            title: "Metas reiniciadas",
                            description: "Tus metas han sido restauradas a la configuración por defecto y tu contador ha sido reiniciado.",
                          });

                          // Dispatch event to update dashboard
                          window.dispatchEvent(new CustomEvent('abstinenceDateUpdated'));
                          
                          // Refresh the page to show updated goals
                          setTimeout(() => {
                            window.location.reload();
                          }, 1500);
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "No se pudieron reiniciar las metas.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-orange-600 text-white hover:bg-orange-700"
                    >
                      Sí, reiniciar metas
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Delete account */}
            <div className="space-y-2">
              <Label className="text-destructive font-semibold">Eliminar cuenta</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Esta acción es permanente y no se puede deshacer. Todos tus datos serán eliminados permanentemente.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
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
          </div>
        </CardContent>
      </Card>

      <AddAddictionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddAddiction}
        existingAddictions={[
          ...(rehabilitationType ? [rehabilitationType.toLowerCase()] : []),
          ...addictions.map(a => a.addiction_type.toLowerCase())
        ]}
      />
    </div>
  );
}
