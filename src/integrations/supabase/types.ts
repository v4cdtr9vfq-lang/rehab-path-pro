export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activating_persons: {
        Row: {
          created_at: string
          description: string
          emotion_reference: string | null
          entry_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          emotion_reference?: string | null
          entry_date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          emotion_reference?: string | null
          entry_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      addictions: {
        Row: {
          addiction_type: string
          created_at: string
          id: string
          is_active: boolean
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          addiction_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          addiction_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          room: string
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          room?: string
          updated_at?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          room?: string
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          answers: Json
          check_in_date: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          check_in_date?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          check_in_date?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          receiver_id: string
          sender_id: string
          sender_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
          sender_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          sender_name?: string | null
        }
        Relationships: []
      }
      emotion_journal: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          main_emotion: string | null
          person_description: string | null
          person_trigger: boolean | null
          primary_emotion: string | null
          secondary_emotions: string[] | null
          situation_description: string | null
          situation_trigger: boolean | null
          sub_emotions: string[] | null
          tertiary_emotions: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          main_emotion?: string | null
          person_description?: string | null
          person_trigger?: boolean | null
          primary_emotion?: string | null
          secondary_emotions?: string[] | null
          situation_description?: string | null
          situation_trigger?: boolean | null
          sub_emotions?: string[] | null
          tertiary_emotions?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          main_emotion?: string | null
          person_description?: string | null
          person_trigger?: boolean | null
          primary_emotion?: string | null
          secondary_emotions?: string[] | null
          situation_description?: string | null
          situation_trigger?: boolean | null
          sub_emotions?: string[] | null
          tertiary_emotions?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          question: string
          updated_at: string
          view_count: number
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          question: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          question?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      goal_completions: {
        Row: {
          completion_date: string
          created_at: string | null
          goal_id: string
          id: string
          instance_index: number
          user_id: string
        }
        Insert: {
          completion_date: string
          created_at?: string | null
          goal_id: string
          id?: string
          instance_index?: number
          user_id: string
        }
        Update: {
          completion_date?: string
          created_at?: string | null
          goal_id?: string
          id?: string
          instance_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_completions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          goal_type: string
          id: string
          instructions: string | null
          link: string | null
          notes: string | null
          order_index: number | null
          periodic_type: string | null
          remaining: number
          target_date: string | null
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          goal_type: string
          id?: string
          instructions?: string | null
          link?: string | null
          notes?: string | null
          order_index?: number | null
          periodic_type?: string | null
          remaining?: number
          target_date?: string | null
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          goal_type?: string
          id?: string
          instructions?: string | null
          link?: string | null
          notes?: string | null
          order_index?: number | null
          periodic_type?: string | null
          remaining?: number
          target_date?: string | null
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gratitude_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medals: {
        Row: {
          addiction_id: string | null
          created_at: string
          id: string
          medal_type: string
          popup_shown: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          addiction_id?: string | null
          created_at?: string
          id?: string
          medal_type: string
          popup_shown?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          addiction_id?: string | null
          created_at?: string
          id?: string
          medal_type?: string
          popup_shown?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentorships: {
        Row: {
          accepted_at: string | null
          created_at: string
          ended_at: string | null
          id: string
          mentee_id: string
          mentor_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          mentee_id: string
          mentor_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          mentee_id?: string
          mentor_id?: string
          status?: string
        }
        Relationships: []
      }
      message_reports: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reason: string | null
          reported_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reason?: string | null
          reported_by: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reason?: string | null
          reported_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          abstinence_start_date: string | null
          available_for_help: boolean
          created_at: string
          full_name: string | null
          id: string
          onboarding_completed: boolean
          rehabilitation_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          abstinence_start_date?: string | null
          available_for_help?: boolean
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          rehabilitation_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          abstinence_start_date?: string | null
          available_for_help?: boolean
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          rehabilitation_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposed_quotes: {
        Row: {
          created_at: string
          id: string
          quote_author: string
          quote_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quote_author: string
          quote_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quote_author?: string
          quote_text?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_quotes: {
        Row: {
          created_at: string
          id: string
          quote_author: string
          quote_text: string
          saved_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quote_author: string
          quote_text: string
          saved_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quote_author?: string
          quote_text?: string
          saved_date?: string
          user_id?: string
        }
        Relationships: []
      }
      sensitive_situations: {
        Row: {
          created_at: string
          description: string
          emotion_reference: string | null
          entry_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          emotion_reference?: string | null
          entry_date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          emotion_reference?: string | null
          entry_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_quality: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          quality_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          quality_score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          quality_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_questions: {
        Row: {
          created_at: string
          id: string
          question: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      value_selections: {
        Row: {
          created_at: string
          id: string
          selected_date: string
          user_id: string
          value_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          selected_date?: string
          user_id: string
          value_id: string
        }
        Update: {
          created_at?: string
          id?: string
          selected_date?: string
          user_id?: string
          value_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "value_selections_value_id_fkey"
            columns: ["value_id"]
            isOneToOne: false
            referencedRelation: "values"
            referencedColumns: ["id"]
          },
        ]
      }
      values: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number | null
          updated_at: string
          user_id: string
          value_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number | null
          updated_at?: string
          user_id: string
          value_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number | null
          updated_at?: string
          user_id?: string
          value_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_goals_and_abstinence: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
