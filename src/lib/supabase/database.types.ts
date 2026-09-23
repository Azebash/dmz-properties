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
      articles: {
        Row: {
          author_id: string | null
          body: Json
          category: string
          created_at: string
          excerpt: string
          id: string
          published_at: string | null
          read_time_minutes: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["publication_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: Json
          category: string
          created_at?: string
          excerpt: string
          id?: string
          published_at?: string | null
          read_time_minutes?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["publication_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: Json
          category?: string
          created_at?: string
          excerpt?: string
          id?: string
          published_at?: string | null
          read_time_minutes?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["publication_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          next_value: Json | null
          previous_value: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
          next_value?: Json | null
          previous_value?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
          next_value?: Json | null
          previous_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      enquiries: {
        Row: {
          alternate_date: string | null
          assigned_to: string | null
          attribution: Json
          budget: string | null
          created_at: string
          current_location: string | null
          email: string
          enquiry_type: string
          id: string
          inspection_date: string | null
          inspection_preference: string | null
          internal_notes: string | null
          message: string
          name: string
          phone: string
          preferred_contact_method: string | null
          preferred_contact_time: string | null
          privacy_consent_at: string
          property_id: string | null
          property_reference: string | null
          purchase_timeline: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
          submission_key: string
          time_zone: string | null
          updated_at: string
        }
        Insert: {
          alternate_date?: string | null
          assigned_to?: string | null
          attribution?: Json
          budget?: string | null
          created_at?: string
          current_location?: string | null
          email: string
          enquiry_type: string
          id?: string
          inspection_date?: string | null
          inspection_preference?: string | null
          internal_notes?: string | null
          message: string
          name: string
          phone: string
          preferred_contact_method?: string | null
          preferred_contact_time?: string | null
          privacy_consent_at: string
          property_id?: string | null
          property_reference?: string | null
          purchase_timeline?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          submission_key: string
          time_zone?: string | null
          updated_at?: string
        }
        Update: {
          alternate_date?: string | null
          assigned_to?: string | null
          attribution?: Json
          budget?: string | null
          created_at?: string
          current_location?: string | null
          email?: string
          enquiry_type?: string
          id?: string
          inspection_date?: string | null
          inspection_preference?: string | null
          internal_notes?: string | null
          message?: string
          name?: string
          phone?: string
          preferred_contact_method?: string | null
          preferred_contact_time?: string | null
          privacy_consent_at?: string
          property_id?: string | null
          property_reference?: string | null
          purchase_timeline?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          submission_key?: string
          time_zone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          alternate_date: string | null
          assigned_to: string | null
          created_at: string
          enquiry_id: string
          id: string
          inspection_type: string
          outcome_notes: string | null
          preferred_date: string
          property_id: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["inspection_status"]
          time_zone: string
          updated_at: string
        }
        Insert: {
          alternate_date?: string | null
          assigned_to?: string | null
          created_at?: string
          enquiry_id: string
          id?: string
          inspection_type: string
          outcome_notes?: string | null
          preferred_date: string
          property_id?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          time_zone: string
          updated_at?: string
        }
        Update: {
          alternate_date?: string | null
          assigned_to?: string | null
          created_at?: string
          enquiry_id?: string
          id?: string
          inspection_type?: string
          outcome_notes?: string | null
          preferred_date?: string
          property_id?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          time_zone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inspections_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: true
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          description: string
          features: Json
          id: string
          last_verified_at: string | null
          latitude: number | null
          location_name: string
          longitude: number | null
          ownership_label: string | null
          plot_size_sqm: number | null
          price_amount: number | null
          price_currency: string
          price_label: string | null
          property_type: string
          published_at: string | null
          reference: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          source: Database["public"]["Enums"]["property_source"]
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          features?: Json
          id?: string
          last_verified_at?: string | null
          latitude?: number | null
          location_name: string
          longitude?: number | null
          ownership_label?: string | null
          plot_size_sqm?: number | null
          price_amount?: number | null
          price_currency?: string
          price_label?: string | null
          property_type: string
          published_at?: string | null
          reference: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          source: Database["public"]["Enums"]["property_source"]
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          features?: Json
          id?: string
          last_verified_at?: string | null
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          ownership_label?: string | null
          plot_size_sqm?: number | null
          price_amount?: number | null
          price_currency?: string
          price_label?: string | null
          property_type?: string
          published_at?: string | null
          reference?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          source?: Database["public"]["Enums"]["property_source"]
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "properties_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      property_documents: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string
          document_type: string
          id: string
          notes: string | null
          property_id: string
          storage_path: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name: string
          document_type: string
          id?: string
          notes?: string | null
          property_id: string
          storage_path: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string
          document_type?: string
          id?: string
          notes?: string | null
          property_id?: string
          storage_path?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_media: {
        Row: {
          alt_text: string
          caption: string | null
          created_at: string
          created_by: string | null
          estate_context: boolean
          id: string
          media_type: string
          property_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text: string
          caption?: string | null
          created_at?: string
          created_by?: string | null
          estate_context?: boolean
          id?: string
          media_type?: string
          property_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string
          caption?: string | null
          created_at?: string
          created_by?: string | null
          estate_context?: boolean
          id?: string
          media_type?: string
          property_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_media_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "property_media_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_submissions: {
        Row: {
          asking_price: number | null
          created_at: string
          enquiry_id: string
          id: string
          owner_email: string | null
          owner_name: string
          owner_phone: string
          property_description: string
          property_id: string | null
          review_notes: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
        }
        Insert: {
          asking_price?: number | null
          created_at?: string
          enquiry_id: string
          id?: string
          owner_email?: string | null
          owner_name: string
          owner_phone: string
          property_description: string
          property_id?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Update: {
          asking_price?: number | null
          created_at?: string
          enquiry_id?: string
          id?: string
          owner_email?: string | null
          owner_name?: string
          owner_phone?: string
          property_description?: string
          property_id?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_submissions_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: true
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_submissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_enquiry_rate_limit: {
        Args: {
          p_identifier_hash: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      ingest_enquiry: { Args: { payload: Json }; Returns: string }
      save_article: { Args: { p_payload: Json }; Returns: string }
      save_property: { Args: { p_payload: Json }; Returns: string }
      set_inspection_timezone: {
        Args: { p_inspection_id: string; p_time_zone: string }
        Returns: string
      }
      transition_article_status: {
        Args: {
          p_article_id: string
          p_status: Database["public"]["Enums"]["publication_status"]
        }
        Returns: Database["public"]["Enums"]["publication_status"]
      }
      transition_property_status: {
        Args: {
          p_property_id: string
          p_status: Database["public"]["Enums"]["property_status"]
        }
        Returns: Database["public"]["Enums"]["property_status"]
      }
      update_enquiry_workflow: {
        Args: {
          p_enquiry_id: string
          p_notes: string
          p_status: Database["public"]["Enums"]["enquiry_status"]
        }
        Returns: Database["public"]["Enums"]["enquiry_status"]
      }
      update_inspection_workflow: {
        Args: {
          p_inspection_id: string
          p_outcome_notes: string
          p_scheduled_local: string
          p_status: Database["public"]["Enums"]["inspection_status"]
        }
        Returns: Database["public"]["Enums"]["inspection_status"]
      }
    }
    Enums: {
      enquiry_status:
        | "new"
        | "qualified"
        | "inspection"
        | "offer"
        | "won"
        | "lost"
        | "spam"
      inspection_status:
        | "requested"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      property_source: "developer_inventory" | "owner_resale"
      property_status:
        | "draft"
        | "under_review"
        | "published"
        | "reserved"
        | "sold"
        | "archived"
      publication_status: "draft" | "under_review" | "published" | "archived"
      staff_role:
        | "administrator"
        | "property_manager"
        | "content_editor"
        | "viewer"
      verification_status:
        | "submitted"
        | "reviewing"
        | "more_information_required"
        | "approved"
        | "rejected"
        | "withdrawn"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {
      enquiry_status: [
        "new",
        "qualified",
        "inspection",
        "offer",
        "won",
        "lost",
        "spam",
      ],
      inspection_status: [
        "requested",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      property_source: ["developer_inventory", "owner_resale"],
      property_status: [
        "draft",
        "under_review",
        "published",
        "reserved",
        "sold",
        "archived",
      ],
      publication_status: ["draft", "under_review", "published", "archived"],
      staff_role: [
        "administrator",
        "property_manager",
        "content_editor",
        "viewer",
      ],
      verification_status: [
        "submitted",
        "reviewing",
        "more_information_required",
        "approved",
        "rejected",
        "withdrawn",
      ],
    },
  },
} as const
