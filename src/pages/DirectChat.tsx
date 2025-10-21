import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, UserCheck, UserX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
}

export default function DirectChat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [otherUserId, setOtherUserId] = useState<string>("");
  const [otherUserName, setOtherUserName] = useState<string>("");
  const [mentorship, setMentorship] = useState<any>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const userId = searchParams.get("userId");
    const userName = searchParams.get("userName");

    if (!userId || !userName) {
      navigate("/community");
      return;
    }

    setOtherUserId(userId);
    setOtherUserName(userName);

    const initializeChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
      setCurrentUserName(fullName);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      } else {
        setMessages(messagesData || []);
        scrollToBottom();
      }

      // Fetch mentorship
      const { data: mentorshipData } = await supabase
        .from('mentorships')
        .select('*')
        .eq('mentee_id', user.id)
        .eq('mentor_id', userId)
        .maybeSingle();

      setMentorship(mentorshipData);

      // Set up realtime channel for messages and presence
      const channel = supabase.channel(`direct-chat-${user.id}-${userId}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          // Check if other user is online
          const isOnline = Object.values(state).some((presences: any) => {
            if (Array.isArray(presences) && presences.length > 0) {
              return presences[0]?.user_id === userId;
            }
            return false;
          });
          setIsOtherUserOnline(isOnline);
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `sender_id=eq.${userId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            if (newMsg.receiver_id === user.id) {
              setMessages((prev) => [...prev, newMsg]);
              scrollToBottom();
            }
          }
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              user_name: fullName,
              online_at: new Date().toISOString(),
            });
          }
        });

      channelRef.current = channel;
    };

    initializeChat();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [searchParams, navigate, toast]);

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
    if (!newMessage.trim() || isSending || !currentUserId) return;

    setIsSending(true);
    try {
      // Determinar el nombre a mostrar
      let displayName = currentUserName;
      if (isAnonymous) {
        displayName = "Anónimo";
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: newMessage.trim(),
          sender_name: displayName,
        });

      if (error) throw error;

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: newMessage.trim(),
          created_at: new Date().toISOString(),
          sender_name: displayName,
        },
      ]);
      setNewMessage("");
      scrollToBottom();
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

  const handleAcceptMentor = async () => {
    if (!mentorship) {
      const { error } = await supabase
        .from('mentorships')
        .insert({
          mentee_id: currentUserId,
          mentor_id: otherUserId,
          status: 'active',
          accepted_at: new Date().toISOString(),
        });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo aceptar al padrino",
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await supabase
        .from('mentorships')
        .update({
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', mentorship.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar la mentoría",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "¡Padrino aceptado!",
      description: `${otherUserName} ahora es tu padrino. El chat aparece en la sección Chat > Mentorías.`,
    });
    setShowAcceptDialog(false);
    
    // Refetch mentorship
    const { data: mentorshipData } = await supabase
      .from('mentorships')
      .select('*')
      .eq('mentee_id', currentUserId)
      .eq('mentor_id', otherUserId)
      .maybeSingle();
    setMentorship(mentorshipData);
  };

  const handleEndMentorship = async () => {
    if (!mentorship) return;

    const { error } = await supabase
      .from('mentorships')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', mentorship.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo finalizar la mentoría",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Mentoría finalizada",
      description: "La mentoría ha sido finalizada correctamente.",
    });
    setShowEndDialog(false);
    navigate("/community");
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    const nameParts = name.trim().split(/\s+/).filter(part => part.length > 0);
    if (nameParts.length === 0) return '';
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  };

  const isActiveMentorship = mentorship?.status === 'active';

  return (
    <>
      <div className="h-[calc(100vh-8rem+85px)] flex flex-col animate-in fade-in duration-500 -mt-[10px]">
        <Card className="flex-1 flex flex-col border-border overflow-hidden min-h-0">
          {/* Header */}
          <div className="bg-muted/30 border-b shrink-0">
            <div className="px-4 py-3 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/community")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {getInitials(otherUserName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{otherUserName}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <div 
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${isOtherUserOnline ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ aspectRatio: '1', minWidth: '12px', minHeight: '12px' }}
                  />
                  {isOtherUserOnline ? 'En línea' : 'Desconectado.'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              <div className="py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No hay mensajes aún. ¡Inicia la conversación!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={`text-xs ${isOwn ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>
                              {getInitials(msg.sender_name || (isOwn ? currentUserName : otherUserName))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {!isOwn && msg.sender_name && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {msg.sender_name}
                              </p>
                            )}
                            <div
                              className={`rounded-lg p-3 ${
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm break-words">{msg.message}</p>
                            </div>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? "text-right" : "text-left"
                              } text-muted-foreground`}
                            >
                              {format(new Date(msg.created_at), "HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="shrink-0 p-4 border-t space-y-3">
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="anonymous-mode"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <Label htmlFor="anonymous-mode" className="text-sm cursor-pointer">
                  Marcar como anónimo
                </Label>
              </div>
              
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 h-10"
                  disabled={isSending}
                />
                <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()} className="h-10 w-10">
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              <div className="flex gap-2">
                {!isActiveMentorship && (
                  <Button
                    onClick={() => setShowAcceptDialog(true)}
                    className="flex-1"
                    variant="default"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Aceptar padrino
                  </Button>
                )}
                {isActiveMentorship && (
                  <Button
                    onClick={() => setShowEndDialog(true)}
                    className="flex-1"
                    variant="destructive"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Finalizar mentoría
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aceptar padrino?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres aceptar a {otherUserName} como tu padrino?
              El chat aparecerá en la sección Chat &gt; Mentorías.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptMentor}>
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar mentoría?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres finalizar la mentoría con {otherUserName}?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndMentorship}>
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
