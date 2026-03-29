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
          gameday_intents: string[] | null
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
          gameday_intents?: string[] | null
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
          gameday_intents?: string[] | null
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
          away_team: string
          created_at: string
          creator_id: string
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
          away_team?: string
          created_at?: string
          creator_id: string
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
          away_team?: string
          created_at?: string
          creator_id?: string
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
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_crew_member: {
        Args: { _crew_id: string; _user_id: string }
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
