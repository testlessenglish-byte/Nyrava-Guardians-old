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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      guardian_links: {
        Row: {
          created_at: string
          guardian_user_id: string
          id: string
          learner_user_id: string
          status: Database["public"]["Enums"]["link_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          guardian_user_id: string
          id?: string
          learner_user_id: string
          status?: Database["public"]["Enums"]["link_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          guardian_user_id?: string
          id?: string
          learner_user_id?: string
          status?: Database["public"]["Enums"]["link_status"]
          updated_at?: string
        }
        Relationships: []
      }
      guardian_state: {
        Row: {
          completed_missions: string[]
          cosmetics: Json
          created_at: string
          guardian_id: string | null
          guardian_name: string
          home_decor: Json
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          completed_missions?: string[]
          cosmetics?: Json
          created_at?: string
          guardian_id?: string | null
          guardian_name?: string
          home_decor?: Json
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          completed_missions?: string[]
          cosmetics?: Json
          created_at?: string
          guardian_id?: string | null
          guardian_name?: string
          home_decor?: Json
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      isla_progress: {
        Row: {
          class_complete: boolean
          created_at: string
          crystals: string[]
          hints: Json
          mastery: Json
          secrets: string[]
          solved: string[]
          updated_at: string
          user_id: string
          visited: string[]
          xp: number
        }
        Insert: {
          class_complete?: boolean
          created_at?: string
          crystals?: string[]
          hints?: Json
          mastery?: Json
          secrets?: string[]
          solved?: string[]
          updated_at?: string
          user_id: string
          visited?: string[]
          xp?: number
        }
        Update: {
          class_complete?: boolean
          created_at?: string
          crystals?: string[]
          hints?: Json
          mastery?: Json
          secrets?: string[]
          solved?: string[]
          updated_at?: string
          user_id?: string
          visited?: string[]
          xp?: number
        }
        Relationships: []
      }
      learner_profiles: {
        Row: {
          created_at: string
          grade_band: Database["public"]["Enums"]["grade_band"]
          interests: string[]
          matching_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grade_band: Database["public"]["Enums"]["grade_band"]
          interests?: string[]
          matching_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grade_band?: Database["public"]["Enums"]["grade_band"]
          interests?: string[]
          matching_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          current_period_end: string | null
          level: number
          status: Database["public"]["Enums"]["membership_status"]
          tier: Database["public"]["Enums"]["membership_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          level?: number
          status?: Database["public"]["Enums"]["membership_status"]
          tier?: Database["public"]["Enums"]["membership_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          level?: number
          status?: Database["public"]["Enums"]["membership_status"]
          tier?: Database["public"]["Enums"]["membership_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      moderation_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          room_id: string | null
          severity: number
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          room_id?: string | null
          severity?: number
          summary: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          room_id?: string | null
          severity?: number
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_guardian: string
          created_at: string
          display_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_guardian?: string
          created_at?: string
          display_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_guardian?: string
          created_at?: string
          display_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room_members: {
        Row: {
          is_speaking: boolean
          joined_at: string
          last_seen_at: string
          position_x: number
          position_y: number
          position_z: number
          room_id: string
          rotation_y: number
          session_started_at: string
          user_id: string
        }
        Insert: {
          is_speaking?: boolean
          joined_at?: string
          last_seen_at?: string
          position_x?: number
          position_y?: number
          position_z?: number
          room_id: string
          rotation_y?: number
          session_started_at?: string
          user_id: string
        }
        Update: {
          is_speaking?: boolean
          joined_at?: string
          last_seen_at?: string
          position_x?: number
          position_y?: number
          position_z?: number
          room_id?: string
          rotation_y?: number
          session_started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          moderation_reason: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          room_id: string
          sender_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          moderation_reason?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          room_id: string
          sender_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          moderation_reason?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          room_id?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          grade_band: Database["public"]["Enums"]["grade_band"]
          id: string
          interest_tags: string[]
          minimum_level: number
          minimum_tier: Database["public"]["Enums"]["membership_tier"]
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
          world_id: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          grade_band: Database["public"]["Enums"]["grade_band"]
          id?: string
          interest_tags?: string[]
          minimum_level?: number
          minimum_tier?: Database["public"]["Enums"]["membership_tier"]
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
          world_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          grade_band?: Database["public"]["Enums"]["grade_band"]
          id?: string
          interest_tags?: string[]
          minimum_level?: number
          minimum_tier?: Database["public"]["Enums"]["membership_tier"]
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
          world_id?: string
        }
        Relationships: []
      }
      safety_reports: {
        Row: {
          category: string
          created_at: string
          details: string | null
          id: string
          reported_user_id: string | null
          reporter_user_id: string
          resolved_at: string | null
          room_id: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          category: string
          created_at?: string
          details?: string | null
          id?: string
          reported_user_id?: string | null
          reporter_user_id: string
          resolved_at?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          category?: string
          created_at?: string
          details?: string | null
          id?: string
          reported_user_id?: string | null
          reporter_user_id?: string
          resolved_at?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "safety_reports_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_settings: {
        Row: {
          activity_reports_enabled: boolean
          allowed_end: string | null
          allowed_start: string | null
          daily_limit_minutes: number
          learner_user_id: string
          multiplayer_consent: boolean
          updated_at: string
          updated_by: string | null
          voice_enabled: boolean
        }
        Insert: {
          activity_reports_enabled?: boolean
          allowed_end?: string | null
          allowed_start?: string | null
          daily_limit_minutes?: number
          learner_user_id: string
          multiplayer_consent?: boolean
          updated_at?: string
          updated_by?: string | null
          voice_enabled?: boolean
        }
        Update: {
          activity_reports_enabled?: boolean
          allowed_end?: string | null
          allowed_start?: string | null
          daily_limit_minutes?: number
          learner_user_id?: string
          multiplayer_consent?: boolean
          updated_at?: string
          updated_by?: string | null
          voice_enabled?: boolean
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_user_id: string
          blocker_user_id: string
          created_at: string
        }
        Insert: {
          blocked_user_id: string
          blocker_user_id: string
          created_at?: string
        }
        Update: {
          blocked_user_id?: string
          blocker_user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "guardian" | "learner" | "moderator" | "admin"
      grade_band: "k_2" | "3_5" | "6_8" | "9_12"
      link_status: "pending" | "approved" | "revoked"
      membership_status: "active" | "paused" | "cancelled"
      membership_tier: "free" | "explorer" | "guardian" | "academy"
      moderation_status: "pending" | "approved" | "blocked"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      room_status: "open" | "full" | "closed"
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
    Enums: {
      app_role: ["guardian", "learner", "moderator", "admin"],
      grade_band: ["k_2", "3_5", "6_8", "9_12"],
      link_status: ["pending", "approved", "revoked"],
      membership_status: ["active", "paused", "cancelled"],
      membership_tier: ["free", "explorer", "guardian", "academy"],
      moderation_status: ["pending", "approved", "blocked"],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      room_status: ["open", "full", "closed"],
    },
  },
} as const
