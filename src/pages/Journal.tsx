import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Search, Mic, Square, Loader2, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export default function Journal() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryContent, setEntryContent] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryTags, setEntryTags] = useState("");
  const [isRecordingQuick, setIsRecordingQuick] = useState(false);
  const [isProcessingQuick, setIsProcessingQuick] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    loadEntries();
    
    // Check for reflection parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const reflectionParam = urlParams.get('reflection');
    
    if (reflectionParam) {
      setEntryTitle(reflectionParam);
      setShowNewEntry(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', '/journal');
    } else {
      // Load draft from localStorage only if no reflection parameter
      const savedTitle = localStorage.getItem('journal-draft-title');
      const savedContent = localStorage.getItem('journal-draft-content');
      const savedTags = localStorage.getItem('journal-draft-tags');
      
      if (savedTitle) setEntryTitle(savedTitle);
      if (savedContent) setEntryContent(savedContent);
      if (savedTags) setEntryTags(savedTags);
    }
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (showNewEntry) {
      localStorage.setItem('journal-draft-title', entryTitle);
      localStorage.setItem('journal-draft-content', entryContent);
      localStorage.setItem('journal-draft-tags', entryTags);
    }
  }, [entryTitle, entryContent, entryTags, showNewEntry]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las entradas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        description: "Habla ahora para crear una entrada automática.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono.",
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
          // Obtener el usuario actual
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            toast({
              title: "Error",
              description: "Debes iniciar sesión para guardar entradas.",
              variant: "destructive",
            });
            setIsProcessingQuick(false);
            return;
          }

          // Guardar en la base de datos
          const { data: newEntry, error: insertError } = await supabase
            .from('journal_entries')
            .insert({
              user_id: user.id,
              title: "Entrada de voz - " + new Date().toLocaleDateString('es-ES'),
              content: data.text,
              tags: ["voz"]
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (newEntry) {
            setEntries(prev => [newEntry, ...prev]);
            
            toast({
              title: "Entrada creada",
              description: "Tu audio ha sido transcrito y guardado como nueva entrada.",
            });
          }
        }
        
        setIsProcessingQuick(false);
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Error",
        description: "No se pudo transcribir el audio.",
        variant: "destructive",
      });
      setIsProcessingQuick(false);
    }
  };

  const saveEntry = async () => {
    if (!entryTitle.trim() || !entryContent.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa el título y contenido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para guardar entradas.",
          variant: "destructive",
        });
        return;
      }

      const tags = entryTags.split(',').map(tag => tag.trim()).filter(tag => tag);

      if (editingEntryId) {
        // Update existing entry
        const { error } = await supabase
          .from('journal_entries')
          .update({
            title: entryTitle,
            content: entryContent,
            tags
          })
          .eq('id', editingEntryId);

        if (error) throw error;

        setEntries(prev => prev.map(entry => 
          entry.id === editingEntryId 
            ? { ...entry, title: entryTitle, content: entryContent, tags }
            : entry
        ));

        toast({
          title: "Entrada actualizada",
          description: "Tu entrada ha sido actualizada exitosamente.",
        });
      } else {
        // Create new entry
        const { data: newEntry, error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user.id,
            title: entryTitle,
            content: entryContent,
            tags
          })
          .select()
          .single();

        if (error) throw error;

        if (newEntry) {
          setEntries(prev => [newEntry, ...prev]);
          
          toast({
            title: "Entrada guardada",
            description: "Tu entrada ha sido guardada exitosamente.",
          });
        }
      }

      setShowNewEntry(false);
      setEditingEntryId(null);
      setEntryTitle("");
      setEntryContent("");
      setEntryTags("");
      
      // Clear draft from localStorage after successful save
      localStorage.removeItem('journal-draft-title');
      localStorage.removeItem('journal-draft-content');
      localStorage.removeItem('journal-draft-tags');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la entrada.",
        variant: "destructive",
      });
    }
  };

  const deleteEntry = async (entryId: string) => {
    setDeleteConfirmId(null);
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      toast({
        title: "Entrada eliminada",
        description: "La entrada ha sido eliminada exitosamente.",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la entrada.",
        variant: "destructive",
      });
    }
  };

  const startEditEntry = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setEntryTitle(entry.title);
    setEntryContent(entry.content);
    setEntryTags(entry.tags.join(', '));
    setShowNewEntry(true);
  };

  const filteredEntries = entries.filter(entry => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      entry.title.toLowerCase().includes(search) ||
      entry.content.toLowerCase().includes(search) ||
      entry.tags.some(tag => tag.toLowerCase().includes(search))
    );
  });

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <CardTitle>{editingEntryId ? 'Editar entrada' : 'Nueva entrada de diario'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder="Título de la entrada..." 
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
            />
            <div className="space-y-2">
              <Textarea
                placeholder="Escribe tus pensamientos..."
                className="min-h-[200px]"
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
              />
              <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
            </div>
            <Input 
              placeholder="Etiquetas (separadas por comas)" 
              value={entryTags}
              onChange={(e) => setEntryTags(e.target.value)}
            />
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={saveEntry}
              >
                {editingEntryId ? 'Actualizar Entrada' : 'Guardar Entrada'}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowNewEntry(false);
                setEditingEntryId(null);
                setEntryTitle("");
                setEntryContent("");
                setEntryTags("");
                
                // Clear draft from localStorage on cancel
                localStorage.removeItem('journal-draft-title');
                localStorage.removeItem('journal-draft-content');
                localStorage.removeItem('journal-draft-tags');
              }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Entradas recientes</h2>
        {isLoading ? (
          <Card className="border-primary/20">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Cargando entradas...</p>
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
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
        ) : filteredEntries.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron entradas que coincidan con "{searchTerm}"</p>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="border-primary/20 hover:border-primary/40 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{entry.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditEntry(entry)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirmId(entry.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar esta entrada? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && deleteEntry(deleteConfirmId)}>
              Sí
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
