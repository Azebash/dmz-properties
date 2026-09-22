export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StaffRole =
  | "administrator"
  | "property_manager"
  | "content_editor"
  | "viewer";
export type PublicationStatus = "draft" | "under_review" | "published" | "archived";
export type PropertyStatus =
  | "draft"
  | "under_review"
  | "published"
  | "reserved"
  | "sold"
  | "archived";
export type PropertySource = "developer_inventory" | "owner_resale";
export type EnquiryStatus =
  | "new"
  | "qualified"
  | "inspection"
  | "offer"
  | "won"
  | "lost"
  | "spam";
export type InspectionStatus =
  | "requested"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";
export type VerificationStatus =
  | "submitted"
  | "reviewing"
  | "more_information_required"
  | "approved"
  | "rejected"
  | "withdrawn";

type TableDefinition<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type StaffProfileRow = {
  user_id: string;
  display_name: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PropertyRow = {
  id: string;
  reference: string;
  slug: string;
  title: string;
  source: PropertySource;
  property_type: string;
  status: PropertyStatus;
  location_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price_amount: number | null;
  price_currency: string;
  price_label: string | null;
  plot_size_sqm: number | null;
  ownership_label: string | null;
  description: string;
  features: Json;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  last_verified_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: PublicationStatus;
  excerpt: string;
  body: Json;
  read_time_minutes: number;
  seo_title: string | null;
  seo_description: string | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EnquiryRow = {
  id: string;
  submission_key: string;
  status: EnquiryStatus;
  enquiry_type: string;
  property_id: string | null;
  property_reference: string | null;
  name: string;
  email: string;
  phone: string;
  current_location: string | null;
  budget: string | null;
  purchase_timeline: string | null;
  inspection_preference: string | null;
  inspection_date: string | null;
  alternate_date: string | null;
  time_zone: string | null;
  preferred_contact_method: string | null;
  preferred_contact_time: string | null;
  message: string;
  attribution: Json;
  privacy_consent_at: string;
  assigned_to: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

type IdTimestamps = { id: string; created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      staff_profiles: TableDefinition<
        StaffProfileRow,
        { user_id: string; display_name: string; role?: StaffRole; active?: boolean }
      >;
      properties: TableDefinition<
        PropertyRow,
        {
          id?: string;
          reference: string;
          slug: string;
          title: string;
          source: PropertySource;
          property_type: string;
          status?: PropertyStatus;
          location_name: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          price_amount?: number | null;
          price_currency?: string;
          price_label?: string | null;
          plot_size_sqm?: number | null;
          ownership_label?: string | null;
          description: string;
          features?: Json;
          seo_title?: string | null;
          seo_description?: string | null;
          published_at?: string | null;
          last_verified_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        }
      >;
      property_media: TableDefinition<
        {
          id: string;
          property_id: string;
          storage_path: string;
          media_type: string;
          alt_text: string;
          caption: string | null;
          estate_context: boolean;
          sort_order: number;
          created_by: string | null;
          created_at: string;
        },
        {
          id?: string;
          property_id: string;
          storage_path: string;
          media_type?: string;
          alt_text: string;
          caption?: string | null;
          estate_context?: boolean;
          sort_order?: number;
          created_by?: string | null;
        }
      >;
      property_documents: TableDefinition<
        IdTimestamps & {
          property_id: string;
          storage_path: string;
          document_type: string;
          display_name: string;
          verification_status: VerificationStatus;
          notes: string | null;
          created_by: string | null;
        },
        {
          id?: string;
          property_id: string;
          storage_path: string;
          document_type: string;
          display_name: string;
          verification_status?: VerificationStatus;
          notes?: string | null;
          created_by?: string | null;
        }
      >;
      articles: TableDefinition<
        ArticleRow,
        {
          id?: string;
          slug: string;
          title: string;
          category: string;
          status?: PublicationStatus;
          excerpt: string;
          body?: Json;
          read_time_minutes?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          author_id?: string | null;
          published_at?: string | null;
        }
      >;
      enquiries: TableDefinition<
        EnquiryRow,
        {
          id?: string;
          submission_key: string;
          status?: EnquiryStatus;
          enquiry_type: string;
          property_id?: string | null;
          property_reference?: string | null;
          name: string;
          email: string;
          phone: string;
          current_location?: string | null;
          budget?: string | null;
          purchase_timeline?: string | null;
          inspection_preference?: string | null;
          inspection_date?: string | null;
          alternate_date?: string | null;
          time_zone?: string | null;
          preferred_contact_method?: string | null;
          preferred_contact_time?: string | null;
          message: string;
          attribution?: Json;
          privacy_consent_at: string;
          assigned_to?: string | null;
          internal_notes?: string | null;
        }
      >;
      inspections: TableDefinition<
        IdTimestamps & {
          enquiry_id: string;
          property_id: string | null;
          status: InspectionStatus;
          inspection_type: string;
          preferred_date: string;
          alternate_date: string | null;
          time_zone: string;
          scheduled_at: string | null;
          assigned_to: string | null;
          outcome_notes: string | null;
        },
        {
          id?: string;
          enquiry_id: string;
          property_id?: string | null;
          status?: InspectionStatus;
          inspection_type: string;
          preferred_date: string;
          alternate_date?: string | null;
          time_zone: string;
          scheduled_at?: string | null;
          assigned_to?: string | null;
          outcome_notes?: string | null;
        }
      >;
      seller_submissions: TableDefinition<
        IdTimestamps & {
          enquiry_id: string;
          property_id: string | null;
          status: VerificationStatus;
          owner_name: string;
          owner_phone: string;
          owner_email: string | null;
          property_description: string;
          asking_price: number | null;
          review_notes: string | null;
          reviewed_by: string | null;
        },
        {
          id?: string;
          enquiry_id: string;
          property_id?: string | null;
          status?: VerificationStatus;
          owner_name: string;
          owner_phone: string;
          owner_email?: string | null;
          property_description: string;
          asking_price?: number | null;
          review_notes?: string | null;
          reviewed_by?: string | null;
        }
      >;
      audit_events: TableDefinition<
        {
          id: number;
          actor_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          previous_value: Json | null;
          next_value: Json | null;
          created_at: string;
        },
        {
          actor_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          previous_value?: Json | null;
          next_value?: Json | null;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      ingest_enquiry: { Args: { payload: Json }; Returns: string };
    };
    Enums: {
      staff_role: StaffRole;
      publication_status: PublicationStatus;
      property_status: PropertyStatus;
      property_source: PropertySource;
      enquiry_status: EnquiryStatus;
      inspection_status: InspectionStatus;
      verification_status: VerificationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
