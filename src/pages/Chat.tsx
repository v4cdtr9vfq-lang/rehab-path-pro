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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

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
  { id: 'dependencia_emocional', label: 'Codependencia' },
  { id: 'pornografia', label: 'Pornografía' },
  { id: 'redes_sociales', label: 'Redes Sociales' },
  { id: 'compras', label: 'Compras' },
  { id: 'videojuegos', label: 'Videojuegos' },
  { id: 'comida', label: 'Comida' },
  { id: 'otros', label: 'Otros' },
] as const;

export default function Chat() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string>('narcoticos');
  const [onlineCountByRoom, setOnlineCountByRoom] = useState<Record<string, number>>({
    narcoticos: 0,
    dependencia_emocional: 0,
    pornografia: 0,
    redes_sociales: 0,
    compras: 0,
    videojuegos: 0,
    comida: 0,
    otros: 0
  });
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [reportedMessages, setReportedMessages] = useState<Set<string>>(new Set());
  const [myReports, setMyReports] = useState<Set<string>>(new Set());
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousNumber, setAnonymousNumber] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initializeChat();
    // Load anonymous number from sessionStorage for this room
    const storedNumber = sessionStorage.getItem(`anonymous_number_${currentRoom}`);
    if (storedNumber) {
      setAnonymousNumber(parseInt(storedNumber));
    } else {
      setAnonymousNumber(null);
    }
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
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
    console.log('Nombre del usuario:', fullName, 'Iniciales:', getInitials(fullName));
    setUserName(fullName);

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
      .select('message_id, reported_by');

    if (reports) {
      // Get unique message IDs that have been reported
      const uniqueReportedIds = [...new Set(reports.map(r => r.message_id))];
      setReportedMessages(new Set(uniqueReportedIds));
      
      // Get message IDs reported by current user
      const myReportedIds = reports
        .filter(r => r.reported_by === user.id)
        .map(r => r.message_id);
      setMyReports(new Set(myReportedIds));
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
        console.log('Presence state:', state);
        console.log('Current room:', currentRoom);
        
        // Count unique users in current room
        const uniqueUsers = new Set();
        Object.values(state).forEach((presences: any) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const presence = presences[0];
            console.log('Checking presence:', presence);
            if (presence?.room === currentRoom) {
              uniqueUsers.add(presence.user_id);
            }
          }
        });
        
        console.log('Unique users:', uniqueUsers.size);
        setOnlineCountByRoom(prev => ({
          ...prev,
          [currentRoom]: uniqueUsers.size
        }));
        
        // Emitir evento para actualizar el Sidebar
        window.dispatchEvent(new CustomEvent('chatUsersUpdated', { 
          detail: { totalUsers: uniqueUsers.size } 
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
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      let displayName = userName;
      
      if (isAnonymous) {
        // Check if user already has an anonymous number for this room
        if (anonymousNumber !== null) {
          displayName = `Anónimo ${anonymousNumber}`;
        } else {
          // Get all anonymous messages in current room to find the highest number
          const { data: anonymousMessages } = await supabase
            .from('chat_messages')
            .select('user_name')
            .eq('room', currentRoom)
            .ilike('user_name', 'Anónimo%');

          // Extract all numbers and find the highest
          let maxNumber = 0;
          anonymousMessages?.forEach(msg => {
            const match = msg.user_name.match(/Anónimo (\d+)/);
            if (match) {
              const num = parseInt(match[1]);
              if (num > maxNumber) {
                maxNumber = num;
              }
            }
          });

          // Assign next number and store it
          const newNumber = maxNumber + 1;
          displayName = `Anónimo ${newNumber}`;
          setAnonymousNumber(newNumber);
          sessionStorage.setItem(`anonymous_number_${currentRoom}`, newNumber.toString());
        }
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          user_name: displayName,
          message: newMessage.trim(),
          room: currentRoom,
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      console.error('Error sending message:', error);
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
    if (!name) return '';
    
    // Eliminar espacios extras y dividir por espacios
    const nameParts = name.trim().split(/\s+/).filter(part => part.length > 0);
    
    if (nameParts.length === 0) return '';
    
    if (nameParts.length === 1) {
      // Un solo nombre: solo primera letra
      return nameParts[0][0].toUpperCase();
    }
    
    // Dos o más nombres: primera letra de los primeros dos
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
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
    const isReportedByMe = myReports.has(messageId);

    if (isReportedByMe) {
      // Unreport: remove from database
      try {
        const { error } = await supabase
          .from('message_reports')
          .delete()
          .eq('message_id', messageId)
          .eq('reported_by', userId);

        if (error) throw error;

        // Check if there are other reports for this message
        const { data: remainingReports } = await supabase
          .from('message_reports')
          .select('id')
          .eq('message_id', messageId);

        setMyReports(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });

        // Only remove from reportedMessages if no other reports exist
        if (!remainingReports || remainingReports.length === 0) {
          setReportedMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(messageId);
            return newSet;
          });
        }

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
        setMyReports(prev => new Set([...prev, messageId]));

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
    <div className="h-[calc(100vh-8rem+85px)] flex flex-col animate-in fade-in duration-500">
      <Card className="flex-1 flex flex-col border-primary/20 overflow-hidden min-h-0">
        <div className="bg-muted/30 border-b shrink-0">
          <div className="px-4 pb-3 pt-3">
            {isMobile ? (
              <Select value={currentRoom} onValueChange={setCurrentRoom}>
                <SelectTrigger className="w-full bg-black text-white">
                  <SelectValue>
                    {CHAT_ROOMS.find(room => room.id === currentRoom)?.label}
                    <Badge 
                      variant="secondary" 
                      className="ml-2 inline-flex gap-1 text-xs px-1.5 py-0.5 h-5"
                    >
                      <Users className="h-3 w-3" />
                      {onlineCountByRoom[currentRoom] || 0}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {CHAT_ROOMS.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <span className="flex items-center gap-2">
                        {room.label}
                        <Badge 
                          variant="secondary" 
                          className="inline-flex gap-1 text-xs px-1.5 py-0.5 h-5"
                        >
                          <Users className="h-3 w-3" />
                          {onlineCountByRoom[room.id] || 0}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Tabs value={currentRoom} onValueChange={setCurrentRoom} className="w-full">
                <TabsList className="flex h-auto min-h-10 items-center justify-start rounded-md bg-black p-[15px] text-muted-foreground w-full flex-wrap gap-1">
                  {CHAT_ROOMS.map((room, index) => (
                    <TabsTrigger 
                      key={room.id} 
                      value={room.id} 
                      className="text-xs sm:text-sm whitespace-nowrap data-[state=active]:text-[#FF7A5C] px-2 relative"
                    >
                      <span className="flex items-center gap-1.5">
                        {room.label}
                        <Badge 
                          variant="secondary" 
                          className="inline-flex gap-1 text-xs px-1.5 py-0.5 h-5"
                        >
                          <Users className="h-3 w-3" />
                          {onlineCountByRoom[room.id] || 0}
                        </Badge>
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {messages.map((msg) => {
                const isAnonymousMessage = msg.user_name.startsWith('Anónimo');
                const isOwnMessage = !isAnonymousMessage && msg.user_id === userId;
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
                                  title={myReports.has(msg.id) ? "Quitar denuncia" : "Denunciar"}
                                >
                                  <Flag className={`h-4 w-4 ${myReports.has(msg.id) ? 'fill-red-500' : ''} text-red-500`} />
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
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t space-y-3 bg-black shrink-0">
          {isMobile ? (
            <div className="flex flex-col gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="w-full pl-4 resize-none min-h-[60px] text-xs"
                disabled={isSending}
                rows={3}
              />
              <Button type="submit" disabled={!newMessage.trim() || isSending} className="w-full bg-white text-black hover:bg-white/90">
                Enviar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-start">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 pl-4 resize-none min-h-[44px] max-h-[44px] text-sm"
                disabled={isSending}
                rows={2}
              />
              <Button type="submit" disabled={!newMessage.trim() || isSending} className="h-[44px] bg-white text-black hover:bg-white/90">
                Enviar
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 pl-3">
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
      </Card>
    </div>
  );
}
