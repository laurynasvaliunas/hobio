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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          profile_id: string
          read_at: string | null
        }
        Insert: {
          announcement_id: string
          profile_id: string
          read_at?: string | null
        }
        Update: {
          announcement_id?: string
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string | null
          group_id: string
          id: string
          priority: string | null
          title: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string | null
          group_id: string
          id?: string
          priority?: string | null
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string | null
          group_id?: string
          id?: string
          priority?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          id: string
          marked_at: string | null
          marked_by: string | null
          member_id: string
          session_id: string
          status: string
        }
        Insert: {
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          member_id: string
          session_id: string
          status: string
        }
        Update: {
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          member_id?: string
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string
          full_name: string
          id: string
          medical_notes: string | null
          parent_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth: string
          full_name: string
          id?: string
          medical_notes?: string | null
          parent_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string
          full_name?: string
          id?: string
          medical_notes?: string | null
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          billing_period: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          document_url: string | null
          ends_at: string | null
          group_id: string
          id: string
          member_id: string
          price: number
          signed_at: string | null
          signed_by: string | null
          starts_at: string
          status: string | null
          title: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          document_url?: string | null
          ends_at?: string | null
          group_id: string
          id?: string
          member_id: string
          price: number
          signed_at?: string | null
          signed_by?: string | null
          starts_at: string
          status?: string | null
          title: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          document_url?: string | null
          ends_at?: string | null
          group_id?: string
          id?: string
          member_id?: string
          price?: number
          signed_at?: string | null
          signed_by?: string | null
          starts_at?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          added_by: string
          child_id: string | null
          group_id: string
          id: string
          joined_at: string | null
          profile_id: string | null
          role: string | null
          status: string | null
        }
        Insert: {
          added_by: string
          child_id?: string | null
          group_id: string
          id?: string
          joined_at?: string | null
          profile_id?: string | null
          role?: string | null
          status?: string | null
        }
        Update: {
          added_by?: string
          child_id?: string | null
          group_id?: string
          id?: string
          joined_at?: string | null
          profile_id?: string | null
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          age_group: string | null
          color: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          invite_code: string | null
          is_active: boolean | null
          location_id: string | null
          max_participants: number | null
          name: string
          organization_id: string
          price_per_month: number | null
          price_per_session: number | null
          skill_level: string | null
        }
        Insert: {
          age_group?: string | null
          color?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          is_active?: boolean | null
          location_id?: string | null
          max_participants?: number | null
          name: string
          organization_id: string
          price_per_month?: number | null
          price_per_session?: number | null
          skill_level?: string | null
        }
        Update: {
          age_group?: string | null
          color?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          is_active?: boolean | null
          location_id?: string | null
          max_participants?: number | null
          name?: string
          organization_id?: string
          price_per_month?: number | null
          price_per_session?: number | null
          skill_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          billing_period: string
          child_id: string | null
          created_at: string
          currency: string
          group_id: string
          id: string
          member_id: string
          notes: string | null
          paid_at: string | null
          paid_marked_by: string | null
          period_end: string
          period_start: string
          profile_id: string | null
          status: string
          stripe_invoice_id: string | null
        }
        Insert: {
          amount?: number
          billing_period?: string
          child_id?: string | null
          created_at?: string
          currency?: string
          group_id: string
          id?: string
          member_id: string
          notes?: string | null
          paid_at?: string | null
          paid_marked_by?: string | null
          period_end?: string
          period_start?: string
          profile_id?: string | null
          status?: string
          stripe_invoice_id?: string | null
        }
        Update: {
          amount?: number
          billing_period?: string
          child_id?: string | null
          created_at?: string
          currency?: string
          group_id?: string
          id?: string
          member_id?: string
          notes?: string | null
          paid_at?: string | null
          paid_marked_by?: string | null
          period_end?: string
          period_start?: string
          profile_id?: string | null
          status?: string
          stripe_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_paid_marked_by_fkey"
            columns: ["paid_marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          city: string
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          organization_id: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          organization_id?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          is_read: boolean
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          recipient_id: string
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          sport_category: string
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          sport_category: string
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          sport_category?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          biometrics_enabled: boolean | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          onboarding_completed: boolean | null
          phone: string | null
          push_token: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          biometrics_enabled?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          full_name: string
          id: string
          onboarding_completed?: boolean | null
          phone?: string | null
          push_token?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          biometrics_enabled?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          push_token?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          group_id: string
          id: string
          location_id: string | null
          start_time: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          group_id: string
          id?: string
          location_id?: string | null
          start_time: string
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          group_id?: string
          id?: string
          location_id?: string | null
          start_time?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_schedule_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_schedule_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          cancellation_reason: string | null
          created_at: string | null
          ends_at: string
          group_id: string
          id: string
          is_cancelled: boolean | null
          location_id: string | null
          notes: string | null
          starts_at: string
          title: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string | null
          ends_at: string
          group_id: string
          id?: string
          is_cancelled?: boolean | null
          location_id?: string | null
          notes?: string | null
          starts_at: string
          title?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string | null
          ends_at?: string
          group_id?: string
          id?: string
          is_cancelled?: boolean | null
          location_id?: string | null
          notes?: string | null
          starts_at?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_group_ids: { Args: never; Returns: string[] }
      get_my_member_ids: { Args: never; Returns: string[] }
      get_my_owned_group_ids: { Args: never; Returns: string[] }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
