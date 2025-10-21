import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SleepEntry {
  entry_date: string;
  quality_score: number;
}

const SleepQuality = () => {
  const { toast } = useToast();
  const [weekData, setWeekData] = useState<SleepEntry[]>([]);
  const [monthData, setMonthData] = useState<SleepEntry[]>([]);
  const [quarterData, setQuarterData] = useState<SleepEntry[]>([]);

  useEffect(() => {
    fetchSleepData();
  }, []);

  const fetchSleepData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Fetch week data
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const { data: week } = await supabase
        .from('sleep_quality')
        .select('entry_date, quality_score')
        .eq('user_id', user.id)
        .gte('entry_date', weekAgoStr)
        .lte('entry_date', today)
        .order('entry_date');
      setWeekData(week || []);

      // Fetch month data
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const { data: month } = await supabase
        .from('sleep_quality')
        .select('entry_date, quality_score')
        .eq('user_id', user.id)
        .gte('entry_date', monthStartStr)
        .lte('entry_date', today)
        .order('entry_date');
      setMonthData(month || []);

      // Fetch quarter data
      const quarterAgo = new Date();
      quarterAgo.setDate(quarterAgo.getDate() - 89);
      const quarterAgoStr = quarterAgo.toISOString().split('T')[0];
      const { data: quarter } = await supabase
        .from('sleep_quality')
        .select('entry_date, quality_score')
        .eq('user_id', user.id)
        .gte('entry_date', quarterAgoStr)
        .lte('entry_date', today)
        .order('entry_date');
      setQuarterData(quarter || []);
    } catch (error: any) {
      console.error('Error fetching sleep data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    }
  };

  const calculateAverage = (data: SleepEntry[]) => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, entry) => acc + entry.quality_score, 0);
    return (sum / data.length).toFixed(1);
  };

  const formatChartData = (data: SleepEntry[]) => {
    return data.map(entry => ({
      date: new Date(entry.entry_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      calidad: entry.quality_score,
    }));
  };

  const renderChart = (data: SleepEntry[]) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No hay datos disponibles para este período
        </div>
      );
    }

    const chartData = formatChartData(data);
    const average = calculateAverage(data);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Promedio del período</p>
          <p className="text-4xl font-bold">{average}</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="calidad" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Estadísticas de Calidad de Sueño</h1>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="week" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">Esta semana</TabsTrigger>
              <TabsTrigger value="month">Este mes</TabsTrigger>
              <TabsTrigger value="quarter">Trimestre</TabsTrigger>
            </TabsList>
            <TabsContent value="week" className="mt-6">
              {renderChart(weekData)}
            </TabsContent>
            <TabsContent value="month" className="mt-6">
              {renderChart(monthData)}
            </TabsContent>
            <TabsContent value="quarter" className="mt-6">
              {renderChart(quarterData)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SleepQuality;
