import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Sparkles, Pencil, Check, X } from "lucide-react";
import { useState } from "react";

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

  const addGratitudeItem = () => {
    if (newItem.trim()) {
      const today = entries.find(e => 
        e.date.toDateString() === new Date().toDateString()
      );
      
      const newGratitudeItem: GratitudeItem = {
        text: newItem,
        timestamp: new Date()
      };
      
      if (today) {
        setEntries(entries.map(e => 
          e.id === today.id 
            ? { ...e, items: [...e.items, newGratitudeItem] }
            : e
        ));
      } else {
        setEntries([{
          id: Date.now().toString(),
          date: new Date(),
          items: [newGratitudeItem]
        }, ...entries]);
      }
      setNewItem("");
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Lista de Gratitud</h1>
        <p className="text-muted-foreground text-lg">Cultiva la gratitud y reconoce las bendiciones de la vida</p>
      </div>

      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-accent" />
            Por Qué Importa la Gratitud
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

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
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
                    className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <span className="text-primary mt-1">•</span>
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

      {entries.length > 0 && entries.filter(e => e.date.toDateString() !== new Date().toDateString()).length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Entradas Recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {entries.filter(e => e.date.toDateString() !== new Date().toDateString()).map((entry) => (
              <div key={entry.id} className="p-4 rounded-lg bg-card/50 border border-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {entry.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <ul className="space-y-2">
                  {entry.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/80">
                      <span className="text-accent">•</span>
                      <div className="flex-1 space-y-1">
                        <span>{item.text}</span>
                        <div className="text-xs text-muted-foreground">
                          {item.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
