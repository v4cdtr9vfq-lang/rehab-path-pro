import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, CheckCircle2, Circle, TrendingUp, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

interface Value {
  id: string;
  name: string;
  selected: boolean;
  value_type: 'primary' | 'secondary';
  order_index: number;
}

interface ValueStats {
  name: string;
  count: number;
}

const COLORS = ['#22c55e', '#f97316', '#3b82f6', '#a855f7', '#ec4899', '#eab308', '#14b8a6'];

export default function Values() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [values, setValues] = useState<Value[]>([]);
  const [isPrimaryDialogOpen, setIsPrimaryDialogOpen] = useState(false);
  const [isSecondaryDialogOpen, setIsSecondaryDialogOpen] = useState(false);
  const [newValueName, setNewValueName] = useState("");
  const [weekStats, setWeekStats] = useState<ValueStats[]>([]);
  const [monthStats, setMonthStats] = useState<ValueStats[]>([]);
  const [quarterStats, setQuarterStats] = useState<ValueStats[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [originalValuesOrder, setOriginalValuesOrder] = useState<Value[]>([]);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editValueName, setEditValueName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Initialize values and stats on mount
    const init = async () => {
      await initializeValues();
      await fetchStats();
    };
    
    init();

    // Set up realtime subscription for value selections
    const channel = supabase
      .channel('value_selections_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'value_selections'
        },
        async () => {
          // Reload values and stats when selections change
          await fetchValues();
          await fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          { name: t('values.defaultSelfCare'), type: "primary" },
          { name: t('values.defaultGratitude'), type: "primary" },
          { name: t('values.defaultHumor'), type: "primary" },
          { name: t('values.defaultRespect'), type: "secondary" },
          { name: t('values.defaultHealth'), type: "secondary" },
          { name: t('values.defaultConsideration'), type: "secondary" },
          { name: t('values.defaultCommitment'), type: "secondary" }
        ];

        const valuesToInsert = defaultValues.map((val, index) => ({
          user_id: user.id,
          name: val.name,
          value_type: val.type,
          order_index: index
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
        .order('order_index', { ascending: true });

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
        value_type: (v.value_type as 'primary' | 'secondary') || 'secondary',
        order_index: v.order_index || 0
      }));

      setValues(mappedValues);
      setOriginalValuesOrder(mappedValues);
    } catch (error: any) {
      console.error('Error fetching values:', error);
      toast({
        title: t('common.error'),
        description: t('values.errorLoading'),
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

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

      // Fetch stats for this quarter (last 90 days)
      const quarterAgo = new Date();
      quarterAgo.setDate(quarterAgo.getDate() - 89);
      const quarterAgoStr = quarterAgo.toISOString().split('T')[0];
      await fetchStatsForPeriod(user.id, quarterAgoStr, today, setQuarterStats);
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
      const rawValueName = item.values.name;
      // Translate if it's a translation key
      const valueName = rawValueName.startsWith('values.') ? t(rawValueName) : rawValueName;
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
        title: t('common.error'),
        description: t('values.errorUpdating'),
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
        title: t('values.limitReached'),
        description: t('values.limitMessage', { max: maxCount, type: t(`values.${type}`) }),
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t('common.error'),
          description: t('values.loginRequired'),
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
        const newValue: Value = { 
          id: data.id, 
          name: data.name, 
          selected: false,
          value_type: type,
          order_index: data.order_index || 0
        };
        setValues(prev => [...prev, newValue]);
        setOriginalValuesOrder(prev => [...prev, newValue]);
        setNewValueName("");
        setIsPrimaryDialogOpen(false);
        setIsSecondaryDialogOpen(false);
        toast({
          title: t('values.valueAdded'),
          description: t('values.valueSaved'),
        });
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('values.errorSaving'),
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
      setOriginalValuesOrder(prev => prev.filter(v => v.id !== id));
      
      toast({
        title: t('values.valueDeleted'),
        description: t('values.valueDeletedSuccess'),
      });

      // Refresh stats
      await fetchStats();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('values.errorDeleting'),
        variant: "destructive",
      });
    }
  };

  const handleEditValue = (value: Value) => {
    setEditingValueId(value.id);
    setEditValueName(value.name);
  };

  const handleUpdateValue = async (id: string) => {
    if (!editValueName.trim()) {
      toast({
        title: t('common.error'),
        description: t('values.nameEmpty'),
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('values')
        .update({ name: editValueName.trim() })
        .eq('id', id);

      if (error) throw error;

      setValues(prev => prev.map(v => v.id === id ? { ...v, name: editValueName.trim() } : v));
      setOriginalValuesOrder(prev => prev.map(v => v.id === id ? { ...v, name: editValueName.trim() } : v));
      setEditingValueId(null);
      setEditValueName("");

      toast({
        title: t('values.updated'),
        description: t('values.valueUpdated'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('values.errorUpdating'),
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent, type: 'primary' | 'secondary') => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const filteredValues = values.filter(v => v.value_type === type);
    const oldIndex = filteredValues.findIndex(v => v.id === active.id);
    const newIndex = filteredValues.findIndex(v => v.id === over.id);

    const reorderedFiltered = arrayMove(filteredValues, oldIndex, newIndex);
    
    // Update order_index for reordered items
    const updatedFiltered = reorderedFiltered.map((v, idx) => ({ ...v, order_index: idx }));
    
    // Merge with other type values
    const otherValues = values.filter(v => v.value_type !== type);
    const newValues = [...otherValues, ...updatedFiltered].sort((a, b) => {
      if (a.value_type === b.value_type) {
        return a.order_index - b.order_index;
      }
      return a.value_type === 'primary' ? -1 : 1;
    });

    setValues(newValues);
    setHasUnsavedOrder(true);
  };

  const cancelReorder = () => {
    setValues([...originalValuesOrder]);
    setHasUnsavedOrder(false);
    toast({
      title: t('values.changesCancelled'),
      description: t('values.orderRestored'),
    });
  };

  const saveValueOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update order_index for all values
      const updates = values.map((value, index) => 
        supabase
          .from('values')
          .update({ order_index: value.order_index })
          .eq('id', value.id)
      );

      await Promise.all(updates);

      setOriginalValuesOrder([...values]);
      setHasUnsavedOrder(false);
      
      toast({
        title: t('values.orderSaved'),
        description: t('values.orderUpdated'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('values.errorSavingOrder'),
        variant: "destructive",
      });
    }
  };

  const renderDonutChart = (data: ValueStats[]) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          {t('values.noDataPeriod')}
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
                return [`${percentage}% (${value} ${t('values.times')})`, name];
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

  // Sortable Value Item Component
  interface SortableValueItemProps {
    value: Value;
    onToggle: () => void;
    onDelete: () => void;
    onEdit: () => void;
    isEditing: boolean;
    editName: string;
    onEditNameChange: (name: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
  }

  const SortableValueItem = ({ 
    value, 
    onToggle, 
    onDelete, 
    onEdit,
    isEditing,
    editName,
    onEditNameChange,
    onSaveEdit,
    onCancelEdit
  }: SortableValueItemProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: value.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
          value.selected
            ? "bg-green-500/10 border-2 border-green-500/30"
            : "bg-card/50 border-2 border-transparent hover:border-sky-blue/10"
        }`}
      >
        <button
          onClick={onToggle}
          className="flex-shrink-0"
        >
          {value.selected ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" />
          )}
        </button>
        {!isMobile && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing flex-shrink-0"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="flex-1"
            autoFocus
          />
        ) : (
          <span className={`text-lg text-foreground flex-1 ${value.value_type === 'primary' ? 'font-semibold' : ''}`}>
            {value.name.startsWith('values.') ? t(value.name) : value.name}
          </span>
        )}
        {value.selected && !isEditing && (
          <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full">
            {t('values.activeToday')}
          </span>
        )}
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveEdit}
              className="text-success hover:text-success"
            >
              {t('values.save')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
            >
              {t('values.cancel')}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 text-muted-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-[35px] animate-in fade-in duration-500">
      {hasUnsavedOrder && !isMobile && (
        <div className="flex items-center justify-end gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <span className="text-sm text-foreground mr-auto">
            {t('values.unsavedChanges')}
          </span>
          <Button variant="outline" onClick={cancelReorder}>
            {t('values.cancel')}
          </Button>
          <Button onClick={saveValueOrder}>
            {t('values.orderSaved')}
          </Button>
        </div>
      )}

      {/* Valores Primarios Widget */}
      <div>
        <div className="flex justify-between items-center mb-0 pl-[35px]">
          <h2 className="text-sm md:text-2xl font-semibold text-foreground">
            <span className="md:hidden">{t('values.primaryValuesShort')}</span>
            <span className="hidden md:inline">{t('values.primaryValues')}</span>
          </h2>
          <Dialog open={isPrimaryDialogOpen} onOpenChange={setIsPrimaryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 mt-[15px] mr-[15px]" disabled={values.filter(v => v.value_type === 'primary').length >= 3}>
                <Plus className="h-4 w-4" />
                {t('values.addPrimary')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('values.addPrimaryValue')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-value-name">{t('values.valueName')}</Label>
                  <Input
                    id="primary-value-name"
                    placeholder={t('values.primaryPlaceholder')}
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
                  {t('values.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-foreground/80 mb-[15px] mt-[5px] pl-[35px]">
          {t('values.selectConnected')}
        </p>

        <Card className="border-sky-blue/20 bg-gradient-to-br from-sky-blue/5 to-transparent">
          <CardContent className="p-6 space-y-4">
            {values.filter(v => v.value_type === 'primary').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('values.noPrimaryValues')}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, 'primary')}
              >
                <SortableContext
                  items={values.filter(v => v.value_type === 'primary').map(v => v.id)}
                  strategy={verticalListSortingStrategy}
                  disabled={isMobile}
                >
                  <div className="space-y-4">
                    {values.filter(v => v.value_type === 'primary').map((value) => (
                      <SortableValueItem
                        key={value.id}
                        value={value}
                        onToggle={() => toggleValue(value.id)}
                        onDelete={() => setDeleteConfirmId(value.id)}
                        onEdit={() => handleEditValue(value)}
                        isEditing={editingValueId === value.id}
                        editName={editValueName}
                        onEditNameChange={setEditValueName}
                        onSaveEdit={() => handleUpdateValue(value.id)}
                        onCancelEdit={() => {
                          setEditingValueId(null);
                          setEditValueName("");
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Valores Secundarios Widget */}
      <div>
        <div className="flex justify-between items-center mb-0 pl-[35px]">
          <h2 className="text-sm md:text-2xl font-semibold text-foreground">
            <span className="md:hidden">{t('values.secondaryValuesShort')}</span>
            <span className="hidden md:inline">{t('values.secondaryValues')}</span>
          </h2>
          <Dialog open={isSecondaryDialogOpen} onOpenChange={setIsSecondaryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 mt-[15px] mr-[15px]" disabled={values.filter(v => v.value_type === 'secondary').length >= 6}>
                <Plus className="h-4 w-4" />
                {t('values.addSecondary')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('values.addSecondaryValue')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="secondary-value-name">{t('values.valueName')}</Label>
                  <Input
                    id="secondary-value-name"
                    placeholder={t('values.secondaryPlaceholder')}
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
                  {t('values.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-foreground/80 mb-[15px] mt-[5px] pl-[35px]">
          {t('values.selectConnected')}
        </p>

        <Card className="border-sky-blue/20">
          <CardContent className="p-6 space-y-4">
            {values.filter(v => v.value_type === 'secondary').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('values.noSecondaryValues')}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, 'secondary')}
              >
                <SortableContext
                  items={values.filter(v => v.value_type === 'secondary').map(v => v.id)}
                  strategy={verticalListSortingStrategy}
                  disabled={isMobile}
                >
                  <div className="space-y-4">
                    {values.filter(v => v.value_type === 'secondary').map((value) => (
                      <SortableValueItem
                        key={value.id}
                        value={value}
                        onToggle={() => toggleValue(value.id)}
                        onDelete={() => setDeleteConfirmId(value.id)}
                        onEdit={() => handleEditValue(value)}
                        isEditing={editingValueId === value.id}
                        editName={editValueName}
                        onEditNameChange={setEditValueName}
                        onSaveEdit={() => handleUpdateValue(value.id)}
                        onCancelEdit={() => {
                          setEditingValueId(null);
                          setEditValueName("");
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        <Card className="border-sky-blue/20 bg-gradient-to-br from-sky-blue/5 to-transparent mt-[24px]">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">{t('values.dailyReminder')}</h3>
            <p className="text-foreground/80 text-sm" dangerouslySetInnerHTML={{ __html: t('values.selectedValues', { count: values.filter(v => v.selected).length }) }} />
          </CardContent>
        </Card>
      </div>

      {/* Statistics Widget */}
      <Card className="border-sky-blue/20">
        <CardHeader>
          <CardTitle className="text-2xl">
            {t('values.statistics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">{t('values.thisWeek')}</TabsTrigger>
              <TabsTrigger value="month">{t('values.thisMonth')}</TabsTrigger>
              <TabsTrigger value="quarter">{t('values.quarter')}</TabsTrigger>
            </TabsList>
            <TabsContent value="week" className="mt-6">
              {renderDonutChart(weekStats)}
            </TabsContent>
            <TabsContent value="month" className="mt-6">
              {renderDonutChart(monthStats)}
            </TabsContent>
            <TabsContent value="quarter" className="mt-6">
              {renderDonutChart(quarterStats)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lo que más importa Widget */}
      <Card className="border-sky-blue/20 bg-gradient-to-br from-sky-blue/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            {t('values.whatMatters')}
          </CardTitle>
        </CardHeader>
        <CardContent className="-mt-5">
          <p className="text-foreground/80">
            {t('values.whatMattersDescription')}
          </p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('values.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('values.confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t('values.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && deleteValue(deleteConfirmId)}>
              {t('values.yes')}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
