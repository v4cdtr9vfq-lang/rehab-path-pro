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
import { Link } from "react-router-dom";

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
    ? pastEntries.filter(entry => {
        const filterDateStr = `${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, '0')}-${String(filterDate.getDate()).padStart(2, '0')}`;
        const entryDateStr = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}-${String(entry.date.getDate()).padStart(2, '0')}`;
        return entryDateStr === filterDateStr;
      })
    : pastEntries;

  return (
    <div className="space-y-[35px] animate-in fade-in duration-500">
      <div>
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between pl-[14px] gap-2">
              <span>Gratitud de hoy:</span>
              <span className="text-sm font-normal text-muted-foreground md:pr-6">
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
            <div className="space-y-3 pt-4">
              <h3 className="font-semibold text-foreground pl-[14px]">Hoy estoy agradecido por:</h3>
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
            <div className="text-center py-3 text-muted-foreground">
              <p>Aún no has añadido nada a tu lista de hoy</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {pastEntries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 pl-[35px]">
            <h2 className="text-xl font-bold text-foreground">Historial:</h2>
            
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
                        {format(entry.date, "EEEE, d 'de' MMM. 'de' yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())}
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

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-3 pl-[5px] md:pl-[35px] flex items-center gap-2">
          Por qué es tan importante
          <span>🙏</span>
          <span>🙏</span>
          <span>🙏</span>
        </h2>
        <Card className="border-border bg-gradient-to-br from-sky-blue/5 to-transparent">
          <CardContent className="pt-6">
            <p className="text-foreground/80">
              Practicar la gratitud cambia tu enfoque de lo que falta a lo que está presente. 
              La práctica regular de gratitud ha demostrado mejorar la salud mental, fortalecer relaciones 
              y apoyar la recuperación a largo plazo.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tools */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4 text-foreground pl-5">Accesos directos:</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[15px]">
          <Link to="/journal">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-primary" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">📔</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">Diario</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/emotion-journal">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-primary" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">😊</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">Diario de emociones</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/gratitude">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-accent" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">🙏</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">Agradecimiento</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/tools">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-destructive" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">🚨</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">Plan de emergencia</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
