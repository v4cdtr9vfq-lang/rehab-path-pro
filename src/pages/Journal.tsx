import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Search, Mic, Square, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  content: string;
  tags: string[];
}

export default function Journal() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryContent, setEntryContent] = useState("");
  const [isRecordingQuick, setIsRecordingQuick] = useState(false);
  const [isProcessingQuick, setIsProcessingQuick] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleTranscriptionComplete = (text: string) => {
    setEntryContent(prev => prev ? `${prev}\n\n${text}` : text);
  };

  const startQuickRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessingQuick(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAndCreateEntry(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingQuick(true);
      
      toast({
        title: "Grabando",
        description: "Habla ahora para crear una entrada automática...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono",
        variant: "destructive",
      });
    }
  };

  const stopQuickRecording = () => {
    if (mediaRecorderRef.current && isRecordingQuick) {
      mediaRecorderRef.current.stop();
      setIsRecordingQuick(false);
    }
  };

  const transcribeAndCreateEntry = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data?.text) {
          // Crear una nueva entrada automáticamente con el texto transcrito
          const newEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: new Date(),
            title: "Entrada de voz - " + new Date().toLocaleDateString('es-ES'),
            content: data.text,
            tags: ["voz"]
          };
          
          setEntries(prev => [newEntry, ...prev]);
          
          toast({
            title: "Entrada creada",
            description: "Tu audio ha sido transcrito y guardado como nueva entrada",
          });
        }
        
        setIsProcessingQuick(false);
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Error",
        description: "No se pudo transcribir el audio",
        variant: "destructive",
      });
      setIsProcessingQuick(false);
    }
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
        <div className="flex gap-2">
          <Button onClick={() => setShowNewEntry(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Entrada
          </Button>
          
          {!isRecordingQuick && !isProcessingQuick && (
            <Button
              variant="outline"
              onClick={startQuickRecording}
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              Grabar Audio
            </Button>
          )}
          
          {isRecordingQuick && (
            <Button
              variant="destructive"
              onClick={stopQuickRecording}
              className="gap-2 animate-pulse"
            >
              <Square className="h-4 w-4" />
              Detener
            </Button>
          )}
          
          {isProcessingQuick && (
            <Button
              variant="outline"
              disabled
              className="gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribiendo...
            </Button>
          )}
        </div>
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
