import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Search } from "lucide-react";
import { useState } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";

interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  content: string;
  tags: string[];
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryContent, setEntryContent] = useState("");

  const handleTranscriptionComplete = (text: string) => {
    setEntryContent(prev => prev ? `${prev}\n\n${text}` : text);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Diario</h1>
        <p className="text-muted-foreground text-lg">Captura tus pensamientos, sentimientos y reflexiones</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en tu diario..."
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setShowNewEntry(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Entrada
        </Button>
      </div>

      {showNewEntry && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Nueva Entrada de Diario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Título de la entrada..." />
            <div className="space-y-2">
              <Textarea
                placeholder="Escribe tus pensamientos..."
                className="min-h-[200px]"
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
              />
              <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
            </div>
            <Input placeholder="Etiquetas (separadas por comas)" />
            <div className="flex gap-2">
              <Button className="flex-1">Guardar Entrada</Button>
              <Button variant="outline" onClick={() => setShowNewEntry(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Entradas Recientes</h2>
        {entries.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Aún no has creado ninguna entrada</p>
              <Button onClick={() => setShowNewEntry(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Primera Entrada
              </Button>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="border-primary/20 hover:shadow-medium transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{entry.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {entry.date.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 mb-4">{entry.content}</p>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
