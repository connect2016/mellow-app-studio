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
      ballpark_buddy_searches: {
        Row: {
          created_at: string
          game_date: string
          id: string
          intent: string
          section: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_date: string
          id?: string
          intent?: string
          section: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_date?: string
          id?: string
          intent?: string
          section?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bar_checkins: {
        Row: {
          bar_name: string
          checked_in_at: string
          created_at: string
          custom_message: string | null
          expires_at: string
          id: string
          status: string
          user_id: string
          visibility: string
        }
        Insert: {
          bar_name: string
          checked_in_at?: string
          created_at?: string
          custom_message?: string | null
          expires_at?: string
          id?: string
          status?: string
          user_id: string
          visibility?: string
        }
        Update: {
          bar_name?: string
          checked_in_at?: string
          created_at?: string
          custom_message?: string | null
          expires_at?: string
          id?: string
          status?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      bar_plan_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_plan_comments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "bar_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_plan_options: {
        Row: {
          added_by: string
          address: string | null
          bar_name: string
          bar_slug: string | null
          created_at: string
          emoji: string | null
          id: string
          plan_id: string
        }
        Insert: {
          added_by: string
          address?: string | null
          bar_name: string
          bar_slug?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          plan_id: string
        }
        Update: {
          added_by?: string
          address?: string | null
          bar_name?: string
          bar_slug?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_plan_options_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "bar_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_plan_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_plan_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "bar_plan_options"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_plans: {
        Row: {
          created_at: string
          creator_id: string
          crew_id: string
          finalized_option_id: string | null
          id: string
          notes: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          crew_id: string
          finalized_option_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          crew_id?: string
          finalized_option_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_plans_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_votes: {
        Row: {
          bar_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          vibe: string
          wait_time: string
        }
        Insert: {
          bar_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          vibe?: string
          wait_time?: string
        }
        Update: {
          bar_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          vibe?: string
          wait_time?: string
        }
        Relationships: []
      }
      bucket_list_progress: {
        Row: {
          completed_at: string
          id: string
          task_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          task_key: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          task_key?: string
          user_id?: string
        }
        Relationships: []
      }
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
      crew_event_options: {
        Row: {
          created_at: string
          date_time: string | null
          event_id: string
          id: string
          label: string
          location: string | null
        }
        Insert: {
          created_at?: string
          date_time?: string | null
          event_id: string
          id?: string
          label: string
          location?: string | null
        }
        Update: {
          created_at?: string
          date_time?: string | null
          event_id?: string
          id?: string
          label?: string
          location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_event_options_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "crew_events"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_event_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_event_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "crew_event_options"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_events: {
        Row: {
          created_at: string
          creator_id: string
          crew_id: string
          description: string | null
          finalized_option_id: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          crew_id: string
          description?: string | null
          finalized_option_id?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          crew_id?: string
          description?: string | null
          finalized_option_id?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_events_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          crew_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          crew_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          crew_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_messages: {
        Row: {
          body: string
          created_at: string
          crew_id: string
          id: string
          is_pinned: boolean
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          crew_id: string
          id?: string
          is_pinned?: boolean
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          crew_id?: string
          id?: string
          is_pinned?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_messages_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          badge_color: string
          badge_emoji: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          invite_code: string | null
          is_public: boolean
          max_members: number
          name: string
          updated_at: string
        }
        Insert: {
          badge_color?: string
          badge_emoji?: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean
          max_members?: number
          name: string
          updated_at?: string
        }
        Update: {
          badge_color?: string
          badge_emoji?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean
          max_members?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      flash_meetup_members: {
        Row: {
          id: string
          joined_at: string
          meetup_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          meetup_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          meetup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_meetup_members_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "flash_meetups"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_meetups: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          emoji: string
          expires_at: string
          id: string
          is_system_generated: boolean
          location_name: string
          max_members: number
          status: string
          title: string
          vibe: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          emoji?: string
          expires_at?: string
          id?: string
          is_system_generated?: boolean
          location_name: string
          max_members?: number
          status?: string
          title: string
          vibe?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          emoji?: string
          expires_at?: string
          id?: string
          is_system_generated?: boolean
          location_name?: string
          max_members?: number
          status?: string
          title?: string
          vibe?: string
        }
        Relationships: []
      }
      game_memories: {
        Row: {
          caption: string | null
          created_at: string
          game_id: string | null
          id: string
          location_tag: string
          media_url: string
          tagged_users: string[]
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          location_tag?: string
          media_url: string
          tagged_users?: string[]
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          location_tag?: string
          media_url?: string
          tagged_users?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_memories_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_time_matches: {
        Row: {
          conversation_id: string | null
          created_at: string
          expires_at: string
          game_id: string
          id: string
          meeting_spot: string
          status: string
          user_a: string
          user_b: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          expires_at?: string
          game_id: string
          id?: string
          meeting_spot?: string
          status?: string
          user_a: string
          user_b: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          expires_at?: string
          game_id?: string
          id?: string
          meeting_spot?: string
          status?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_time_matches_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_time_matches_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          game_end: string
          game_start: string
          id: string
          is_home: boolean
          opponent: string
          venue: string
        }
        Insert: {
          created_at?: string
          game_end: string
          game_start: string
          id?: string
          is_home?: boolean
          opponent: string
          venue?: string
        }
        Update: {
          created_at?: string
          game_end?: string
          game_start?: string
          id?: string
          is_home?: boolean
          opponent?: string
          venue?: string
        }
        Relationships: []
      }
      homestands: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      ivy_leaves: {
        Row: {
          amount: number
          created_at: string
          homestand_id: string | null
          id: string
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          homestand_id?: string | null
          id?: string
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          homestand_id?: string | null
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ivy_leaves_homestand_id_fkey"
            columns: ["homestand_id"]
            isOneToOne: false
            referencedRelation: "homestands"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          category: string
          created_at: string
          id: string
          period: string
          period_start: string
          rank: number
          stat_value: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          period: string
          period_start: string
          rank: number
          stat_value: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          period?: string
          period_start?: string
          rank?: number
          stat_value?: number
          user_id?: string
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
      lineup_meetups: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          expires_at: string
          id: string
          location_name: string
          max_members: number
          meeting_time: string
          status: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          expires_at?: string
          id?: string
          location_name: string
          max_members?: number
          meeting_time: string
          status?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          expires_at?: string
          id?: string
          location_name?: string
          max_members?: number
          meeting_time?: string
          status?: string
        }
        Relationships: []
      }
      lineup_members: {
        Row: {
          id: string
          is_visible: boolean
          joined_at: string
          meetup_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_visible?: boolean
          joined_at?: string
          meetup_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_visible?: boolean
          joined_at?: string
          meetup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineup_members_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "lineup_meetups"
            referencedColumns: ["id"]
          },
        ]
      }
      lineup_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          meetup_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          meetup_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          meetup_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineup_messages_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "lineup_meetups"
            referencedColumns: ["id"]
          },
        ]
      }
      live_moment_participants: {
        Row: {
          id: string
          joined_at: string
          moment_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          moment_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          moment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_moment_participants_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "live_moments"
            referencedColumns: ["id"]
          },
        ]
      }
      live_moments: {
        Row: {
          created_at: string
          creator_id: string
          duration_seconds: number
          emoji: string
          expires_at: string
          id: string
          location_context: string
          metadata: Json | null
          moment_type: string
          participant_count: number
          peak_participants: number
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          duration_seconds?: number
          emoji?: string
          expires_at?: string
          id?: string
          location_context?: string
          metadata?: Json | null
          moment_type?: string
          participant_count?: number
          peak_participants?: number
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          duration_seconds?: number
          emoji?: string
          expires_at?: string
          id?: string
          location_context?: string
          metadata?: Json | null
          moment_type?: string
          participant_count?: number
          peak_participants?: number
          status?: string
          title?: string
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
      meetup_coordination: {
        Row: {
          arrival_status: string
          created_at: string
          eta_minutes: number | null
          id: string
          meetup_id: string
          note: string | null
          shared_label: string | null
          shared_lat: number | null
          shared_lng: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          arrival_status?: string
          created_at?: string
          eta_minutes?: number | null
          id?: string
          meetup_id: string
          note?: string | null
          shared_label?: string | null
          shared_lat?: number | null
          shared_lng?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          arrival_status?: string
          created_at?: string
          eta_minutes?: number | null
          id?: string
          meetup_id?: string
          note?: string | null
          shared_label?: string | null
          shared_lat?: number | null
          shared_lng?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetup_coordination_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "lineup_meetups"
            referencedColumns: ["id"]
          },
        ]
      }
      meetup_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          meetup_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          meetup_id: string
          reason?: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          meetup_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetup_reports_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "lineup_meetups"
            referencedColumns: ["id"]
          },
        ]
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
      mission_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          current_count: number
          id: string
          mission_id: string
          reset_date: string | null
          reward_claimed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          mission_id: string
          reset_date?: string | null
          reward_claimed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          mission_id?: string
          reset_date?: string | null
          reward_claimed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          badge_key: string | null
          category: string
          created_at: string
          description: string
          emoji: string
          id: string
          is_active: boolean
          is_daily: boolean
          key: string
          perk_description: string | null
          points: number
          sort_order: number
          target_count: number
          title: string
        }
        Insert: {
          badge_key?: string | null
          category?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          is_active?: boolean
          is_daily?: boolean
          key: string
          perk_description?: string | null
          points?: number
          sort_order?: number
          target_count?: number
          title: string
        }
        Update: {
          badge_key?: string | null
          category?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          is_active?: boolean
          is_daily?: boolean
          key?: string
          perk_description?: string | null
          points?: number
          sort_order?: number
          target_count?: number
          title?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          bar_freq: string
          created_at: string
          friend_freq: string
          gameday_freq: string
          id: string
          meetup_freq: string
          quiet_end: string | null
          quiet_hours_enabled: boolean
          quiet_start: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bar_freq?: string
          created_at?: string
          friend_freq?: string
          gameday_freq?: string
          id?: string
          meetup_freq?: string
          quiet_end?: string | null
          quiet_hours_enabled?: boolean
          quiet_start?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bar_freq?: string
          created_at?: string
          friend_freq?: string
          gameday_freq?: string
          id?: string
          meetup_freq?: string
          quiet_end?: string | null
          quiet_hours_enabled?: boolean
          quiet_start?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          created_at: string
          emoji: string
          id: string
          is_read: boolean
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          created_at?: string
          emoji?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string
          created_at?: string
          emoji?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      passport_checkins: {
        Row: {
          id: string
          location_key: string
          user_id: string
          verified_at: string
        }
        Insert: {
          id?: string
          location_key: string
          user_id: string
          verified_at?: string
        }
        Update: {
          id?: string
          location_key?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          age_max: number | null
          age_min: number | null
          appetizers_had_season: number
          bar_location_privacy: string | null
          beers_today_count: number
          beers_week_count: number
          best_bar: string | null
          bio: string | null
          blocked_users: string[] | null
          carb_up_strategy: string | null
          created_at: string
          display_name: string
          distance_pref_miles: number | null
          fan_identity_updated_at: string | null
          fan_style: string[] | null
          fan_tier: string | null
          fan_tier_emoji: string | null
          fan_title: string | null
          fan_xp: number | null
          favorite_bar_food: string | null
          favorite_bars: string[] | null
          favorite_food_spot: string | null
          favorite_gate: string | null
          favorite_moment: string | null
          favorite_moment_is_valid: boolean | null
          favorite_player: string | null
          game_status: string | null
          gameday_intents: string[] | null
          gameday_legend_until: string | null
          gameday_persona: string | null
          hidden_from_discover: boolean | null
          home_lat: number | null
          home_lng: number | null
          id: string
          intent: string[] | null
          is_banned: boolean | null
          is_verified: boolean | null
          location_last_set_at: string | null
          onboarding_completed: boolean | null
          post_win_meal: string | null
          postgame_food: string | null
          pregame_meal: string | null
          private_mode: boolean | null
          profile_photo: string | null
          pronouns: string | null
          quick_start: Json | null
          shots_taken_season: number
          stretch_song: string | null
          superstition: string | null
          updated_at: string
          user_id: string
          vibe_emoji: string | null
          vibe_state: string | null
          vibe_state_updated_at: string | null
          work_lat: number | null
          work_lng: number | null
          wrigley_location_privacy: string | null
          wrigley_row: string | null
          wrigley_seat: string | null
          wrigley_section: string | null
          wrigleyville_bar: string | null
          zip_code: string | null
        }
        Insert: {
          age?: number | null
          age_max?: number | null
          age_min?: number | null
          appetizers_had_season?: number
          bar_location_privacy?: string | null
          beers_today_count?: number
          beers_week_count?: number
          best_bar?: string | null
          bio?: string | null
          blocked_users?: string[] | null
          carb_up_strategy?: string | null
          created_at?: string
          display_name?: string
          distance_pref_miles?: number | null
          fan_identity_updated_at?: string | null
          fan_style?: string[] | null
          fan_tier?: string | null
          fan_tier_emoji?: string | null
          fan_title?: string | null
          fan_xp?: number | null
          favorite_bar_food?: string | null
          favorite_bars?: string[] | null
          favorite_food_spot?: string | null
          favorite_gate?: string | null
          favorite_moment?: string | null
          favorite_moment_is_valid?: boolean | null
          favorite_player?: string | null
          game_status?: string | null
          gameday_intents?: string[] | null
          gameday_legend_until?: string | null
          gameday_persona?: string | null
          hidden_from_discover?: boolean | null
          home_lat?: number | null
          home_lng?: number | null
          id?: string
          intent?: string[] | null
          is_banned?: boolean | null
          is_verified?: boolean | null
          location_last_set_at?: string | null
          onboarding_completed?: boolean | null
          post_win_meal?: string | null
          postgame_food?: string | null
          pregame_meal?: string | null
          private_mode?: boolean | null
          profile_photo?: string | null
          pronouns?: string | null
          quick_start?: Json | null
          shots_taken_season?: number
          stretch_song?: string | null
          superstition?: string | null
          updated_at?: string
          user_id: string
          vibe_emoji?: string | null
          vibe_state?: string | null
          vibe_state_updated_at?: string | null
          work_lat?: number | null
          work_lng?: number | null
          wrigley_location_privacy?: string | null
          wrigley_row?: string | null
          wrigley_seat?: string | null
          wrigley_section?: string | null
          wrigleyville_bar?: string | null
          zip_code?: string | null
        }
        Update: {
          age?: number | null
          age_max?: number | null
          age_min?: number | null
          appetizers_had_season?: number
          bar_location_privacy?: string | null
          beers_today_count?: number
          beers_week_count?: number
          best_bar?: string | null
          bio?: string | null
          blocked_users?: string[] | null
          carb_up_strategy?: string | null
          created_at?: string
          display_name?: string
          distance_pref_miles?: number | null
          fan_identity_updated_at?: string | null
          fan_style?: string[] | null
          fan_tier?: string | null
          fan_tier_emoji?: string | null
          fan_title?: string | null
          fan_xp?: number | null
          favorite_bar_food?: string | null
          favorite_bars?: string[] | null
          favorite_food_spot?: string | null
          favorite_gate?: string | null
          favorite_moment?: string | null
          favorite_moment_is_valid?: boolean | null
          favorite_player?: string | null
          game_status?: string | null
          gameday_intents?: string[] | null
          gameday_legend_until?: string | null
          gameday_persona?: string | null
          hidden_from_discover?: boolean | null
          home_lat?: number | null
          home_lng?: number | null
          id?: string
          intent?: string[] | null
          is_banned?: boolean | null
          is_verified?: boolean | null
          location_last_set_at?: string | null
          onboarding_completed?: boolean | null
          post_win_meal?: string | null
          postgame_food?: string | null
          pregame_meal?: string | null
          private_mode?: boolean | null
          profile_photo?: string | null
          pronouns?: string | null
          quick_start?: Json | null
          shots_taken_season?: number
          stretch_song?: string | null
          superstition?: string | null
          updated_at?: string
          user_id?: string
          vibe_emoji?: string | null
          vibe_state?: string | null
          vibe_state_updated_at?: string | null
          work_lat?: number | null
          work_lng?: number | null
          wrigley_location_privacy?: string | null
          wrigley_row?: string | null
          wrigley_seat?: string | null
          wrigley_section?: string | null
          wrigleyville_bar?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      pub_crawl_members: {
        Row: {
          crawl_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          crawl_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          crawl_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pub_crawl_members_crawl_id_fkey"
            columns: ["crawl_id"]
            isOneToOne: false
            referencedRelation: "pub_crawls"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_crawl_stops: {
        Row: {
          arrived_at: string | null
          bar_name: string
          crawl_id: string
          created_at: string
          id: string
          stop_order: number
        }
        Insert: {
          arrived_at?: string | null
          bar_name: string
          crawl_id: string
          created_at?: string
          id?: string
          stop_order?: number
        }
        Update: {
          arrived_at?: string | null
          bar_name?: string
          crawl_id?: string
          created_at?: string
          id?: string
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "pub_crawl_stops_crawl_id_fkey"
            columns: ["crawl_id"]
            isOneToOne: false
            referencedRelation: "pub_crawls"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_crawls: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          invite_code: string | null
          is_public: boolean
          start_bar: string
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          invite_code?: string | null
          is_public?: boolean
          start_bar: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          invite_code?: string | null
          is_public?: boolean
          start_bar?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      safety_timers: {
        Row: {
          created_at: string
          emergency_contact_name: string
          emergency_contact_phone: string
          expires_at: string
          id: string
          location_description: string
          meetup_id: string | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emergency_contact_name?: string
          emergency_contact_phone: string
          expires_at: string
          id?: string
          location_description?: string
          meetup_id?: string | null
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          expires_at?: string
          id?: string
          location_description?: string
          meetup_id?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_timers_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "lineup_meetups"
            referencedColumns: ["id"]
          },
        ]
      }
      scorer_stats: {
        Row: {
          best_streak: number
          correct_predictions: number
          games_scored: number
          id: string
          prediction_points: number
          streak: number
          total_confirmations: number
          total_predictions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          correct_predictions?: number
          games_scored?: number
          id?: string
          prediction_points?: number
          streak?: number
          total_confirmations?: number
          total_predictions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          correct_predictions?: number
          games_scored?: number
          id?: string
          prediction_points?: number
          streak?: number
          total_confirmations?: number
          total_predictions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scoring_entries: {
        Row: {
          confirmed_by: string[]
          created_at: string
          errors: number
          half: string
          hits: number
          id: string
          inning: number
          runs: number
          scored_by: string | null
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed_by?: string[]
          created_at?: string
          errors?: number
          half?: string
          hits?: number
          id?: string
          inning: number
          runs?: number
          scored_by?: string | null
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed_by?: string[]
          created_at?: string
          errors?: number
          half?: string
          hits?: number
          id?: string
          inning?: number
          runs?: number
          scored_by?: string | null
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_predictions: {
        Row: {
          created_at: string
          half: string
          id: string
          inning: number
          is_correct: boolean | null
          points_awarded: number
          predicted_play: string
          resolved_at: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          half?: string
          id?: string
          inning: number
          is_correct?: boolean | null
          points_awarded?: number
          predicted_play: string
          resolved_at?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          half?: string
          id?: string
          inning?: number
          is_correct?: boolean | null
          points_awarded?: number
          predicted_play?: string
          resolved_at?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_predictions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_reactions: {
        Row: {
          body: string
          created_at: string
          id: string
          session_id: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          session_id: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          session_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_reactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_session_members: {
        Row: {
          id: string
          joined_at: string
          location_label: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          location_label?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          location_label?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_session_members_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_sessions: {
        Row: {
          active_batter: number | null
          active_scorer_id: string | null
          away_team: string
          created_at: string
          creator_id: string
          finalized_at: string | null
          game_id: string | null
          home_team: string
          id: string
          invite_code: string | null
          is_public: boolean
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          active_batter?: number | null
          active_scorer_id?: string | null
          away_team?: string
          created_at?: string
          creator_id: string
          finalized_at?: string | null
          game_id?: string | null
          home_team?: string
          id?: string
          invite_code?: string | null
          is_public?: boolean
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          active_batter?: number | null
          active_scorer_id?: string | null
          away_team?: string
          created_at?: string
          creator_id?: string
          finalized_at?: string | null
          game_id?: string | null
          home_team?: string
          id?: string
          invite_code?: string | null
          is_public?: boolean
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_timeline: {
        Row: {
          confirmed_count: number
          created_at: string
          description: string
          half: string
          id: string
          inning: number
          play_type: string
          session_id: string
          user_id: string
        }
        Insert: {
          confirmed_count?: number
          created_at?: string
          description: string
          half?: string
          id?: string
          inning: number
          play_type: string
          session_id: string
          user_id: string
        }
        Update: {
          confirmed_count?: number
          created_at?: string
          description?: string
          half?: string
          id?: string
          inning?: number
          play_type?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_timeline_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      section_chat_messages: {
        Row: {
          body: string
          created_at: string
          game_id: string
          id: string
          section: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          game_id: string
          id?: string
          section: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          game_id?: string
          id?: string
          section?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_chat_messages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      stat_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          sort_order: number
          stat_key: string
          time_range: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          stat_key: string
          time_range?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          stat_key?: string
          time_range?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      teammate_requests: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          id: string
          latitude: number
          longitude: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          latitude: number
          longitude: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          latitude?: number
          longitude?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_pennants: {
        Row: {
          badge_key: string
          created_at: string
          current_count: number
          id: string
          target_count: number
          unlocked: boolean
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          badge_key: string
          created_at?: string
          current_count?: number
          id?: string
          target_count: number
          unlocked?: boolean
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          badge_key?: string
          created_at?: string
          current_count?: number
          id?: string
          target_count?: number
          unlocked?: boolean
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          points: number
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      vibe_posts: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          location_tag: string
          media_type: string
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          location_tag: string
          media_type?: string
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          location_tag?: string
          media_type?: string
          media_url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_ivy_leaf: {
        Args: {
          _amount?: number
          _homestand_id?: string
          _source: string
          _source_id?: string
        }
        Returns: undefined
      }
      award_user_points: {
        Args: { _points?: number; _source: string; _source_id?: string }
        Returns: undefined
      }
      get_host_trust: {
        Args: { _host_id: string }
        Returns: {
          hosted_count: number
          is_first_time: boolean
          is_trusted: boolean
          is_verified: boolean
          recent_reports: number
        }[]
      }
      get_leaderboard_extras: {
        Args: { p_category: string; p_period?: string }
        Returns: {
          rank_delta: number
          user_id: string
          weeks_active_recent: number
        }[]
      }
      get_league_leaders: {
        Args: { p_category: string; p_limit?: number; p_period?: string }
        Returns: {
          display_name: string
          favorite_food_spot: string
          profile_photo: string
          rank: number
          stat_value: number
          user_id: string
        }[]
      }
      get_map_fans: {
        Args: never
        Returns: {
          fan_display_name: string
          fan_fan_style: string[]
          fan_game_status: string
          fan_gameday_intents: string[]
          fan_gameday_persona: string
          fan_intent: string[]
          fan_latitude: number
          fan_location_last_set_at: string
          fan_longitude: number
          fan_profile_photo: string
          fan_user_id: string
          fan_wrigley_section: string
          fan_wrigleyville_bar: string
        }[]
      }
      get_public_card_extras: {
        Args: { p_user_ids: string[] }
        Returns: {
          appetizers_had_season: number
          favorite_food_spot: string
          shots_taken_season: number
          user_id: string
        }[]
      }
      get_public_profiles:
        | {
            Args: {
              p_exclude_ids?: string[]
              p_game_status?: string
              p_limit?: number
              p_only_onboarded?: boolean
              p_user_ids?: string[]
            }
            Returns: {
              age: number
              best_bar: string
              bio: string
              created_at: string
              display_name: string
              fan_style: string[]
              fan_tier: string
              fan_tier_emoji: string
              fan_title: string
              fan_xp: number
              favorite_moment: string
              favorite_player: string
              game_status: string
              gameday_intents: string[]
              gameday_persona: string
              id: string
              intent: string[]
              is_banned: boolean
              is_verified: boolean
              location_last_set_at: string
              onboarding_completed: boolean
              profile_photo: string
              pronouns: string
              stretch_song: string
              superstition: string
              updated_at: string
              user_id: string
              vibe_emoji: string
              vibe_state: string
              wrigley_row: string
              wrigley_seat: string
              wrigley_section: string
              wrigleyville_bar: string
            }[]
          }
        | {
            Args: {
              p_active_since?: string
              p_exclude_ids?: string[]
              p_game_status?: string
              p_limit?: number
              p_only_onboarded?: boolean
              p_require_bar?: boolean
              p_require_section?: boolean
              p_user_ids?: string[]
            }
            Returns: {
              age: number
              best_bar: string
              bio: string
              created_at: string
              display_name: string
              fan_style: string[]
              fan_tier: string
              fan_tier_emoji: string
              fan_title: string
              fan_xp: number
              favorite_moment: string
              favorite_player: string
              game_status: string
              gameday_intents: string[]
              gameday_persona: string
              id: string
              intent: string[]
              is_banned: boolean
              is_verified: boolean
              location_last_set_at: string
              onboarding_completed: boolean
              profile_photo: string
              pronouns: string
              stretch_song: string
              superstition: string
              updated_at: string
              user_id: string
              vibe_emoji: string
              vibe_state: string
              wrigley_row: string
              wrigley_seat: string
              wrigley_section: string
              wrigleyville_bar: string
            }[]
          }
      get_teammate_ids: {
        Args: { _user_id: string }
        Returns: {
          since: string
          teammate_id: string
        }[]
      }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_crew_member: {
        Args: { _crew_id: string; _user_id: string }
        Returns: boolean
      }
      is_meetup_participant: {
        Args: { _meetup_id: string; _user_id: string }
        Returns: boolean
      }
      notification_category: { Args: { _type: string }; Returns: string }
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
