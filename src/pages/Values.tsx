import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Plus, X, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

export default function Values() {
  const [values, setValues] = useState([
    { id: "1", name: "Autocuidado", selected: false },
    { id: "2", name: "Gratitud", selected: false },
    { id: "3", name: "Humor", selected: false },
    { id: "4", name: "Respeto", selected: false },
    { id: "5", name: "Salud", selected: false },
    { id: "6", name: "Consideración", selected: false },
    { id: "7", name: "Compromiso", selected: false },
  ]);

  const toggleValue = (id: string) => {
    setValues(prev =>
      prev.map(v => v.id === id ? { ...v, selected: !v.selected } : v)
    );
  };

  const deleteValue = (id: string) => {
    setValues(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Mis Valores</h1>
        <p className="text-muted-foreground text-lg">Define y vive según tus valores fundamentales cada día</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-accent/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-accent" />
            Lo Que Más Importa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">
            Tus valores son los principios que guían tu camino de recuperación. Selecciona los valores en los que quieres enfocarte hoy, 
            y te recordaremos honrarlos durante el día.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-foreground">Tus Valores</h2>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Añadir Valor
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-4">
            {values.map((value) => (
              <div
                key={value.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  value.selected
                    ? "bg-green-500/10 border-2 border-green-500/30"
                    : "bg-card/50 border-2 border-transparent hover:border-primary/10"
                }`}
              >
                <button
                  onClick={() => toggleValue(value.id)}
                  className="flex-shrink-0"
                >
                  {value.selected ? (
                    <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    </div>
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
                  onClick={() => deleteValue(value.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">💡 Recordatorio Diario de Valores</h3>
            <p className="text-foreground/80 text-sm">
              Has seleccionado <span className="font-bold text-green-500">{values.filter(v => v.selected).length} valores</span> para hoy. 
              Te haremos un seguimiento durante tu check-in diario para ver si has honrado estos valores.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
