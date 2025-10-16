import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Users, MoreVertical, Edit2, Flag, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
  room: string;
}

const CHAT_ROOMS = [
  { id: 'narcoticos', label: 'Narcóticos' },
  { id: 'dependencia_emocional', label: 'Dependencia Emocional' },
  { id: 'pornografia', label: 'Pornografía' },
  { id: 'redes_sociales', label: 'Redes Sociales' },
] as const;

export default function Chat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string>('narcoticos');
  const [onlineCountByRoom, setOnlineCountByRoom] = useState<Record<string, number>>({});
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [reportedMessages, setReportedMessages] = useState<Set<string>>(new Set());
  const [isAnonymous, setIsAnonymous] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initializeChat();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentRoom]);

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

    // Load existing messages for current room
    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room', currentRoom)
      .order('created_at', { ascending: true })
      .limit(50);

    if (existingMessages) {
      setMessages(existingMessages);
      scrollToBottom();
    }

    // Load all reported messages (visible to all users)
    const { data: reports } = await supabase
      .from('message_reports')
      .select('message_id');

    if (reports) {
      // Get unique message IDs that have been reported
      const uniqueReportedIds = [...new Set(reports.map(r => r.message_id))];
      setReportedMessages(new Set(uniqueReportedIds));
    }

    // Set up realtime channel for messages and presence for current room
    const channel = supabase.channel(`chat-room-${currentRoom}`, {
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
        const roomUsers = Object.values(state).filter((presence: any) => 
          presence[0]?.room === currentRoom
        );
        setOnlineCountByRoom(prev => ({
          ...prev,
          [currentRoom]: roomUsers.length
        }));
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
        table: 'chat_messages',
        filter: `room=eq.${currentRoom}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (newMsg.room === currentRoom) {
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: userName,
            room: currentRoom,
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
          user_name: isAnonymous ? "Anónimo" : userName,
          message: newMessage.trim(),
          room: currentRoom,
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
    const names = name.trim().split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
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

  const toggleReport = async (messageId: string) => {
    const isCurrentlyReported = reportedMessages.has(messageId);

    if (isCurrentlyReported) {
      // Unreport: remove from database
      try {
        const { error } = await supabase
          .from('message_reports')
          .delete()
          .eq('message_id', messageId)
          .eq('reported_by', userId);

        if (error) throw error;

        setReportedMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });

        toast({
          title: "Denuncia retirada",
          description: "Has retirado tu denuncia de este mensaje",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: "No se pudo retirar la denuncia",
          variant: "destructive",
        });
      }
    } else {
      // Report: add to database
      try {
        const { error } = await supabase
          .from('message_reports')
          .insert({
            message_id: messageId,
            reported_by: userId,
            reason: "Mensaje reportado por el usuario",
          });

        if (error) throw error;

        setReportedMessages(prev => new Set([...prev, messageId]));

        toast({
          title: "Mensaje denunciado",
          description: "Has marcado este mensaje como inapropiado",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: "No se pudo denunciar el mensaje",
          variant: "destructive",
        });
      }
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Mensaje eliminado",
        description: "Tu mensaje ha sido eliminado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje",
        variant: "destructive",
      });
    }
  };

  const currentRoomOnline = onlineCountByRoom[currentRoom] || 0;
  
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="mb-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Chat Comunitario</h1>
          <p className="text-muted-foreground text-lg">Conecta con otros miembros de la comunidad</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col border-primary/20 overflow-hidden">
        <Tabs value={currentRoom} onValueChange={setCurrentRoom} className="flex-1 flex flex-col">
          <div className="bg-muted/30 border-b">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <CardTitle>Chat en Vivo</CardTitle>
                <Badge variant="secondary" className="gap-2">
                  <Users className="h-4 w-4" />
                  {currentRoomOnline} en línea
                </Badge>
              </div>
            </CardHeader>
            <div className="px-6 pb-3">
              <TabsList className="grid w-full grid-cols-4 bg-background">
                {CHAT_ROOMS.map((room) => (
                  <TabsTrigger key={room.id} value={room.id} className="text-xs sm:text-sm whitespace-nowrap">
                    {room.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {CHAT_ROOMS.map((room) => (
            <TabsContent 
              key={room.id} 
              value={room.id} 
              className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden"
            >
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4" ref={scrollRef}>
                    {messages.map((msg) => {
                      const isOwnMessage = msg.user_id === userId;
                      const isEditing = editingMessageId === msg.id;
                      const isReported = reportedMessages.has(msg.id);
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-6 group`}
                        >
                          {isEditing ? (
                            <div className="w-full max-w-[70%] space-y-2">
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
                            <>
                              {isOwnMessage ? (
                                // Own messages: three dots - message - avatar (aligned to right)
                                <div className="flex items-start gap-3 max-w-[80%]">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-popover z-[100]">
                                      <DropdownMenuItem onClick={() => startEditing(msg.id, msg.message)}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => deleteMessage(msg.id)} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="rounded-[28px] px-6 py-3 bg-[#FF7A5C] text-white">
                                      <p className="text-sm">{msg.message}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground pr-6">
                                      {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>

                                  <Avatar className="h-11 w-11 flex-shrink-0 mt-0">
                                    <AvatarFallback className="bg-[#FF7A5C] text-white text-sm font-semibold">
                                      {getInitials(msg.user_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              ) : (
                                // Other messages: avatar - name (above) + message + time (below)
                                <div className="flex items-start gap-3 max-w-[80%]">
                                  <Avatar className="h-11 w-11 flex-shrink-0 mt-0">
                                    <AvatarFallback className="bg-white text-black text-sm font-semibold">
                                      {getInitials(msg.user_name)}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex flex-col gap-1 flex-1">
                                    <span className="text-sm text-muted-foreground pl-6">
                                      {getFirstName(msg.user_name)}
                                    </span>
                                    <div className="flex items-start gap-2">
                                      <div className={`rounded-[28px] px-6 py-3 ${
                                        isReported 
                                          ? 'bg-black border-2 border-red-500' 
                                          : 'bg-[#2A2A2A] text-white'
                                      }`}>
                                        <p className={`text-sm ${isReported ? 'invisible' : ''}`}>
                                          {msg.message}
                                        </p>
                                      </div>
                                      
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => toggleReport(msg.id)}
                                        className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                        title={isReported ? "Quitar denuncia" : "Denunciar"}
                                      >
                                        <Flag className={`h-4 w-4 ${isReported ? 'fill-red-500' : ''} text-red-500`} />
                                      </Button>
                                    </div>
                                    <span className="text-xs text-muted-foreground pl-6">
                                      {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>

              <form onSubmit={sendMessage} className="p-4 border-t space-y-3 bg-background">
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
                <div className="flex items-center gap-2">
                  <Switch
                    id="anonymous-mode"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                  <Label htmlFor="anonymous-mode" className="text-sm text-muted-foreground cursor-pointer">
                    Escribir en modo anónimo
                  </Label>
                </div>
              </form>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}
