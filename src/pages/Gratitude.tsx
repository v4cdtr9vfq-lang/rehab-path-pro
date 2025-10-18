import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Plus, Pencil, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface GratitudeItem {
  text: string;
  timestamp: Date;
}

interface GratitudeEntry {
  id: string;
  date: Date;
  items: GratitudeItem[];
}

export default function Gratitude() {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('gratitude_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      // Group entries by date
      const groupedEntries: GratitudeEntry[] = [];
      data?.forEach((entry: any) => {
        const entryDate = new Date(entry.entry_date);
        const existingEntry = groupedEntries.find(e => 
          e.date.toDateString() === entryDate.toDateString()
        );

        const item: GratitudeItem = {
          text: entry.text,
          timestamp: new Date(entry.created_at)
        };

        if (existingEntry) {
          existingEntry.items.push(item);
        } else {
          groupedEntries.push({
            id: entry.entry_date,
            date: entryDate,
            items: [item]
          });
        }
      });

      setEntries(groupedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const addGratitudeItem = async () => {
    if (newItem.trim()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Error",
            description: "Debes iniciar sesión para guardar entradas",
            variant: "destructive"
          });
          return;
        }

        const { error } = await (supabase as any)
          .from('gratitude_entries')
          .insert({
            user_id: user.id,
            text: newItem,
            entry_date: new Date().toISOString().split('T')[0]
          });

        if (error) throw error;

        toast({
          title: "Guardado",
          description: "Tu entrada de gratitud ha sido guardada"
        });

        setNewItem("");
        await loadEntries();
      } catch (error) {
        console.error('Error adding entry:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar tu entrada",
          variant: "destructive"
        });
      }
    }
  };

  const startEditing = (index: number, text: string) => {
    setEditingIndex(index);
    setEditText(text);
  };

  const saveEdit = () => {
    if (editText.trim() && editingIndex !== null) {
      const today = entries.find(e => 
        e.date.toDateString() === new Date().toDateString()
      );
      
      if (today) {
        setEntries(entries.map(e => 
          e.id === today.id 
            ? { 
                ...e, 
                items: e.items.map((item, i) => 
                  i === editingIndex ? { ...item, text: editText } : item
                )
              }
            : e
        ));
      }
    }
    setEditingIndex(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditText("");
  };

  const todayEntry = entries.find(e => 
    e.date.toDateString() === new Date().toDateString()
  );

  // Filter entries by date if a filter date is selected
  const pastEntries = entries.filter(e => e.date.toDateString() !== new Date().toDateString());
  const filteredPastEntries = filterDate
    ? pastEntries.filter(entry => entry.date.toDateString() === filterDate.toDateString())
    : pastEntries;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-sky-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sky-blue" />
            Gratitud de Hoy
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Textarea
              placeholder="¿Por qué estás agradecido hoy y cómo te hace sentir?"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="min-h-[100px] text-base"
            />
            <Button onClick={addGratitudeItem} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Añadir a la Lista de Hoy
            </Button>
          </div>

          {todayEntry && todayEntry.items.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-foreground">Hoy estoy agradecido por:</h3>
              <ul className="space-y-2">
                {todayEntry.items.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-sky-blue/5 border border-sky-blue/10"
                  >
                    <span className="text-sky-blue mt-1">•</span>
                    <div className="flex-1 space-y-1">
                      {editingIndex === index ? (
                        <div className="flex gap-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button size="sm" onClick={saveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-foreground flex-1">{item.text}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => startEditing(index, item.text)}
                              className="h-6 w-6 p-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(!todayEntry || todayEntry.items.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aún no has añadido nada a tu lista de hoy</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-sky-blue/20 bg-gradient-to-br from-sky-blue/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            Por qué Importa la gratitud
            <span>🙏</span>
            <span>🙏</span>
            <span>🙏</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">
            Practicar la gratitud cambia tu enfoque de lo que falta a lo que está presente. 
            La práctica regular de gratitud ha demostrado mejorar la salud mental, fortalecer relaciones 
            y apoyar la recuperación a largo plazo.
          </p>
        </CardContent>
      </Card>

      {pastEntries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Registro de agradecimientos</h2>
            
            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filterDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, "d 'de' MMMM, yyyy", { locale: es }) : "Buscar por fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={setFilterDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
                {filterDate && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setFilterDate(undefined)}
                    >
                      Limpiar filtro
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-4">
            {filteredPastEntries.length > 0 ? (
              filteredPastEntries.map((entry) => (
                <Card key={entry.id} className="border-sky-blue/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {entry.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {entry.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-sky-blue/5 border border-sky-blue/10">
                          <span className="text-sky-blue mt-1">•</span>
                          <div className="flex-1 space-y-1">
                            <span className="text-foreground">{item.text}</span>
                            <div className="text-xs text-muted-foreground">
                              {item.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-sky-blue/20">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No hay entradas para la fecha seleccionada.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
