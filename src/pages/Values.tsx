import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Value {
  id: string;
  name: string;
  selected: boolean;
  value_type: 'primary' | 'secondary';
}

interface ValueStats {
  name: string;
  count: number;
}

const COLORS = ['#22c55e', '#f97316', '#3b82f6', '#a855f7', '#ec4899', '#eab308', '#14b8a6'];

export default function Values() {
  const { toast } = useToast();
  const [values, setValues] = useState<Value[]>([]);
  const [isPrimaryDialogOpen, setIsPrimaryDialogOpen] = useState(false);
  const [isSecondaryDialogOpen, setIsSecondaryDialogOpen] = useState(false);
  const [newValueName, setNewValueName] = useState("");
  const [todayStats, setTodayStats] = useState<ValueStats[]>([]);
  const [weekStats, setWeekStats] = useState<ValueStats[]>([]);
  const [monthStats, setMonthStats] = useState<ValueStats[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    initializeValues();
    fetchStats();

    // Check for day change every minute
    const checkDayChange = () => {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const storedDate = localStorage.getItem('valuesLastDate');
      
      if (storedDate && storedDate !== currentDate) {
        // Day has changed, reset selections
        fetchValues();
        fetchStats();
      }
      
      localStorage.setItem('valuesLastDate', currentDate);
    };

    // Check immediately
    checkDayChange();

    // Set up interval to check every minute
    const intervalId = setInterval(checkDayChange, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const initializeValues = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has any values
      const { data: existingValues } = await supabase
        .from('values')
        .select('*')
        .eq('user_id', user.id);

      // If no values exist, create default ones
      if (!existingValues || existingValues.length === 0) {
        const defaultValues = [
          "Autocuidado",
          "Gratitud",
          "Humor",
          "Respeto",
          "Salud",
          "Consideración",
          "Compromiso"
        ];

        const valuesToInsert = defaultValues.map(name => ({
          user_id: user.id,
          name: name
        }));

        await supabase
          .from('values')
          .insert(valuesToInsert);
      }

      // Fetch all values
      await fetchValues();
    } catch (error: any) {
      console.error('Error initializing values:', error);
    }
  };

  const fetchValues = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's values
      const { data: valuesData, error: valuesError } = await supabase
        .from('values')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (valuesError) throw valuesError;

      // Check which values are selected today
      const today = new Date().toISOString().split('T')[0];
      const { data: selectionsData, error: selectionsError } = await supabase
        .from('value_selections')
        .select('value_id')
        .eq('user_id', user.id)
        .eq('selected_date', today);

      if (selectionsError) throw selectionsError;

      const selectedIds = new Set(selectionsData?.map(s => s.value_id) || []);

      const mappedValues: Value[] = (valuesData || []).map(v => ({
        id: v.id,
        name: v.name,
        selected: selectedIds.has(v.id),
        value_type: (v.value_type as 'primary' | 'secondary') || 'secondary'
      }));

      setValues(mappedValues);
    } catch (error: any) {
      console.error('Error fetching values:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los valores",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch stats for today
      const today = new Date().toISOString().split('T')[0];
      await fetchStatsForPeriod(user.id, today, today, setTodayStats);

      // Fetch stats for this week (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      await fetchStatsForPeriod(user.id, weekAgoStr, today, setWeekStats);

      // Fetch stats for this month
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      await fetchStatsForPeriod(user.id, monthStartStr, today, setMonthStats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchStatsForPeriod = async (
    userId: string,
    startDate: string,
    endDate: string,
    setStat: (stats: ValueStats[]) => void
  ) => {
    const { data, error } = await supabase
      .from('value_selections')
      .select(`
        value_id,
        values!inner(name)
      `)
      .eq('user_id', userId)
      .gte('selected_date', startDate)
      .lte('selected_date', endDate);

    if (error) {
      console.error('Error fetching period stats:', error);
      return;
    }

    // Count occurrences of each value
    const countMap = new Map<string, number>();
    (data || []).forEach((item: any) => {
      const valueName = item.values.name;
      countMap.set(valueName, (countMap.get(valueName) || 0) + 1);
    });

    const stats: ValueStats[] = Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setStat(stats);
  };

  const toggleValue = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const value = values.find(v => v.id === id);
      if (!value) return;

      const today = new Date().toISOString().split('T')[0];

      if (value.selected) {
        // Remove selection
        const { error } = await supabase
          .from('value_selections')
          .delete()
          .eq('user_id', user.id)
          .eq('value_id', id)
          .eq('selected_date', today);

        if (error) throw error;
      } else {
        // Add selection
        const { error } = await supabase
          .from('value_selections')
          .insert({
            user_id: user.id,
            value_id: id,
            selected_date: today
          });

        if (error) throw error;
      }

      // Update local state
      setValues(prev =>
        prev.map(v => v.id === id ? { ...v, selected: !v.selected } : v)
      );

      // Refresh stats
      await fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el valor",
        variant: "destructive",
      });
    }
  };

  const addValue = async (type: 'primary' | 'secondary') => {
    if (!newValueName.trim()) return;

    // Check limits
    const currentCount = values.filter(v => v.value_type === type).length;
    const maxCount = type === 'primary' ? 3 : 6;
    
    if (currentCount >= maxCount) {
      toast({
        title: "Límite alcanzado",
        description: `Solo puedes tener ${maxCount} valores ${type === 'primary' ? 'primarios' : 'secundarios'}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para añadir valores",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('values')
        .insert({
          user_id: user.id,
          name: newValueName.trim(),
          value_type: type
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setValues(prev => [...prev, { 
          id: data.id, 
          name: data.name, 
          selected: false,
          value_type: type 
        }]);
        setNewValueName("");
        setIsPrimaryDialogOpen(false);
        setIsSecondaryDialogOpen(false);
        toast({
          title: "Valor añadido",
          description: "Tu valor ha sido guardado exitosamente",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo guardar el valor",
        variant: "destructive",
      });
    }
  };

  const deleteValue = async (id: string) => {
    setDeleteConfirmId(null);
    try {
      const { error } = await supabase
        .from('values')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setValues(prev => prev.filter(v => v.id !== id));
      
      toast({
        title: "Valor eliminado",
        description: "El valor ha sido eliminado exitosamente",
      });

      // Refresh stats
      await fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el valor",
        variant: "destructive",
      });
    }
  };

  const renderDonutChart = (data: ValueStats[]) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No hay datos para este período
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="w-full px-4">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="count"
              label={(entry) => `${((entry.count / total) * 100).toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => {
                const percentage = ((value / total) * 100).toFixed(1);
                return [`${percentage}% (${value} veces)`, name];
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={40}
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => value}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-sky-blue/20 bg-gradient-to-br from-sky-blue/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            Lo que más importa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">
            Tus valores son los principios que guían tu camino de recuperación. Selecciona los valores en los que quieres enfocarte hoy, 
            y te recordaremos honrarlos durante el día.
          </p>
        </CardContent>
      </Card>

      {/* Valores Primarios Widget */}
      <div>
        <div className="flex justify-between items-center mb-3 pl-[35px]">
          <h2 className="text-2xl font-semibold text-foreground">Valores primarios - Máximo 3 valores esenciales.</h2>
          <Dialog open={isPrimaryDialogOpen} onOpenChange={setIsPrimaryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={values.filter(v => v.value_type === 'primary').length >= 3}>
                <Plus className="h-4 w-4" />
                Añadir primario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Valor Primario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-value-name">Nombre del Valor</Label>
                  <Input
                    id="primary-value-name"
                    placeholder="Ej: Honestidad, Perseverancia..."
                    value={newValueName}
                    onChange={(e) => setNewValueName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addValue('primary');
                      }
                    }}
                  />
                </div>
                <Button onClick={() => addValue('primary')} className="w-full">
                  Añadir
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-sky-blue/20 bg-gradient-to-br from-sky-blue/5 to-transparent">
          <CardContent className="p-6 space-y-4">
            {values.filter(v => v.value_type === 'primary').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tienes valores primarios aún. Añade hasta 3 valores fundamentales.
              </div>
            ) : (
              values.filter(v => v.value_type === 'primary').map((value) => (
                <div
                  key={value.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    value.selected
                      ? "bg-green-500/10 border-2 border-green-500/30"
                      : "bg-card/50 border-2 border-transparent hover:border-sky-blue/10"
                  }`}
                >
                  <button
                    onClick={() => toggleValue(value.id)}
                    className="flex-shrink-0"
                  >
                    {value.selected ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <span className="text-lg text-foreground flex-1 font-semibold">{value.name}</span>
                  {value.selected && (
                    <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full">
                      Activo Hoy
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirmId(value.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Valores Secundarios Widget */}
      <div>
        <div className="flex justify-between items-center mb-3 pl-[35px]">
          <h2 className="text-2xl font-semibold text-foreground">Valores secundarios - Máximo 6 valores de apoyo.</h2>
          <Dialog open={isSecondaryDialogOpen} onOpenChange={setIsSecondaryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={values.filter(v => v.value_type === 'secondary').length >= 6}>
                <Plus className="h-4 w-4" />
                Añadir secundario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Valor Secundario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="secondary-value-name">Nombre del Valor</Label>
                  <Input
                    id="secondary-value-name"
                    placeholder="Ej: Paciencia, Creatividad..."
                    value={newValueName}
                    onChange={(e) => setNewValueName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addValue('secondary');
                      }
                    }}
                  />
                </div>
                <Button onClick={() => addValue('secondary')} className="w-full">
                  Añadir
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-sky-blue/20">
          <CardContent className="p-6 space-y-4">
            {values.filter(v => v.value_type === 'secondary').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tienes valores secundarios aún. Añade hasta 6 valores de apoyo.
              </div>
            ) : (
              values.filter(v => v.value_type === 'secondary').map((value) => (
                <div
                  key={value.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    value.selected
                      ? "bg-green-500/10 border-2 border-green-500/30"
                      : "bg-card/50 border-2 border-transparent hover:border-sky-blue/10"
                  }`}
                >
                  <button
                    onClick={() => toggleValue(value.id)}
                    className="flex-shrink-0"
                  >
                    {value.selected ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <span className="text-lg text-foreground flex-1">{value.name}</span>
                  {value.selected && (
                    <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full">
                      Activo Hoy
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirmId(value.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-sky-blue/20 bg-gradient-to-br from-sky-blue/5 to-transparent">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">💡 Recordatorio diario de valores</h3>
            <p className="text-foreground/80 text-sm">
              Has seleccionado <span className="font-bold text-green-500">{values.filter(v => v.selected).length} valores</span> para hoy. 
              Te haremos un seguimiento durante tu check-in diario para ver si has honrado estos valores.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Widget */}
      <Card className="border-sky-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-sky-blue" />
            Estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Hoy</TabsTrigger>
              <TabsTrigger value="week">Esta semana</TabsTrigger>
              <TabsTrigger value="month">Este mes</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="mt-6">
              {renderDonutChart(todayStats)}
            </TabsContent>
            <TabsContent value="week" className="mt-6">
              {renderDonutChart(weekStats)}
            </TabsContent>
            <TabsContent value="month" className="mt-6">
              {renderDonutChart(monthStats)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar este valor? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && deleteValue(deleteConfirmId)}>
              Sí
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
