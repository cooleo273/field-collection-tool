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
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          phone: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role: string
          phone?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string
          phone?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string
          end_date: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_date: string
          end_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          type: "kebele" | "district" | "zone" | "region"
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: "kebele" | "district" | "zone" | "region"
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: "kebele" | "district" | "zone" | "region"
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      community_groups: {
        Row: {
          id: string
          name: string
          type: string
          location_id: string | null
          campaign_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          location_id?: string | null
          campaign_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          location_id?: string | null
          campaign_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          activity_stream: string | null
          location: string | null
          community_group_type: string
          participant_count: number
          key_issues: string | null
          status: string
          submitted_by: string
          submitted_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          sync_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          activity_stream?: string | null
          location?: string | null
          community_group_type: string
          participant_count: number
          key_issues?: string | null
          status?: string
          submitted_by: string
          submitted_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          sync_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          activity_stream?: string | null
          location?: string | null
          community_group_type?: string
          participant_count?: number
          key_issues?: string | null
          status?: string
          submitted_by?: string
          submitted_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          sync_status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

