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
          business_name: string | null
          bio: string | null
          city: string
          state: string
          website_url: string | null
          instagram_url: string | null
          email_public: string | null
          whatsapp: string | null
          avatar_url: string | null
          cover_url: string | null
          category_id: string | null
          subcategory_id: string | null
          category_ids: string[]
          subcategory_ids: string[]
          primary_category_id: string | null
          primary_subcategory_id: string | null
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
          business_name?: string | null
          bio?: string | null
          city: string
          state: string
          website_url?: string | null
          instagram_url?: string | null
          email_public?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          category_ids?: string[]
          subcategory_ids?: string[]
          primary_category_id?: string | null
          primary_subcategory_id?: string | null
          is_verified?: boolean
          is_premium?: boolean
          tiktok_url?: string | null
          public_whatsapp?: string | null
          plan_type?: 'Gratuito' | 'Essencial' | 'Profissional' | 'Premium'
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
          category_ids?: string[]
          subcategory_ids?: string[]
          primary_category_id?: string | null
          primary_subcategory_id?: string | null
          is_verified?: boolean
          is_premium?: boolean
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
          location_city: string | null
          location_state: string | null
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
          location_city?: string | null
          location_state?: string | null
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
          location_city?: string | null
          location_state?: string | null
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
    }
    Functions: { [_ in never]: never }
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

// Tipo helper para plan_type
export type PlanType = 'Gratuito' | 'Essencial' | 'Profissional' | 'Premium'

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
