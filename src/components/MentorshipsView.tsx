import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DirectChatDialog from "@/components/DirectChatDialog";

interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: string;
  created_at: string;
  mentor_name: string | null;
  mentee_name: string | null;
}

export default function MentorshipsView() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedMentorship, setSelectedMentorship] = useState<{ id: string; name: string } | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMentorships();
  }, []);

  const fetchMentorships = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Fetch active mentorships where user is either mentor or mentee
      const { data, error } = await supabase
        .from('mentorships')
        .select('*')
        .eq('status', 'active')
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`);

      if (error) throw error;

      // Fetch names for each mentorship
      const mentorshipsWithNames = await Promise.all(
        (data || []).map(async (mentorship) => {
          const isMentor = mentorship.mentor_id === user.id;
          const otherUserId = isMentor ? mentorship.mentee_id : mentorship.mentor_id;

          // Get the other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', otherUserId)
            .single();

          return {
            ...mentorship,
            mentor_name: isMentor ? null : profile?.full_name || 'Usuario',
            mentee_name: isMentor ? profile?.full_name || 'Usuario' : null,
          };
        })
      );

      setMentorships(mentorshipsWithNames);
    } catch (error) {
      console.error('Error fetching mentorships:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las mentorías",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    const nameParts = name.trim().split(/\s+/).filter(part => part.length > 0);
    if (nameParts.length === 0) return '';
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  };

  const handleMentorshipClick = (mentorship: Mentorship) => {
    const isMentor = mentorship.mentor_id === currentUserId;
    const otherUserId = isMentor ? mentorship.mentee_id : mentorship.mentor_id;
    const otherUserName = isMentor ? mentorship.mentee_name : mentorship.mentor_name;

    setSelectedMentorship({
      id: otherUserId,
      name: otherUserName || 'Usuario',
    });
    setChatDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando mentorías...</p>
      </div>
    );
  }

  if (mentorships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <p className="text-muted-foreground mb-2">No tienes mentorías activas</p>
        <p className="text-sm text-muted-foreground">
          Visita la sección Comunidad para conectar con otros miembros
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 p-4">
        {mentorships.map((mentorship) => {
          const isMentor = mentorship.mentor_id === currentUserId;
          const otherUserName = isMentor ? mentorship.mentee_name : mentorship.mentor_name;
          const role = isMentor ? 'Apadrinado' : 'Padrino';

          return (
            <Card
              key={mentorship.id}
              className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleMentorshipClick(mentorship)}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {getInitials(otherUserName || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{otherUserName}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {role}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedMentorship && (
        <DirectChatDialog
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          otherUserId={selectedMentorship.id}
          otherUserName={selectedMentorship.name}
        />
      )}
    </>
  );
}
