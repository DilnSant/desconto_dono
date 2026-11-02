export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          color: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          color?: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          color?: string
          icon?: string | null
          created_at?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          category_id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string | null
          business_name: string | null
          bio: string | null
          city: string
          state: string
          has_company: boolean
          accepted_terms: boolean
          is_active: boolean
          website_url: string | null
          instagram_url: string | null
          email_public: string | null
          whatsapp: string | null
          avatar_url: string | null
          cover_url: string | null
          category_id: string | null
          subcategory_id: string | null
          is_verified: boolean
          is_premium: boolean
          tiktok_url: string | null
          public_whatsapp: string | null
          plan_type: 'Gratuito' | 'Essencial' | 'Profissional' | 'Premium'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email?: string | null
          business_name?: string | null
          bio?: string | null
          city: string
          state: string
          has_company?: boolean
          accepted_terms?: boolean
          is_active?: boolean
          website_url?: string | null
          instagram_url?: string | null
          email_public?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          tiktok_url?: string | null
          public_whatsapp?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          business_name?: string | null
          bio?: string | null
          city?: string
          state?: string
          website_url?: string | null
          instagram_url?: string | null
          email_public?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      listings: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          subcategory_id: string | null
          title: string
          description: string | null
          price: number | null
          price_type: string
          image_url: string | null
          video_embed_url: string | null
          location_city: string | null
          location_state: string | null
          is_active: boolean
          views: number
          grandfathered: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          subcategory_id?: string | null
          title: string
          description?: string | null
          price?: number | null
          price_type?: string
          image_url?: string | null
          video_embed_url?: string | null
          location_city?: string | null
          location_state?: string | null
          is_active?: boolean
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          subcategory_id?: string | null
          title?: string
          description?: string | null
          price?: number | null
          price_type?: string
          image_url?: string | null
          video_embed_url?: string | null
          location_city?: string | null
          location_state?: string | null
          is_active?: boolean
          views?: number
          created_at?: string
          updated_at?: string
        }
      }
      profile_service_areas: {
        Row: {
          id: string
          profile_id: string
          ibge_code: string | null
          municipality_name: string | null
          state_code: string | null
          is_national: boolean
          declared_non_presential: boolean
          selection_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          ibge_code?: string | null
          municipality_name?: string | null
          state_code?: string | null
          is_national?: boolean
          declared_non_presential?: boolean
          selection_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          ibge_code?: string | null
          municipality_name?: string | null
          state_code?: string | null
          is_national?: boolean
          declared_non_presential?: boolean
          selection_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      profile_categories: {
        Row: {
          id: string
          profile_id: string
          category_id: string
          selection_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          category_id: string
          selection_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          category_id?: string
          selection_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      profile_subcategories: {
        Row: {
          id: string
          profile_category_id: string
          category_id: string
          subcategory_id: string
          selection_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          profile_category_id: string
          category_id: string
          subcategory_id: string
          selection_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          profile_category_id?: string
          category_id?: string
          subcategory_id?: string
          selection_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      profile_gallery_images: {
        Row: {
          id: string
          profile_id: string
          object_path: string
          display_order: number
          upload_status: 'pending' | 'ready' | 'failed'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          object_path: string
          display_order?: number
          upload_status?: 'pending' | 'ready' | 'failed'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          object_path?: string
          display_order?: number
          upload_status?: 'pending' | 'ready' | 'failed'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          profile_id: string
          plan_type: 'Essencial' | 'Profissional'
          asaas_subscription_id: string | null
          asaas_checkout_id: string | null
          external_reference: string
          asaas_customer_id: string | null
          billing_type: 'CREDIT_CARD' | 'PIX' | null
          status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'FAILED'
          current_period_end: string | null
          grace_period_ends_at: string | null
          cancel_at_period_end: boolean
          selected_listing_ids: string[]
          last_event_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          plan_type: 'Essencial' | 'Profissional'
          asaas_subscription_id?: string | null
          asaas_checkout_id?: string | null
          external_reference: string
          asaas_customer_id?: string | null
          billing_type?: 'CREDIT_CARD' | 'PIX' | null
          status?: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'FAILED'
          current_period_end?: string | null
          grace_period_ends_at?: string | null
          cancel_at_period_end?: boolean
          selected_listing_ids?: string[]
          last_event_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          plan_type?: 'Essencial' | 'Profissional'
          asaas_subscription_id?: string | null
          asaas_checkout_id?: string | null
          external_reference?: string
          asaas_customer_id?: string | null
          billing_type?: 'CREDIT_CARD' | 'PIX' | null
          status?: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'FAILED'
          current_period_end?: string | null
          grace_period_ends_at?: string | null
          cancel_at_period_end?: boolean
          selected_listing_ids?: string[]
          last_event_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      asaas_webhook_events: {
        Row: {
          event_key: string
          event_type: string
          resource_id: string | null
          processing_status: 'RECEIVED' | 'PROCESSED' | 'IGNORED' | 'FAILED'
          received_at: string
          processed_at: string | null
        }
        Insert: {
          event_key: string
          event_type: string
          resource_id?: string | null
          processing_status?: 'RECEIVED' | 'PROCESSED' | 'IGNORED' | 'FAILED'
          received_at?: string
          processed_at?: string | null
        }
        Update: {
          event_key?: string
          event_type?: string
          resource_id?: string | null
          processing_status?: 'RECEIVED' | 'PROCESSED' | 'IGNORED' | 'FAILED'
          received_at?: string
          processed_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          listing_id: string | null
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          listing_id?: string | null
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          listing_id?: string | null
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          participant_1: string
          participant_2: string
          listing_id: string | null
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          participant_1: string
          participant_2: string
          listing_id?: string | null
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          participant_1?: string
          participant_2?: string
          listing_id?: string | null
          last_message_at?: string
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          offer_id: string
          client_name: string
          client_whatsapp: string
          created_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          client_name: string
          client_whatsapp: string
          created_at?: string
        }
        Update: {
          id?: string
          offer_id?: string
          client_name?: string
          client_whatsapp?: string
          created_at?: string
        }
      }
      waitlist: {
        Row: {
          id: string
          full_name: string
          email: string
          city: string
          state: string
          category_id: string | null
          has_company: boolean
          accepted_terms: boolean
          referral_code: string | null
          position: number | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          city: string
          state: string
          category_id?: string | null
          has_company?: boolean
          accepted_terms?: boolean
          referral_code?: string | null
          position?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          city?: string
          state?: string
          category_id?: string | null
          has_company?: boolean
          accepted_terms?: boolean
          referral_code?: string | null
          position?: number | null
          created_at?: string
        }
      }
      benefits: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string
          discount_pct: number | null
          discount_val: number | null
          link_url: string | null
          whatsapp: string | null
          video_embed_url: string | null
          category_id: string | null
          valid_until: string | null
          is_active: boolean
          redemptions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description: string
          discount_pct?: number | null
          discount_val?: number | null
          link_url?: string | null
          whatsapp?: string | null
          video_embed_url?: string | null
          category_id?: string | null
          valid_until?: string | null
          is_active?: boolean
          redemptions?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          description?: string
          discount_pct?: number | null
          discount_val?: number | null
          link_url?: string | null
          whatsapp?: string | null
          video_embed_url?: string | null
          category_id?: string | null
          valid_until?: string | null
          is_active?: boolean
          redemptions?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      cities_ranking: {
        Row: {
          city: string
          state: string
          total: number
          companies_count: number
        }
      }
      profiles_public: {
        Row: {
          id: string
          full_name: string
          business_name: string | null
          bio: string | null
          city: string
          state: string
          avatar_url: string | null
          category_id: string | null
          category_name: string | null
          subcategory_id: string | null
          subcategory_name: string | null
          is_verified: boolean
          plan_type: string
          email_public: string | null
          public_whatsapp: string | null
          website_url: string | null
          instagram_url: string | null
          tiktok_url: string | null
          created_at: string
          segment_ids: string[]
          subcategory_ids: string[]
          service_area_ibge_codes: string[]
          service_area_names: string[]
          national_coverage: boolean
        }
      }
      listings_public: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          subcategory_id: string | null
          title: string
          description: string | null
          price: number | null
          price_type: string
          image_url: string | null
          location_city: string | null
          location_state: string | null
          is_active: boolean
          views: number
          created_at: string
          updated_at: string
          grandfathered: boolean
        }
      }
    }
    Functions: {
      get_effective_plan: {
        Args: { p_profile_id: string }
        Returns: string
      }
      save_profile_coverage: {
        Args: {
          p_service_areas: Json
          p_segments: Json
          p_declared_non_presential: boolean
        }
        Returns: undefined
      }
      reserve_profile_gallery_slot: {
        Args: {
          p_profile_id: string
          p_object_path: string
          p_display_order: number
        }
        Returns: string
      }
      replace_profile_cover: {
        Args: {
          p_profile_id: string
          p_object_path: string | null
        }
        Returns: string | null
      }
      update_profile_gallery_image: {
        Args: {
          p_profile_id: string
          p_image_id: string
          p_display_order: number
          p_is_active: boolean
        }
        Returns: undefined
      }
      reorder_profile_gallery_images: {
        Args: {
          p_profile_id: string
          p_image_ids: string[]
        }
        Returns: undefined
      }
      apply_asaas_subscription_event: {
        Args: {
          p_event_key: string
          p_event_type: string
          p_resource_id: string | null
          p_checkout_id: string | null
          p_asaas_subscription_id: string | null
          p_external_reference: string | null
          p_asaas_customer_id: string | null
          p_billing_type: string | null
          p_provider_status: string | null
          p_period_end: string | null
          p_event_at: string
        }
        Returns: {
          duplicate: boolean
          applied: boolean
        }[]
      }
    }
    Enums: {
      plan_type_enum: 'Gratuito' | 'Essencial' | 'Profissional' | 'Premium'
    }
  }
}

// Tipos derivados para uso nos componentes
export type Category = Database['public']['Tables']['categories']['Row']
export type Subcategory = Database['public']['Tables']['subcategories']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Listing = Database['public']['Tables']['listings']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']

export type { PlanType } from '@/lib/plans/entitlements'

// Tipos estendidos com joins
export type CategoryWithSubs = Category & {
  subcategories: Subcategory[]
}

export type ListingWithProfile = Listing & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'business_name' | 'avatar_url' | 'city' | 'state' | 'is_verified' | 'plan_type'>
  categories: Pick<Category, 'name' | 'color' | 'slug'> | null
}

export type ProfileWithCategory = Profile & {
  categories: Category | null
  subcategories: Subcategory | null
}

export type MessageWithSender = Message & {
  sender: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}
