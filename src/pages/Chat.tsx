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
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
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
  { id: 'azucar', label: 'Azúcar' },
  { id: 'codependencia', label: 'Codependencia' },
  { id: 'comida', label: 'Comida' },
  { id: 'compras', label: 'Compras' },
  { id: 'drama', label: 'Drama' },
  { id: 'medicamentos', label: 'Medicamentos' },
  { id: 'narcoticos', label: 'Narcóticos' },
  { id: 'pornografia', label: 'Pornografía' },
  { id: 'redes_sociales', label: 'Redes Sociales' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'trabajo', label: 'Trabajo' },
  { id: 'videojuegos', label: 'Videojuegos' },
  { id: 'otros', label: 'Otros' },
] as const;

export default function Chat() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string>(() => {
    const savedRoom = localStorage.getItem('chat_last_room_mobile');
    return savedRoom || 'narcoticos';
  });
  const [onlineCountByRoom, setOnlineCountByRoom] = useState<Record<string, number>>({
    azucar: 0,
    codependencia: 0,
    comida: 0,
    compras: 0,
    drama: 0,
    medicamentos: 0,
    narcoticos: 0,
    pornografia: 0,
    redes_sociales: 0,
    tecnologia: 0,
    trabajo: 0,
    videojuegos: 0,
    otros: 0
  });
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [reportedMessages, setReportedMessages] = useState<Set<string>>(new Set());
  const [myReports, setMyReports] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
    setDeleteConfirmId(null);
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
    <div className="h-[calc(100vh-8rem+85px)] flex flex-col animate-in fade-in duration-500 -mt-[10px]">
      <Card className="flex-1 flex flex-col border-border overflow-hidden min-h-0">
        <div className="bg-muted/30 border-b shrink-0">
          <div className="px-4 pb-3 pt-3">
            <Select value={currentRoom} onValueChange={(value) => {
              setCurrentRoom(value);
              localStorage.setItem('chat_last_room_mobile', value);
            }}>
              <SelectTrigger className="w-full bg-muted text-foreground border-border flex items-center pr-3 pl-3 relative [&>svg]:absolute [&>svg]:right-3">
                <span className="flex-1 text-left font-medium pr-8">
                  {CHAT_ROOMS.find(room => room.id === currentRoom)?.label}
                </span>
                <Badge 
                  variant="secondary" 
                  className="flex-shrink-0 inline-flex gap-1 text-xs px-1.5 py-0.5 h-5 bg-black text-white pointer-events-none mr-6"
                >
                  <Users className="h-3 w-3" />
                  {onlineCountByRoom[currentRoom] || 0}
                </Badge>
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border z-[100] shadow-lg">
                {CHAT_ROOMS.map((room) => (
                  <SelectItem 
                    key={room.id} 
                    value={room.id} 
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span className="flex-1">{room.label}</span>
                      <Badge 
                        variant="secondary" 
                        className="ml-2 inline-flex gap-1 text-xs px-1.5 py-0.5 h-5 bg-primary/20 text-primary pointer-events-none"
                      >
                        <Users className="h-3 w-3" />
                        {onlineCountByRoom[room.id] || 0}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-4">
              {messages.length === 0 && (
                <div className="flex justify-start mb-6">
                  <div className="flex items-start gap-3 w-full pl-[15px]">
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
                          E
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-xs text-muted-foreground pl-6">
                        Esperanza
                      </span>
                      <div className="rounded-[18px] px-6 py-3 max-w-full bg-muted/70 text-foreground">
                        <p className="text-xs">
                          Siempre hay un primer valiente...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {messages.map((msg) => {
                const isOwnMessage = msg.user_id === userId;
                const isAnonymousOwnMessage = isOwnMessage && msg.user_name.startsWith('Anónimo');
                const isEditing = editingMessageId === msg.id;
                const isReported = reportedMessages.has(msg.id);
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${(isOwnMessage && !isAnonymousOwnMessage) ? 'justify-end' : 'justify-start'} mb-3 group`}
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
                        {(isOwnMessage && !isAnonymousOwnMessage) ? (
                          // Own non-anonymous messages: message full width - avatar (top) - options (below avatar) on the right
                          <div className="flex items-start gap-3 w-full pr-[15px]">
                            <div className="flex flex-col items-end gap-1 flex-1">
                              <div className="rounded-[18px] px-6 py-3 bg-[#FF7A5C] text-white max-w-full">
                                <p className="text-xs">{msg.message}</p>
                              </div>
                              <span className="text-[10px] text-muted-foreground pr-6">
                                {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                              <Avatar className="h-11 w-11">
                                <AvatarFallback className="bg-[#FF7A5C] text-white text-sm font-semibold">
                                  {getInitials(msg.user_name)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border z-[100] shadow-lg min-w-[160px]">
                                  <DropdownMenuItem onClick={() => startEditing(msg.id, msg.message)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setDeleteConfirmId(msg.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ) : (
                          // Other messages or anonymous own messages: avatar (top) - action button (below avatar) - message full width
                          <div className="flex items-start gap-3 w-full pl-[15px]">
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                              <Avatar className="h-11 w-11">
                                <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
                                  {getInitials(msg.user_name)}
                                </AvatarFallback>
                              </Avatar>
                              
                              {isAnonymousOwnMessage ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="bg-popover text-popover-foreground border-border z-[100] shadow-lg min-w-[160px]">
                                    <DropdownMenuItem onClick={() => startEditing(msg.id, msg.message)}>
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDeleteConfirmId(msg.id)} className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => toggleReport(msg.id)}
                                  className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                  title={myReports.has(msg.id) ? "Quitar denuncia" : "Denunciar"}
                                >
                                  <Flag className={`h-4 w-4 ${myReports.has(msg.id) ? 'fill-red-500' : ''} text-red-500`} />
                                </Button>
                              )}
                            </div>

                            <div className="flex flex-col gap-1 flex-1">
                              <span className="text-xs text-muted-foreground pl-6">
                                {getFirstName(msg.user_name)}
                              </span>
                              <div className={`rounded-[18px] px-6 py-3 max-w-full ${
                                isReported 
                                  ? 'bg-background border-2 border-red-500' 
                                  : 'bg-muted/70 text-foreground'
                              }`}>
                                <p className={`text-xs ${isReported ? 'invisible' : ''}`}>
                                  {msg.message}
                                </p>
                              </div>
                              <span className="text-[10px] text-muted-foreground pl-6">
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
            <div className="flex flex-col gap-2.5">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="w-full px-[15px] py-[10px] resize-none min-h-[60px] text-sm placeholder:text-sm"
                disabled={isSending}
                rows={3}
              />
              <Button type="submit" disabled={!newMessage.trim() || isSending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Enviar
              </Button>
              <div className="flex items-center gap-2 pl-[15px]">
                <Switch
                  id="anonymous-mode"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <Label htmlFor="anonymous-mode" className="text-sm text-muted-foreground cursor-pointer">
                  Escribir en modo anónimo.
                </Label>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 items-start">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-[15px] py-[10px] resize-none min-h-[44px] max-h-[44px] text-sm placeholder:text-sm"
                disabled={isSending}
                rows={2}
              />
              <Button type="submit" disabled={!newMessage.trim() || isSending} className="h-[44px] bg-primary text-primary-foreground hover:bg-primary/90">
                Enviar
              </Button>
            </div>
          )}
          {!isMobile && (
            <div className="flex items-center gap-2 pl-[15px]">
              <Switch
                id="anonymous-mode"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous-mode" className="text-sm text-muted-foreground cursor-pointer">
                Escribir en modo anónimo.
              </Label>
            </div>
          )}
        </form>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar este mensaje? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && deleteMessage(deleteConfirmId)}>
              Sí
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
