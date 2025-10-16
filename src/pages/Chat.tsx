import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Users, MoreVertical, Edit2, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

export default function Chat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initializeChat();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const initializeChat = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para usar el chat",
        variant: "destructive",
      });
      return;
    }

    setUserId(user.id);
    setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario');

    // Load existing messages
    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (existingMessages) {
      setMessages(existingMessages);
      scrollToBottom();
    }

    // Set up realtime channel for messages and presence
    const channel = supabase.channel('chat-room', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: userName,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          user_name: userName,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const startEditing = (messageId: string, currentMessage: string) => {
    setEditingMessageId(messageId);
    setEditedMessage(currentMessage);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditedMessage("");
  };

  const saveEdit = async (messageId: string) => {
    if (!editedMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ message: editedMessage.trim() })
        .eq('id', messageId);

      if (error) throw error;

      setEditingMessageId(null);
      setEditedMessage("");
      
      toast({
        title: "Mensaje editado",
        description: "Tu mensaje ha sido actualizado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo editar el mensaje",
        variant: "destructive",
      });
    }
  };

  const openReportDialog = (messageId: string) => {
    setReportingMessageId(messageId);
    setReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (!reportingMessageId || !reportReason.trim()) return;

    try {
      const { error } = await supabase
        .from('message_reports')
        .insert({
          message_id: reportingMessageId,
          reported_by: userId,
          reason: reportReason.trim(),
        });

      if (error) throw error;

      setReportDialogOpen(false);
      setReportingMessageId(null);
      setReportReason("");
      
      toast({
        title: "Denuncia enviada",
        description: "Gracias por ayudar a mantener la comunidad segura",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo enviar la denuncia",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Chat Comunitario</h1>
            <p className="text-muted-foreground text-lg">Conecta con otros miembros de la comunidad</p>
          </div>
          <Badge variant="secondary" className="gap-2 px-4 py-2 text-base">
            <Users className="h-4 w-4" />
            {onlineCount} en línea
          </Badge>
        </div>
      </div>

      <Card className="flex-1 flex flex-col border-primary/20 overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            Chat en Vivo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.user_id === userId;
                const isEditing = editingMessageId === msg.id;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} group`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                        {getInitials(msg.user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%] flex-1`}>
                      <span className="text-xs text-muted-foreground mb-1">
                        {isOwnMessage ? 'Tú' : msg.user_name}
                      </span>
                      
                      {isEditing ? (
                        <div className="w-full space-y-2">
                          <Textarea
                            value={editedMessage}
                            onChange={(e) => setEditedMessage(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(msg.id)}>
                              Guardar
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="flex items-center gap-2 group/message">
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm break-words">{msg.message}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 opacity-0 group-hover/message:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isOwnMessage ? "end" : "start"} className="bg-popover">
                                {isOwnMessage && (
                                  <DropdownMenuItem onClick={() => startEditing(msg.id, msg.message)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openReportDialog(msg.id)}>
                                  <Flag className="h-4 w-4 mr-2" />
                                  Denunciar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="w-full flex justify-end mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <form onSubmit={sendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1"
                disabled={isSending}
              />
              <Button type="submit" disabled={!newMessage.trim() || isSending} className="gap-2">
                <Send className="h-4 w-4" />
                Enviar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar mensaje</DialogTitle>
            <DialogDescription>
              Por favor, describe el motivo de tu denuncia. Nuestro equipo revisará este mensaje.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Describe el problema con este mensaje..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitReport} disabled={!reportReason.trim()}>
              Enviar denuncia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
