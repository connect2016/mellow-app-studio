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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          participant_a: string
          participant_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_a: string
          participant_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_a?: string
          participant_b?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          from_user: string
          id: string
          is_hi_five: boolean
          message: string | null
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          is_hi_five?: boolean
          message?: string | null
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          is_hi_five?: boolean
          message?: string | null
          to_user?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          status: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      passes: {
        Row: {
          created_at: string
          from_user: string
          id: string
          passed_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          passed_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          passed_user?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          age_max: number | null
          age_min: number | null
          bar_location_privacy: string | null
          best_bar: string | null
          bio: string | null
          blocked_users: string[] | null
          created_at: string
          display_name: string
          distance_pref_miles: number | null
          favorite_moment: string | null
          favorite_moment_is_valid: boolean | null
          favorite_player: string | null
          game_status: string | null
          hidden_from_discover: boolean | null
          id: string
          intent: string[] | null
          is_banned: boolean | null
          is_verified: boolean | null
          location_last_set_at: string | null
          onboarding_completed: boolean | null
          profile_photo: string | null
          pronouns: string | null
          stretch_song: string | null
          superstition: string | null
          updated_at: string
          user_id: string
          wrigley_location_privacy: string | null
          wrigley_row: string | null
          wrigley_seat: string | null
          wrigley_section: string | null
          wrigleyville_bar: string | null
        }
        Insert: {
          age?: number | null
          age_max?: number | null
          age_min?: number | null
          bar_location_privacy?: string | null
          best_bar?: string | null
          bio?: string | null
          blocked_users?: string[] | null
          created_at?: string
          display_name?: string
          distance_pref_miles?: number | null
          favorite_moment?: string | null
          favorite_moment_is_valid?: boolean | null
          favorite_player?: string | null
          game_status?: string | null
          hidden_from_discover?: boolean | null
          id?: string
          intent?: string[] | null
          is_banned?: boolean | null
          is_verified?: boolean | null
          location_last_set_at?: string | null
          onboarding_completed?: boolean | null
          profile_photo?: string | null
          pronouns?: string | null
          stretch_song?: string | null
          superstition?: string | null
          updated_at?: string
          user_id: string
          wrigley_location_privacy?: string | null
          wrigley_row?: string | null
          wrigley_seat?: string | null
          wrigley_section?: string | null
          wrigleyville_bar?: string | null
        }
        Update: {
          age?: number | null
          age_max?: number | null
          age_min?: number | null
          bar_location_privacy?: string | null
          best_bar?: string | null
          bio?: string | null
          blocked_users?: string[] | null
          created_at?: string
          display_name?: string
          distance_pref_miles?: number | null
          favorite_moment?: string | null
          favorite_moment_is_valid?: boolean | null
          favorite_player?: string | null
          game_status?: string | null
          hidden_from_discover?: boolean | null
          id?: string
          intent?: string[] | null
          is_banned?: boolean | null
          is_verified?: boolean | null
          location_last_set_at?: string | null
          onboarding_completed?: boolean | null
          profile_photo?: string | null
          pronouns?: string | null
          stretch_song?: string | null
          superstition?: string | null
          updated_at?: string
          user_id?: string
          wrigley_location_privacy?: string | null
          wrigley_row?: string | null
          wrigley_seat?: string | null
          wrigley_section?: string | null
          wrigleyville_bar?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
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
