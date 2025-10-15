import { AbstinenceCounter } from "@/components/AbstinenceCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  text: string;
  completed: boolean;
  remaining: number;
}

export default function Plan() {
  const { toast } = useToast();
  const startDate = new Date();
  
  const [sections, setSections] = useState({
    today: { open: true, goals: [] },
    week: { open: false, goals: [] },
    month: { open: false, goals: [] },
    onetime: { open: false, goals: [] }
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    text: "",
    type: "today" as keyof typeof sections,
    remaining: 1
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (goals) {
        const groupedGoals = {
          today: { open: true, goals: goals.filter(g => g.goal_type === 'today') },
          week: { open: false, goals: goals.filter(g => g.goal_type === 'week') },
          month: { open: false, goals: goals.filter(g => g.goal_type === 'month') },
          onetime: { open: false, goals: goals.filter(g => g.goal_type === 'onetime') }
        };
        setSections(groupedGoals);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las metas",
        variant: "destructive",
      });
    }
  };

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [section]: { ...prev[section], open: !prev[section].open }
    }));
  };

  const toggleGoal = async (sectionKey: keyof typeof sections, goalId: string) => {
    try {
      const goal = sections[sectionKey].goals.find(g => g.id === goalId);
      if (!goal) return;

      const { error } = await supabase
        .from('goals')
        .update({ completed: !goal.completed })
        .eq('id', goalId);

      if (error) throw error;

      setSections(prev => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          goals: prev[sectionKey].goals.map(g =>
            g.id === goalId ? { ...g, completed: !g.completed } : g
          )
        }
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la meta",
        variant: "destructive",
      });
    }
  };

  const addGoal = async () => {
    if (!newGoal.text.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para añadir metas",
          variant: "destructive",
        });
        return;
      }

      const { data: goal, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          text: newGoal.text,
          goal_type: newGoal.type,
          remaining: newGoal.remaining,
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      if (goal) {
        setSections(prev => ({
          ...prev,
          [newGoal.type]: {
            ...prev[newGoal.type],
            goals: [...prev[newGoal.type].goals, goal]
          }
        }));

        toast({
          title: "¡Meta añadida!",
          description: "Tu meta ha sido guardada exitosamente",
        });
      }

      setNewGoal({ text: "", type: "today", remaining: 1 });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la meta",
        variant: "destructive",
      });
    }
  };

  const SectionHeader = ({ title, sectionKey }: { title: string; sectionKey: keyof typeof sections }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full text-left"
    >
      <div className="flex items-center gap-2">
        <span className="text-primary">✓</span>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      </div>
      {sections[sectionKey].open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </button>
  );

  const GoalItem = ({ goal, sectionKey }: { goal: Goal; sectionKey: keyof typeof sections }) => (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 hover:bg-card transition-colors">
      <Checkbox
        checked={goal.completed}
        onCheckedChange={() => toggleGoal(sectionKey, goal.id)}
        className="mt-1"
      />
      <div className="flex-1">
        <p className={`text-foreground ${goal.completed ? "line-through opacity-60" : ""}`}>
          {goal.text}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {goal.remaining} restante{goal.remaining !== 1 ? 's' : ''} {sectionKey === "today" ? "hoy" : sectionKey === "week" ? "esta semana" : sectionKey === "month" ? "este mes" : ""}
        </p>
      </div>
      <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary/30 text-primary font-medium">
        {goal.remaining}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-tight mb-3">Mi Plan</h1>
        <p className="text-muted-foreground text-lg">Rastrea tus metas y progreso de recuperación</p>
      </div>

      <AbstinenceCounter startDate={startDate} />

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Metas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" className="gap-2">
              <Plus className="h-5 w-5" />
              Añadir Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nueva Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-text">Meta</Label>
                <Input
                  id="goal-text"
                  placeholder="Escribe tu meta..."
                  value={newGoal.text}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, text: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-type">Tipo</Label>
                <Select value={newGoal.type} onValueChange={(value) => setNewGoal(prev => ({ ...prev, type: value as keyof typeof sections }))}>
                  <SelectTrigger id="goal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="week">Esta Semana</SelectItem>
                    <SelectItem value="month">Este Mes</SelectItem>
                    <SelectItem value="onetime">Meta Única</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-remaining">Número de veces</Label>
                <Input
                  id="goal-remaining"
                  type="number"
                  min="1"
                  value={newGoal.remaining}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, remaining: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <Button onClick={addGoal} className="w-full">
                Añadir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {/* Today */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="Hoy" sectionKey="today" />
          </CardHeader>
          {sections.today.open && (
            <CardContent className="space-y-3">
              {sections.today.goals.map(goal => (
                <GoalItem key={goal.id} goal={goal} sectionKey="today" />
              ))}
            </CardContent>
          )}
        </Card>

        {/* This Week */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="Esta Semana (L-D)" sectionKey="week" />
          </CardHeader>
          {sections.week.open && (
            <CardContent className="space-y-3">
              {sections.week.goals.map(goal => (
                <GoalItem key={goal.id} goal={goal} sectionKey="week" />
              ))}
            </CardContent>
          )}
        </Card>

        {/* This Month */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="Este Mes" sectionKey="month" />
          </CardHeader>
          {sections.month.open && (
            <CardContent className="space-y-3">
              {sections.month.goals.map(goal => (
                <GoalItem key={goal.id} goal={goal} sectionKey="month" />
              ))}
            </CardContent>
          )}
        </Card>

        {/* One-Time Goals */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="Metas Únicas" sectionKey="onetime" />
          </CardHeader>
          {sections.onetime.open && (
            <CardContent className="space-y-3">
              {sections.onetime.goals.map(goal => (
                <GoalItem key={goal.id} goal={goal} sectionKey="onetime" />
              ))}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
