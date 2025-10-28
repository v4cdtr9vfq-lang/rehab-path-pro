import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Addiction {
  id: string;
  user_id: string;
  addiction_type: string;
  start_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAddictions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: addictions = [], isLoading } = useQuery({
    queryKey: ["addictions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("addictions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Addiction[];
    },
  });

  const addAddiction = useMutation({
    mutationFn: async ({ addictionType, startDate }: { addictionType: string; startDate: Date }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("addictions")
        .insert({
          user_id: user.id,
          addiction_type: addictionType,
          start_date: startDate.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addictions"] });
      toast({
        title: "Adicción añadida",
        description: "La adicción ha sido registrada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo añadir la adicción",
        variant: "destructive",
      });
      console.error("Error adding addiction:", error);
    },
  });

  const deleteAddiction = useMutation({
    mutationFn: async (addictionId: string) => {
      const { error } = await supabase
        .from("addictions")
        .delete()
        .eq("id", addictionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addictions"] });
      toast({
        title: "Adicción eliminada",
        description: "La adicción ha sido eliminada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la adicción",
        variant: "destructive",
      });
      console.error("Error deleting addiction:", error);
    },
  });

  return {
    addictions,
    isLoading,
    addAddiction: addAddiction.mutate,
    deleteAddiction: deleteAddiction.mutate,
    canAddMore: addictions.length < 3,
  };
}
