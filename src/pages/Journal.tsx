import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Search, Mic, Square, Loader2, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const ENTRIES_PER_PAGE = 3;

  useEffect(() => {
    loadEntries();
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const reflectionParam = urlParams.get('reflection');
    const titleParam = urlParams.get('title');
    
    if (reflectionParam) {
      setEntryTitle(reflectionParam);
      setShowNewEntry(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', '/journal');
    } else if (titleParam) {
      setEntryTitle(titleParam);
      setShowNewEntry(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', '/journal');
    } else {
      // Load draft from localStorage only if no URL parameters
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
        title: t('common.error'),
        description: t('journal.errorLoading'),
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
        title: t('journal.recording'),
        description: t('journal.speakNow'),
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: t('common.error'),
        description: t('journal.microphoneError'),
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
              title: t('common.error'),
              description: t('journal.loginRequired'),
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
              title: t('journal.voiceEntryTitle') + " " + new Date().toLocaleDateString(t('common.yes') === 'Yes' ? 'en-US' : 'es-ES'),
              content: data.text,
              tags: ["voz"]
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (newEntry) {
            setEntries(prev => [newEntry, ...prev]);
            
            toast({
              title: t('journal.entryCreated'),
              description: t('journal.voiceCreated'),
            });
          }
        }
        
        setIsProcessingQuick(false);
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: t('common.error'),
        description: t('journal.errorTranscribing'),
        variant: "destructive",
      });
      setIsProcessingQuick(false);
    }
  };

  const saveEntry = async () => {
    if (!entryTitle.trim() || !entryContent.trim()) {
      toast({
        title: t('common.error'),
        description: t('journal.completeFields'),
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t('common.error'),
          description: t('journal.loginRequired'),
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
          title: t('journal.entryUpdated'),
          description: t('journal.entrySuccessfullyUpdated'),
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
            title: t('journal.entrySaved'),
            description: t('journal.entrySuccessfullySaved'),
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
        title: t('common.error'),
        description: t('journal.errorSaving'),
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
        title: t('journal.entryDeleted'),
        description: t('journal.entrySuccessfullyDeleted'),
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: t('common.error'),
        description: t('journal.errorDeleting'),
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

  const toggleExpandEntry = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const getDisplayContent = (entry: JournalEntry) => {
    const MAX_LENGTH = 300;
    const isExpanded = expandedEntries.has(entry.id);
    
    if (entry.content.length <= MAX_LENGTH || isExpanded) {
      return entry.content;
    }
    
    return entry.content.slice(0, MAX_LENGTH) + "...";
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
  const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
  const endIndex = startIndex + ENTRIES_PER_PAGE;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadDemoEntries = async () => {
    setIsLoadingDemo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t('common.error'),
          description: t('journal.loginRequired'),
          variant: "destructive",
        });
        setIsLoadingDemo(false);
        return;
      }

      const demoEntries = [
        {
          user_id: user.id,
          title: 'Mi primer día',
          content: 'Hoy comencé mi camino hacia la recuperación. Me siento esperanzado pero también nervioso. Sé que no será fácil, pero estoy comprometido con este cambio.',
          tags: ['inicio', 'esperanza', 'compromiso'],
          entry_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          user_id: user.id,
          title: 'Reflexiones sobre mi pasado',
          content: 'Hoy estuve pensando en las razones que me llevaron a este punto. No fue un solo evento, sino una serie de decisiones. Pero ahora puedo cambiar el rumbo.',
          tags: ['reflexión', 'autoconocimiento'],
          entry_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          user_id: user.id,
          title: 'Un día difícil',
          content: 'Hoy tuve tentaciones fuertes. Pero llamé a mi red de apoyo y pude superarlo. Aprendí que pedir ayuda no es debilidad, es fortaleza.',
          tags: ['desafío', 'apoyo', 'fortaleza'],
          entry_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          user_id: user.id,
          title: 'Pequeñas victorias',
          content: 'Hoy celebré una semana limpio. Puede parecer poco para algunos, pero para mí es un logro enorme. Cada día cuenta.',
          tags: ['victoria', 'celebración', 'gratitud'],
          entry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          user_id: user.id,
          title: 'Descubriendo mis valores',
          content: 'Hice el ejercicio de identificar mis valores más importantes. Me di cuenta de que había estado viviendo de una manera que contradecía lo que realmente importa para mí.',
          tags: ['valores', 'autoconocimiento', 'propósito'],
          entry_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          user_id: user.id,
          title: 'Agradecimiento',
          content: 'Hoy practiqué la gratitud. Estoy agradecido por mi familia, por esta oportunidad de cambio, y por cada día que avanzo en mi recuperación.',
          tags: ['gratitud', 'familia', 'positivo'],
          entry_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          user_id: user.id,
          title: 'Aprendiendo a sentir',
          content: 'Por primera vez en mucho tiempo, permití sentir mis emociones sin escapar de ellas. Fue incómodo pero liberador.',
          tags: ['emociones', 'crecimiento', 'honestidad'],
          entry_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          user_id: user.id,
          title: 'Mi rutina de bienestar',
          content: 'Establecí una rutina matutina que incluye meditación y ejercicio. Me hace sentir más centrado y en control de mi día.',
          tags: ['rutina', 'bienestar', 'meditación'],
          entry_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          user_id: user.id,
          title: 'Mirando hacia adelante',
          content: 'Hoy reflexioné sobre mis metas a largo plazo. Quiero reconstruir las relaciones que dañé y encontrar un propósito que me llene.',
          tags: ['futuro', 'metas', 'relaciones'],
          entry_date: new Date().toISOString().split('T')[0]
        }
      ];

      const { data, error } = await supabase
        .from('journal_entries')
        .insert(demoEntries)
        .select();

      if (error) throw error;

      if (data) {
        setEntries(prev => [...data.reverse(), ...prev]);
        toast({
          title: t('journal.entrySaved'),
          description: t('journal.demoLoaded'),
        });
      }
    } catch (error) {
      console.error('Error loading demo entries:', error);
      toast({
        title: t('common.error'),
        description: t('journal.errorDemo'),
        variant: "destructive",
      });
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <div className="space-y-[35px] animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('journal.searchInJournal')}
              className="pl-10 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewEntry(true)} className="gap-2 h-10">
            <Plus className="h-4 w-4" />
            {t('journal.newEntryButton')}
          </Button>
          
          {!isRecordingQuick && !isProcessingQuick && (
            <Button
              variant="outline"
              onClick={startQuickRecording}
              className="gap-2 h-10"
            >
              <Mic className="h-4 w-4" />
              {t('journal.recordAudio')}
            </Button>
          )}
          
          {isRecordingQuick && (
            <Button
              variant="destructive"
              onClick={stopQuickRecording}
              className="gap-2 animate-pulse h-10"
            >
              <Square className="h-4 w-4" />
              {t('journal.stop')}
            </Button>
          )}
          
          {isProcessingQuick && (
            <Button
              variant="outline"
              disabled
              className="gap-2 h-10"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('journal.transcribing')}
            </Button>
          )}
        </div>
      </div>

      {showNewEntry && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{editingEntryId ? t('journal.editEntry') : t('journal.newJournalEntry')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder={t('journal.entryTitlePlaceholder')} 
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
            />
            <div className="space-y-2">
              <Textarea
                placeholder={t('journal.writeYourThoughts')}
                className="min-h-[200px]"
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
              />
              <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
            </div>
            <Input 
              placeholder={t('journal.tagsPlaceholder')} 
              value={entryTags}
              onChange={(e) => setEntryTags(e.target.value)}
            />
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={saveEntry}
              >
                {editingEntryId ? t('journal.updateEntry') : t('journal.saveEntry')}
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
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-[20px]">
        {!isLoading && entries.length > 0 && (
          <h2 className="text-2xl font-semibold text-foreground pl-6">{t('journal.recentEntries')}</h2>
        )}
        {isLoading ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">{t('journal.loadingEntries')}</p>
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center space-y-4">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">{t('journal.noEntriesYet')}</p>
              <div className="flex flex-col gap-3 items-center">
                <Button onClick={() => setShowNewEntry(true)} size="icon" className="h-12 w-12">
                  <Plus className="h-6 w-6" />
                </Button>
                <Button 
                  onClick={loadDemoEntries} 
                  variant="outline"
                  disabled={isLoadingDemo}
                  className="gap-2"
                >
                  {isLoadingDemo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('journal.loading')}
                    </>
                  ) : (
                    t('journal.loadDemoEntries')
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredEntries.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('journal.noEntriesFound')} "{searchTerm}"</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {currentEntries.map((entry) => (
              <Card key={entry.id} className="border-border hover:border-border/60 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl">{entry.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString(t('common.yes') === 'Yes' ? 'en-US' : 'es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }).replace(/^\w/, c => c.toUpperCase()).replace(/\sde\s(\w)/, (match, p1) => ` de ${p1.toUpperCase()}`)}
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
                  <p className="text-foreground/80 mb-4 whitespace-pre-line">{getDisplayContent(entry)}</p>
                  {entry.content.length > 300 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpandEntry(entry.id)}
                      className="mb-4 bg-white text-black border-black hover:bg-green-500 hover:text-white hover:border-green-500"
                    >
                      {expandedEntries.has(entry.id) ? t('journal.readLess') : t('journal.readMore')}
                    </Button>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => setSearchTerm(tag)}
                        className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination Controls */}
            {filteredEntries.length > ENTRIES_PER_PAGE && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {currentPage > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                
                <span className="text-sm text-muted-foreground px-4">
                  {t('journal.pageOf')} {currentPage} {t('journal.of')} {totalPages}
                </span>
                
                {currentPage < totalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('journal.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('journal.confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && deleteEntry(deleteConfirmId)}>
              {t('journal.yes')}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Tools */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4 text-foreground pl-5">{t('emotionJournal.quickAccess')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[15px]">
          <Link to="/journal">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-primary" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">📔</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">{t('journal.title')}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/emotion-journal">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-primary" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">😊</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">{t('emotionJournal.emotionDiary')}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/gratitude">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-accent" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">🙏</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">{t('gratitude.title')}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/tools">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-destructive" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">🚨</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">{t('quickTools.emergencyPlan')}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
