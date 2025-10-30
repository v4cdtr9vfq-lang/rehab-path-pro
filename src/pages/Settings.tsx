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
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSubscription, SUBSCRIPTION_PLANS } from "@/contexts/SubscriptionContext";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'en' ? enUS : es;
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
  const [initialRehabilitationType, setInitialRehabilitationType] = useState<string>("");
  const [initialAbstinenceDate, setInitialAbstinenceDate] = useState("");

  const REHABILITATION_TYPES = [
    { id: 'adiccion_1', label: t('addictionTypes.adiccion_1') },
    { id: 'adiccion_2', label: t('addictionTypes.adiccion_2') },
    { id: 'adiccion_3', label: t('addictionTypes.adiccion_3') },
    { id: 'alcohol', label: t('addictionTypes.alcohol') },
    { id: 'amor', label: t('addictionTypes.amor') },
    { id: 'azucar', label: t('addictionTypes.azucar') },
    { id: 'cannabis', label: t('addictionTypes.cannabis') },
    { id: 'cocaina', label: t('addictionTypes.cocaina') },
    { id: 'codependencia', label: t('addictionTypes.codependencia') },
    { id: 'comida', label: t('addictionTypes.comida') },
    { id: 'compras', label: t('addictionTypes.compras') },
    { id: 'drama', label: t('addictionTypes.drama') },
    { id: 'medicamentos', label: t('addictionTypes.medicamentos') },
    { id: 'narcoticos', label: t('addictionTypes.narcoticos') },
    { id: 'pornografia', label: t('addictionTypes.pornografia') },
    { id: 'redes_sociales', label: t('addictionTypes.redes_sociales') },
    { id: 'sexo', label: t('addictionTypes.sexo') },
    { id: 'tabaco', label: t('addictionTypes.tabaco') },
    { id: 'tecnologia', label: t('addictionTypes.tecnologia') },
    { id: 'trabajo', label: t('addictionTypes.trabajo') },
    { id: 'vaporizadores', label: t('addictionTypes.vaporizadores') },
    { id: 'videojuegos', label: t('addictionTypes.videojuegos') },
    { id: 'otros', label: t('addictionTypes.otros') },
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
        title: t('settings.subscriptionActivated'),
        description: t('settings.subscriptionActivatedDesc'),
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
        setInitialAbstinenceDate(localDate);
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
      console.log('Adicciones cargadas en Settings:', data);
      setAddictions(data || []);
    } catch (error) {
      console.error('Error loading addictions:', error);
    }
  };

  const handleUpdateAddictionDate = async (addictionId: string, newDate: string) => {
    if (!newDate) {
      toast({
        title: t('common.error'),
        description: t('settings.selectValidDate'),
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
        title: t('settings.dateUpdated'),
        description: t('settings.addictionDateUpdated'),
      });

      loadAddictions();
      setEditingAddictions(prev => {
        const newState = { ...prev };
        delete newState[addictionId];
        return newState;
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('settings.couldNotUpdateDate'),
        variant: "destructive",
      });
    }
  };

  const handleUpdateAddiction = async (addictionId: string, newDate: string, newType?: string) => {
    if (!newDate) {
      toast({
        title: t('common.error'),
        description: t('settings.selectValidDate'),
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
        title: t('settings.addictionUpdated'),
        description: t('settings.addictionDataUpdated'),
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
        title: t('common.error'),
        description: error.message || t('settings.couldNotUpdateAddiction'),
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
        title: t('settings.addictionAdded'),
        description: t('settings.addictionAddedCorrectly'),
      });

      loadAddictions();
      setShowAddDialog(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('settings.couldNotAddAddiction'),
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
        title: t('settings.addictionDeleted'),
        description: t('settings.addictionDeletedCorrectly'),
      });

      loadAddictions();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('settings.couldNotDeleteAddiction'),
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
        const rehabType = (profile as any).rehabilitation_type;
        setRehabilitationType(rehabType);
        setInitialRehabilitationType(rehabType);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleUpdateRehabilitationType = async () => {
    if (!rehabilitationType) {
      toast({
        title: t('common.error'),
        description: t('settings.selectAnOption'),
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
        title: t('settings.rehabilitationTypeUpdated'),
        description: t('settings.preferenceUpdatedSuccessfully'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('settings.couldNotUpdateRehabilitationType'),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRehabType(false);
    }
  };

  const handleUpdateName = async () => {
    if (!fullName.trim()) {
      toast({
        title: t('common.error'),
        description: t('settings.enterValidName'),
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
        title: t('settings.nameUpdated'),
        description: t('settings.nameUpdatedSuccessfully'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('settings.couldNotUpdateName'),
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
        title: t('common.error'),
        description: t('settings.selectValidDate'),
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
        title: t('settings.dateUpdated'),
        description: t('settings.abstractDateUpdatedSuccessfully'),
      });

      // Notify Dashboard to update
      window.dispatchEvent(new CustomEvent('abstinenceDateUpdated'));
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('settings.couldNotUpdateDate'),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toast({
        title: t('common.error'),
        description: t('settings.invalidEmail'),
        variant: "destructive",
      });
      return;
    }

    if (newEmail !== confirmEmail) {
      toast({
        title: t('common.error'),
        description: t('settings.emailsMismatch'),
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;

      toast({
        title: t('settings.emailUpdated'),
        description: t('settings.confirmationEmailSent'),
      });
      setNewEmail("");
      setConfirmEmail("");
    } catch (error: any) {
      toast({
        title: t('common.error'),
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
        title: t('common.error'),
        description: t('settings.enterCurrentPassword'),
        variant: "destructive",
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('settings.passwordMinLength'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('settings.passwordsMismatch'),
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // First, verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error(t('settings.couldNotGetUserEmail'));

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: t('common.error'),
          description: t('settings.currentPasswordIncorrect'),
          variant: "destructive",
        });
        return;
      }

      // If verification successful, update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;

      toast({
        title: t('settings.passwordUpdated'),
        description: t('settings.passwordUpdatedSuccessfully'),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: t('common.error'),
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
        title: t('settings.accountDeleted'),
        description: t('settings.accountDeletedPermanently'),
      });
      
      // Sign out and redirect to landing page
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('settings.couldNotDeleteAccount'),
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
      title: t('settings.reminderAdded'),
      description: t('settings.reminderConfiguredSuccessfully'),
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
      title: t('settings.reminderDeleted'),
      description: t('settings.reminderHasBeenDeleted'),
    });
  };


  return (
    <div className="space-y-[35px] animate-in fade-in duration-500">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 pl-4">
            {t('settings.account')}:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name" className="pl-4">{t('settings.firstName')}:</Label>
              <div className="flex gap-2">
                <Input
                  id="full-name"
                  type="text"
                  placeholder={t('settings.justYourName')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Button 
                  onClick={handleUpdateName} 
                  disabled={isUpdatingName || !fullName.trim()}
                >
                  {isUpdatingName ? "..." : t('settings.save')}
                </Button>
              </div>
              {fullName.trim() && (
                <p className="text-xs text-muted-foreground pl-4">
                  {t('settings.pressToConfirm')}
                </p>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <h3 className="text-lg font-semibold pl-4">{t('settings.changeEmail')}:</h3>
              <Input
                id="new-email"
                type="email"
                placeholder={t('settings.newEmailPlaceholder')}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Label htmlFor="confirm-email" className="pl-4 mt-1">{t('settings.confirmEmail')}:</Label>
              <Input
                id="confirm-email"
                type="email"
                placeholder={t('settings.repeatNewEmail')}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
              <Button 
                onClick={handleUpdateEmail} 
                disabled={isUpdatingEmail}
                className="w-full"
              >
                {isUpdatingEmail ? t('settings.updating') : t('settings.update')}
              </Button>
              <p className="text-xs text-muted-foreground pl-4 mt-1">
                {t('settings.confirmationEmailWillBeSent')}
              </p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-lg font-semibold pl-4 mb-2">{t('settings.changePassword')}:</h3>
              <div className="space-y-2">
                <Label htmlFor="current-password" className="pl-4">{t('settings.currentPassword')}:</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder={t('settings.enterCurrentPasswordPlaceholder')}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="pl-4">{t('settings.newPassword')}:</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder={t('settings.minimumCharacters')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="pl-4">{t('settings.confirmPassword')}:</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t('settings.repeatNewPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleUpdatePassword} 
                disabled={isUpdatingPassword}
                className="w-full"
              >
                {isUpdatingPassword ? t('settings.updating') : t('settings.updatePassword')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="pl-4">
            {t('settings.recoverySettings')}:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* List of all addictions including main one */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="pl-4">{t('settings.myAddictions')}:</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{addictions.length + 1}/3</span>
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
            
            <div className="space-y-3">
              {/* Main addiction (legado) */}
              <div className="flex items-start gap-2 p-3 rounded-lg border bg-card">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground shrink-0">
                  1
                </span>
                <div className="flex-1 space-y-2">
                  <Select
                    value={rehabilitationType}
                    onValueChange={setRehabilitationType}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder={t('settings.selectAddiction')} />
                    </SelectTrigger>
                    <SelectContent>
                      {REHABILITATION_TYPES.filter(type => 
                        !addictions.some(a => a.addiction_type === type.id)
                      ).map((type) => (
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
                          format(new Date(abstinenceStartDate), "PPP", { locale: dateLocale })
                        ) : (
                          <span>{t('settings.selectDate')}</span>
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
                  {(rehabilitationType !== initialRehabilitationType || abstinenceStartDate !== initialAbstinenceDate) && (
                    <Button 
                      size="sm"
                      onClick={() => {
                        handleUpdateRehabilitationType();
                        handleUpdateAbstinenceDate();
                        setInitialRehabilitationType(rehabilitationType);
                        setInitialAbstinenceDate(abstinenceStartDate);
                      }}
                      disabled={isUpdatingDate || isUpdatingRehabType}
                      className="w-full mt-2"
                    >
                      {(isUpdatingDate || isUpdatingRehabType) ? "..." : t('settings.save')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Additional addictions */}
              {addictions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('settings.addAdditionalAddictions')}
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
                <>
                  {addictions.map((addiction, index) => {
                  const dateValue = editingAddictions[addiction.id] || 
                    new Date(addiction.start_date).toISOString().split('T')[0];
                  const typeValue = editingAddictionTypes[addiction.id] || addiction.addiction_type;
                  
                  return (
                    <div key={addiction.id} className="space-y-3">
                      <div className="flex items-start gap-2 p-3 rounded-lg border bg-card">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground shrink-0">
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
                            <SelectTrigger className="w-full h-10">
                              <SelectValue>
                                {REHABILITATION_TYPES.find(t => t.id === typeValue)?.label || typeValue}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {REHABILITATION_TYPES.filter(type => 
                                type.id === typeValue || 
                                (type.id !== rehabilitationType && 
                                 !addictions.some(a => a.id !== addiction.id && a.addiction_type === type.id))
                              ).map((type) => (
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
                                  format(new Date(dateValue), "PPP", { locale: dateLocale })
                         ) : (
                          <span>{t('settings.selectDate')}</span>
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                Borrar
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
                      </div>
                    </div>
                  );
                  })}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="pl-4">{t('settings.dailyCheckInReminder')}:</Label>
              <p className="text-sm text-muted-foreground pl-4">{t('settings.receiveNotificationsForCheckIn')}</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="pl-4">{t('settings.goalReminders')}:</Label>
              <p className="text-sm text-muted-foreground pl-4">{t('settings.receiveRemindersForUpcomingGoals')}</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('settings.subscription')}:
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
                      {plan === "monthly" ? t('settings.monthlyPlanActive') : t('settings.annualPlanActive')}
                    </span>
                  </div>
                    {subscriptionEnd && (
                      <p className="text-sm text-muted-foreground">
                        {t('settings.renewsOn')}: {new Date(subscriptionEnd).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-ES')}
                      </p>
                    )}
                  <Button 
                    variant="outline" 
                    onClick={openCustomerPortal}
                    className="w-full mt-2"
                  >
                    {t('settings.manageSubscription')}
                  </Button>
                </div>
              )}

              {/* Subscription Plans */}
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    {subscribed ? t('settings.changePlan') : t('settings.chooseYourPlan')}
                  </h3>
                </div>

                {/* Basic Plan (Free) */}
                <div className={`border rounded-lg p-4 space-y-3 ${plan === "free" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{t('settings.basicPlan')}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-bold text-primary">{t('settings.free')}</p>
                        <span className="text-sm text-muted-foreground">+{trialDaysUsed}/40 {t('settings.days')}</span>
                      </div>
                    </div>
                    {plan === "free" && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        {t('settings.yourPlan')}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      {t('settings.fullAccessToAllFeatures')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      {t('settings.communityChat')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      {t('settings.personalizedTracking')}
                    </li>
                  </ul>
                  {plan === "free" && (
                    <Button 
                      disabled
                      variant="destructive"
                      className="w-full mt-48"
                    >
                      {t('settings.currentPlan')}
                    </Button>
                  )}
                </div>

                {/* Monthly Plan */}
                <div className={`border rounded-lg p-4 space-y-3 ${plan === "monthly" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{t('settings.monthlyPlan')}</h4>
                      <p className="text-2xl font-bold text-primary mt-1">6€<span className="text-sm text-muted-foreground">{t('settings.perMonth')}</span></p>
                    </div>
                    {plan === "monthly" && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        {t('settings.yourPlan')}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      {t('settings.fullAccessToAllFeatures')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      {t('settings.communityChat')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      {t('settings.personalizedTracking')}
                    </li>
                  </ul>
                  {plan === "monthly" ? (
                    <Button 
                      disabled
                      variant="destructive"
                      className="w-full mt-16"
                    >
                      {t('settings.currentPlan')}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => createCheckoutSession(SUBSCRIPTION_PLANS.monthly.priceId)}
                      className="w-full mt-16"
                    >
                      {t('settings.upgradePlan')}
                    </Button>
                  )}
                </div>

                {/* Annual Plan */}
                <div className={`border rounded-lg p-4 space-y-3 relative ${plan === "annual" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-semibold">
                    {t('settings.save50')}
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{t('settings.annualPlan')}</h4>
                      <p className="text-2xl font-bold text-primary mt-1">30€<span className="text-sm text-muted-foreground">{t('settings.perYear')}</span></p>
                      <p className="text-xs text-muted-foreground">{t('settings.onlyPerMonth')}</p>
                    </div>
                    {plan === "annual" && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        {t('settings.yourPlan')}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      {t('settings.everythingInMonthlyPlan')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      {t('settings.savePerYear')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-destructive" />
                      {t('settings.bestValue')}
                    </li>
                  </ul>
                  {plan === "annual" ? (
                    <Button 
                      disabled
                      variant="destructive"
                      className="w-full mt-16"
                    >
                      {t('settings.currentPlan')}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => createCheckoutSession(SUBSCRIPTION_PLANS.annual.priceId)}
                      className="w-full mt-16"
                    >
                      {t('settings.upgradePlan')}
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
          <CardTitle className="pl-4">{t('settings.language')}:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="pl-4">{t('settings.selectLanguage')}:</Label>
            <p className="text-sm text-muted-foreground pl-4">{t('settings.languageDescription')}</p>
            <Select
              value={i18n.language}
              onValueChange={(value) => {
                i18n.changeLanguage(value);
                toast({
                  title: t('settings.languageUpdated'),
                  description: value === 'es' ? t('settings.languageChangedToSpanish') : t('settings.languageChangedToEnglish'),
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">{t('settings.spanish')}</SelectItem>
                <SelectItem value="en">{t('settings.english')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 pl-4">
              <Bell className="h-5 w-5 text-primary" />
              {t('settings.reminders')}:
            </CardTitle>
            <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('settings.add')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('settings.addNewReminder')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reminder-title" className="pl-4">{t('settings.title')}:</Label>
                    <Input
                      id="reminder-title"
                      placeholder={t('settings.exampleMorningMeditation')}
                      value={newReminder.title}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminder-time" className="pl-4">{t('settings.time')}:</Label>
                    <Input
                      id="reminder-time"
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="pl-4">{t('settings.notificationType')}:</Label>
                    <RadioGroup
                      value={newReminder.notificationType} 
                      onValueChange={(value: "email" | "popup") => setNewReminder(prev => ({ ...prev, notificationType: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="popup" id="popup" />
                        <Label htmlFor="popup" className="flex items-center gap-2 cursor-pointer font-normal">
                          <BellRing className="h-4 w-4" />
                          {t('settings.popupInApp')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer font-normal">
                          <Mail className="h-4 w-4" />
                          {t('settings.sendByEmail')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button onClick={addReminder} className="w-full">
                    {t('settings.add')}
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
                <p className="text-muted-foreground text-sm">{t('settings.noRemindersConfigured')}</p>
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
                          <span className="text-xs text-muted-foreground">{t('settings.email')}</span>
                        </>
                      ) : (
                        <>
                          <BellRing className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{t('settings.popup')}</span>
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
          <CardTitle className="pl-4">{t('settings.privacyAndSecurity')}:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="pl-4">{t('settings.appLock')}:</Label>
              <p className="text-sm text-muted-foreground pl-4">{t('settings.requiresPinOrBiometric')}</p>
            </div>
            <Switch />
          </div>

          <Button variant="outline" className="w-full">
            {t('settings.exportMyData')}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="pl-4">{t('settings.about')}:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('settings.version')}</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="link" className="p-0 h-auto justify-start">
              {t('settings.privacyPolicy')}
            </Button>
            <Button variant="link" className="p-0 h-auto justify-start">
              {t('settings.termsOfService')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive pl-4">
            {t('settings.dangerZone')}:
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Reset goals */}
            <div className="space-y-2">
              <Label className="text-orange-600 dark:text-orange-500 font-semibold pl-4">{t('settings.resetYourGoals')}:</Label>
              <p className="text-sm text-muted-foreground mb-4 pl-4">
                {t('settings.restoreGoalsToDefault')}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white">
                    {t('settings.resetGoals')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.resetYourGoalsQuestion')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.thisWillRestoreGoals')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
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
                            title: t('settings.goalsReset'),
                            description: t('settings.goalsResetSuccessfully'),
                          });

                          // Dispatch event to update dashboard
                          window.dispatchEvent(new CustomEvent('abstinenceDateUpdated'));
                          
                          // Refresh the page to show updated goals
                          setTimeout(() => {
                            window.location.reload();
                          }, 1500);
                        } catch (error: any) {
                          toast({
                            title: t('common.error'),
                            description: error.message || t('settings.couldNotResetGoals'),
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-orange-600 text-white hover:bg-orange-700"
                    >
                      {t('settings.yesResetGoals')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Delete account */}
            <div className="space-y-2">
              <Label className="text-destructive font-semibold pl-4">{t('settings.deleteAccount')}:</Label>
              <p className="text-sm text-muted-foreground mb-4 pl-4">
                {t('settings.thisActionIsPermanent')}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    {t('settings.deleteMyAccount')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.areYouAbsolutelySure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.thisActionCannotBeUndone')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t('settings.yesDeleteMyAccount')}
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
