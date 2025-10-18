import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Plus, Pencil, Check, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface GratitudeItem {
  id: string;
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
  const [editingId, setEditingId] = useState<string | null>(null);
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
          id: entry.id,
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

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = async () => {
    if (editText.trim() && editingId) {
      try {
        const { error } = await (supabase as any)
          .from('gratitude_entries')
          .update({ text: editText })
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Actualizado",
          description: "Tu entrada ha sido actualizada"
        });

        setEditingId(null);
        setEditText("");
        await loadEntries();
      } catch (error) {
        console.error('Error updating entry:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar tu entrada",
          variant: "destructive"
        });
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('gratitude_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Eliminado",
        description: "Tu entrada ha sido eliminada"
      });

      await loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar tu entrada",
        variant: "destructive"
      });
    }
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
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-sky-blue" />
            Gratitud de hoy:
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase()).replace(/\sde\s(\w)/, (match, p1) => ` de ${p1.toUpperCase()}`)}
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
              Añadir
            </Button>
          </div>

          {todayEntry && todayEntry.items.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-foreground">Hoy estoy agradecido por:</h3>
              <ul className="space-y-2">
                {todayEntry.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-sky-blue/5 border border-border"
                  >
                    <span className="text-sky-blue mt-1">🙏</span>
                    <div className="flex-1 space-y-1">
                      {editingId === item.id ? (
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
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => startEditing(item.id, item.text)}
                                className="h-6 w-6 p-0"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => deleteEntry(item.id)}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
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

      {/* Example Entry Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Registro de agradecimientos:</h3>
          
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
        
        <Card className="border-border bg-gradient-to-br from-sky-blue/10 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Lunes, 15 de enero de 2025
              </span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-3 p-3 rounded-lg bg-sky-blue/5 border border-border">
                <span className="text-sky-blue mt-1">🙏</span>
                <div className="flex-1 space-y-1">
                  <span className="text-foreground">Por el apoyo incondicional de mi familia durante mi proceso de recuperación</span>
                  <div className="text-xs text-muted-foreground">09:30</div>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 rounded-lg bg-sky-blue/5 border border-border">
                <span className="text-sky-blue mt-1">🙏</span>
                <div className="flex-1 space-y-1">
                  <span className="text-foreground">Por poder disfrutar de un café caliente en la mañana y sentir paz interior</span>
                  <div className="text-xs text-muted-foreground">10:15</div>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 rounded-lg bg-sky-blue/5 border border-border">
                <span className="text-sky-blue mt-1">🙏</span>
                <div className="flex-1 space-y-1">
                  <span className="text-foreground">Por mi salud y la capacidad de hacer ejercicio hoy</span>
                  <div className="text-xs text-muted-foreground">14:20</div>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 rounded-lg bg-sky-blue/5 border border-border">
                <span className="text-sky-blue mt-1">🙏</span>
                <div className="flex-1 space-y-1">
                  <span className="text-foreground">Por las pequeñas victorias del día y por seguir adelante</span>
                  <div className="text-xs text-muted-foreground">20:45</div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-gradient-to-br from-sky-blue/5 to-transparent">
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-foreground">Historial de registros</h2>
            
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
                <Card key={entry.id} className="border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {entry.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {entry.items.map((item) => (
                        <li key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-sky-blue/5 border border-border">
                          <span className="text-sky-blue mt-1">🙏</span>
                          <div className="flex-1 space-y-1">
                            {editingId === item.id ? (
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
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => startEditing(item.id, item.text)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => deleteEntry(item.id)}
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-border">
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
