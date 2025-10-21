import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, UserCheck, UserX } from "lucide-react";
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

interface DirectChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserId: string;
  otherUserName: string;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function DirectChatDialog({
  open,
  onOpenChange,
  otherUserId,
  otherUserName,
}: DirectChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [mentorship, setMentorship] = useState<any>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!open || !currentUserId || !otherUserId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    const fetchMentorship = async () => {
      const { data } = await supabase
        .from('mentorships')
        .select('*')
        .eq('mentee_id', currentUserId)
        .eq('mentor_id', otherUserId)
        .maybeSingle();

      setMentorship(data);
    };

    fetchMessages();
    fetchMentorship();

    // Subscribe to new messages
    const channel = supabase
      .channel('direct_messages_' + currentUserId + '_' + otherUserId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${otherUserId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, currentUserId, otherUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const { error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: currentUserId,
        receiver_id: otherUserId,
        message: newMessage.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        sender_id: currentUserId,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
      },
    ]);
    setNewMessage("");
  };

  const handleAcceptMentor = async () => {
    if (!mentorship) {
      // Create new mentorship
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
      // Update existing mentorship
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
      description: `${otherUserName} ahora es tu padrino. El chat aparecerá en la sección Chat.`,
    });
    setShowAcceptDialog(false);
    onOpenChange(false);
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
    onOpenChange(false);
  };

  const isActiveMentorship = mentorship?.status === 'active';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat con {otherUserName}</DialogTitle>
          </DialogHeader>

          <ScrollArea ref={scrollRef} className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {format(new Date(msg.created_at), "HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>

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
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aceptar padrino?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres aceptar a {otherUserName} como tu padrino?
              El chat aparecerá en la sección Chat.
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
