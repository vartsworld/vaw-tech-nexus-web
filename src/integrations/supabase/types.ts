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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          password_hash: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          password_hash: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          password_hash?: string
          role?: string | null
        }
        Relationships: []
      }
      ai_tools: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          url: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          url?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          url?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          date: string
          id: string
          intern_id: string
          marked_at: string | null
          status: string | null
        }
        Insert: {
          date: string
          id?: string
          intern_id: string
          marked_at?: string | null
          status?: string | null
        }
        Update: {
          date?: string
          id?: string
          intern_id?: string
          marked_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      break_sessions: {
        Row: {
          break_type: string | null
          created_at: string | null
          duration_minutes: number
          end_time: string | null
          id: string
          start_time: string
          status: string | null
          time_remaining_seconds: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          break_type?: string | null
          created_at?: string | null
          duration_minutes: number
          end_time?: string | null
          id?: string
          start_time?: string
          status?: string | null
          time_remaining_seconds: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          break_type?: string | null
          created_at?: string | null
          duration_minutes?: number
          end_time?: string | null
          id?: string
          start_time?: string
          status?: string | null
          time_remaining_seconds?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          department_id: string | null
          description: string | null
          id: string
          is_general: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_general?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_general?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_channels_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_chat_channels_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_chat_channels_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_messages_channel"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_recipient"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_chat_messages_recipient"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_chat_messages_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_chat_messages_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chess_game_history: {
        Row: {
          created_at: string | null
          elo_after: number
          elo_before: number
          elo_change: number
          game_duration_seconds: number | null
          game_id: string
          id: string
          opponent_id: string
          player_id: string
          points_earned: number | null
          result: string
        }
        Insert: {
          created_at?: string | null
          elo_after: number
          elo_before: number
          elo_change?: number
          game_duration_seconds?: number | null
          game_id: string
          id?: string
          opponent_id: string
          player_id: string
          points_earned?: number | null
          result: string
        }
        Update: {
          created_at?: string | null
          elo_after?: number
          elo_before?: number
          elo_change?: number
          game_duration_seconds?: number | null
          game_id?: string
          id?: string
          opponent_id?: string
          player_id?: string
          points_earned?: number | null
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "chess_game_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "chess_games"
            referencedColumns: ["id"]
          },
        ]
      }
      chess_games: {
        Row: {
          completed_at: string | null
          created_at: string | null
          game_state: Json | null
          id: string
          player1_id: string
          player2_id: string
          status: string | null
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          game_state?: Json | null
          id?: string
          player1_id: string
          player2_id: string
          status?: string | null
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          game_state?: Json | null
          id?: string
          player1_id?: string
          player2_id?: string
          status?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_chess_games_player1"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_chess_games_player1"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_chess_games_player2"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_chess_games_player2"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_chess_games_winner"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_chess_games_winner"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chess_stats: {
        Row: {
          created_at: string | null
          current_win_streak: number | null
          elo_rating: number | null
          games_drawn: number | null
          games_lost: number | null
          games_played: number | null
          games_won: number | null
          id: string
          longest_win_streak: number | null
          total_points_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_win_streak?: number | null
          elo_rating?: number | null
          games_drawn?: number | null
          games_lost?: number | null
          games_played?: number | null
          games_won?: number | null
          id?: string
          longest_win_streak?: number | null
          total_points_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_win_streak?: number | null
          elo_rating?: number | null
          games_drawn?: number | null
          games_lost?: number | null
          games_played?: number | null
          games_won?: number | null
          id?: string
          longest_win_streak?: number | null
          total_points_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      class_attendance: {
        Row: {
          class_id: string | null
          id: string
          intern_id: string | null
          marked_at: string | null
          status: string | null
        }
        Insert: {
          class_id?: string | null
          id?: string
          intern_id?: string | null
          marked_at?: string | null
          status?: string | null
        }
        Update: {
          class_id?: string | null
          id?: string
          intern_id?: string | null
          marked_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_attendance_intern_id_fkey"
            columns: ["intern_id"]
            isOneToOne: false
            referencedRelation: "interns"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          instructor: string
          meeting_link: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          instructor: string
          meeting_link?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          instructor?: string
          meeting_link?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_logos: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          company_name: string
          contact_person: string
          created_at: string | null
          created_by: string
          email: string
          id: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_person: string
          created_at?: string | null
          created_by: string
          email: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_person?: string
          created_at?: string | null
          created_by?: string
          email?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      code_puzzle_submissions: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean | null
          puzzle_id: string
          submitted_code: string
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          puzzle_id: string
          submitted_code: string
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          puzzle_id?: string
          submitted_code?: string
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_puzzle_submissions_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "code_puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      code_puzzles: {
        Row: {
          created_at: string | null
          description: string
          difficulty: string | null
          id: string
          is_active: boolean | null
          puzzle_code: string
          solution_code: string
          test_cases: Json | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          puzzle_code: string
          solution_code: string
          test_cases?: Json | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          puzzle_code?: string
          solution_code?: string
          test_cases?: Json | null
          title?: string
        }
        Relationships: []
      }
      company_coin_bank: {
        Row: {
          allocated_to_heads: number | null
          allocated_to_quests: number | null
          available_balance: number | null
          created_at: string | null
          created_by: string | null
          financial_year: string
          granted_by_hr: number | null
          id: string
          total_budget: number
          updated_at: string | null
        }
        Insert: {
          allocated_to_heads?: number | null
          allocated_to_quests?: number | null
          available_balance?: number | null
          created_at?: string | null
          created_by?: string | null
          financial_year: string
          granted_by_hr?: number | null
          id?: string
          total_budget?: number
          updated_at?: string | null
        }
        Update: {
          allocated_to_heads?: number | null
          allocated_to_quests?: number | null
          available_balance?: number | null
          created_at?: string | null
          created_by?: string | null
          financial_year?: string
          granted_by_hr?: number | null
          id?: string
          total_budget?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_quotes: {
        Row: {
          author: string
          created_at: string | null
          date: string | null
          id: string
          is_active: boolean | null
          quote: string
        }
        Insert: {
          author: string
          created_at?: string | null
          date?: string | null
          id?: string
          is_active?: boolean | null
          quote: string
        }
        Update: {
          author?: string
          created_at?: string | null
          date?: string | null
          id?: string
          is_active?: boolean | null
          quote?: string
        }
        Relationships: []
      }
      daily_quotes_staff: {
        Row: {
          author: string | null
          content: string
          created_at: string | null
          id: string
          is_system: boolean | null
        }
        Insert: {
          author?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_system?: boolean | null
        }
        Update: {
          author?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_system?: boolean | null
        }
        Relationships: []
      }
      delivery_persons: {
        Row: {
          created_at: string | null
          current_location: unknown
          email: string
          id: string
          name: string
          phone: string
          status: Database["public"]["Enums"]["delivery_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_location?: unknown
          email: string
          id?: string
          name: string
          phone: string
          status?: Database["public"]["Enums"]["delivery_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_location?: unknown
          email?: string
          id?: string
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["delivery_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          head_id: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          head_id?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          head_id?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_department_head"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_approvals: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reason: string
          request_type: string | null
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reason: string
          request_type?: string | null
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reason?: string
          request_type?: string | null
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      hall_of_fame_entries: {
        Row: {
          achievement_data: Json | null
          achievement_type: string
          awarded_at: string | null
          id: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type: string
          awarded_at?: string | null
          id?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string
          awarded_at?: string | null
          id?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      head_budget_requests: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          budget_id: string
          created_at: string | null
          head_user_id: string
          id: string
          justification: string
          requested_amount: number
          status: string | null
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          budget_id: string
          created_at?: string | null
          head_user_id: string
          id?: string
          justification: string
          requested_amount: number
          status?: string | null
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          budget_id?: string
          created_at?: string | null
          head_user_id?: string
          id?: string
          justification?: string
          requested_amount?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "head_budget_requests_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "head_coin_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      head_coin_budgets: {
        Row: {
          additional_approved: number | null
          allocated_coins: number | null
          available_coins: number | null
          base_allocation: number | null
          created_at: string | null
          head_user_id: string
          id: string
          month: number
          spent_coins: number | null
          total_allocation: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          additional_approved?: number | null
          allocated_coins?: number | null
          available_coins?: number | null
          base_allocation?: number | null
          created_at?: string | null
          head_user_id: string
          id?: string
          month: number
          spent_coins?: number | null
          total_allocation?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          additional_approved?: number | null
          allocated_coins?: number | null
          available_coins?: number | null
          base_allocation?: number | null
          created_at?: string | null
          head_user_id?: string
          id?: string
          month?: number
          spent_coins?: number | null
          total_allocation?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          service: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          service?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          service?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      intern_experiences: {
        Row: {
          address: string | null
          certificate_requested: boolean | null
          created_at: string
          email: string
          experience_rating: number | null
          id: string
          intern_name: string
          internship_domain: string
          mentor_feedback: string | null
          overall_experience: string
          phone: string | null
          project_highlights: string | null
          skills_learned: string | null
          status: string | null
          suggestions_for_improvement: string | null
          updated_at: string
          would_recommend: boolean | null
        }
        Insert: {
          address?: string | null
          certificate_requested?: boolean | null
          created_at?: string
          email: string
          experience_rating?: number | null
          id?: string
          intern_name: string
          internship_domain: string
          mentor_feedback?: string | null
          overall_experience: string
          phone?: string | null
          project_highlights?: string | null
          skills_learned?: string | null
          status?: string | null
          suggestions_for_improvement?: string | null
          updated_at?: string
          would_recommend?: boolean | null
        }
        Update: {
          address?: string | null
          certificate_requested?: boolean | null
          created_at?: string
          email?: string
          experience_rating?: number | null
          id?: string
          intern_name?: string
          internship_domain?: string
          mentor_feedback?: string | null
          overall_experience?: string
          phone?: string | null
          project_highlights?: string | null
          skills_learned?: string | null
          status?: string | null
          suggestions_for_improvement?: string | null
          updated_at?: string
          would_recommend?: boolean | null
        }
        Relationships: []
      }
      intern_projects: {
        Row: {
          admin_feedback: string | null
          category: string
          created_at: string | null
          description: string
          display_order: number | null
          due_date: string | null
          featured: boolean | null
          id: string
          image_url: string
          intern_id: string | null
          rating: number | null
          status: string | null
          submission_content: string | null
          submission_date: string | null
          submission_files: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_feedback?: string | null
          category: string
          created_at?: string | null
          description: string
          display_order?: number | null
          due_date?: string | null
          featured?: boolean | null
          id?: string
          image_url: string
          intern_id?: string | null
          rating?: number | null
          status?: string | null
          submission_content?: string | null
          submission_date?: string | null
          submission_files?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_feedback?: string | null
          category?: string
          created_at?: string | null
          description?: string
          display_order?: number | null
          due_date?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string
          intern_id?: string | null
          rating?: number | null
          status?: string | null
          submission_content?: string | null
          submission_date?: string | null
          submission_files?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intern_projects_intern_id_fkey"
            columns: ["intern_id"]
            isOneToOne: false
            referencedRelation: "interns"
            referencedColumns: ["id"]
          },
        ]
      }
      interns: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          email: string
          field_of_interest: string | null
          full_name: string
          id: string
          is_emoji_password: boolean | null
          password_hash: string
          phone: string | null
          profile_photo_url: string | null
          status: string | null
          university: string | null
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email: string
          field_of_interest?: string | null
          full_name: string
          id?: string
          is_emoji_password?: boolean | null
          password_hash: string
          phone?: string | null
          profile_photo_url?: string | null
          status?: string | null
          university?: string | null
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string
          field_of_interest?: string | null
          full_name?: string
          id?: string
          is_emoji_password?: boolean | null
          password_hash?: string
          phone?: string | null
          profile_photo_url?: string | null
          status?: string | null
          university?: string | null
        }
        Relationships: []
      }
      internship_applications: {
        Row: {
          college_name: string
          course: string
          cover_letter: string
          created_at: string
          domains: Json
          email: string
          full_name: string
          graduation_year: string
          id: string
          phone: string
          resume_url: string | null
          updated_at: string
        }
        Insert: {
          college_name: string
          course: string
          cover_letter: string
          created_at?: string
          domains: Json
          email: string
          full_name: string
          graduation_year: string
          id?: string
          phone: string
          resume_url?: string | null
          updated_at?: string
        }
        Update: {
          college_name?: string
          course?: string
          cover_letter?: string
          created_at?: string
          domains?: Json
          email?: string
          full_name?: string
          graduation_year?: string
          id?: string
          phone?: string
          resume_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          delivery_address: string
          delivery_location: unknown
          delivery_person_id: string | null
          id: string
          notes: string | null
          prescription_url: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at: string | null
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_address: string
          delivery_location: unknown
          delivery_person_id?: string | null
          id?: string
          notes?: string | null
          prescription_url?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at?: string | null
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          delivery_address?: string
          delivery_location?: unknown
          delivery_person_id?: string | null
          id?: string
          notes?: string | null
          prescription_url?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_person_id_fkey"
            columns: ["delivery_person_id"]
            isOneToOne: false
            referencedRelation: "delivery_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          featured: boolean | null
          id: string
          industry: string | null
          logo_url: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          featured?: boolean | null
          id?: string
          industry?: string | null
          logo_url: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          featured?: boolean | null
          id?: string
          industry?: string | null
          logo_url?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      points_redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completion_notes: string | null
          created_at: string | null
          delivery_address: string | null
          id: string
          points_spent: number
          redemption_date: string | null
          rejection_reason: string | null
          reward_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completion_notes?: string | null
          created_at?: string | null
          delivery_address?: string | null
          id?: string
          points_spent: number
          redemption_date?: string | null
          rejection_reason?: string | null
          reward_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completion_notes?: string | null
          created_at?: string | null
          delivery_address?: string | null
          id?: string
          points_spent?: number
          redemption_date?: string | null
          rejection_reason?: string | null
          reward_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_redemptions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "points_redemptions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "points_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "points_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          name: string
          price: number
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name: string
          price: number
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      project_coin_allocations: {
        Row: {
          allocated_by: string
          allocated_to: string
          approval_date: string | null
          base_coin_amount: number
          bonus_earned: number | null
          budget_id: string
          completed_in_half_time: boolean | null
          created_at: string | null
          days_late: number | null
          employee_deadline: string
          final_coins_awarded: number | null
          half_time_bonus: number | null
          head_deadline: string
          hr_approval_date: string | null
          hr_approval_notes: string | null
          hr_approval_requested: boolean | null
          hr_approved_by: string | null
          id: string
          original_deadline: string
          penalty_amount: number | null
          status: string | null
          submission_date: string | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          allocated_by: string
          allocated_to: string
          approval_date?: string | null
          base_coin_amount: number
          bonus_earned?: number | null
          budget_id: string
          completed_in_half_time?: boolean | null
          created_at?: string | null
          days_late?: number | null
          employee_deadline: string
          final_coins_awarded?: number | null
          half_time_bonus?: number | null
          head_deadline: string
          hr_approval_date?: string | null
          hr_approval_notes?: string | null
          hr_approval_requested?: boolean | null
          hr_approved_by?: string | null
          id?: string
          original_deadline: string
          penalty_amount?: number | null
          status?: string | null
          submission_date?: string | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          allocated_by?: string
          allocated_to?: string
          approval_date?: string | null
          base_coin_amount?: number
          bonus_earned?: number | null
          budget_id?: string
          completed_in_half_time?: boolean | null
          created_at?: string | null
          days_late?: number | null
          employee_deadline?: string
          final_coins_awarded?: number | null
          half_time_bonus?: number | null
          head_deadline?: string
          hr_approval_date?: string | null
          hr_approval_notes?: string | null
          hr_approval_requested?: boolean | null
          hr_approved_by?: string | null
          id?: string
          original_deadline?: string
          penalty_amount?: number | null
          status?: string | null
          submission_date?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_coin_allocations_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "head_coin_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_coin_allocations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "staff_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_monitors: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          domain_renewal_cycle: string | null
          domain_renewal_date: string | null
          facebook_token_renewal_cycle: string | null
          facebook_token_renewal_date: string | null
          id: string
          notes: string | null
          project_name: string
          server_renewal_cycle: string | null
          server_renewal_date: string | null
          status: string | null
          updated_at: string
          website_url: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          domain_renewal_cycle?: string | null
          domain_renewal_date?: string | null
          facebook_token_renewal_cycle?: string | null
          facebook_token_renewal_date?: string | null
          id?: string
          notes?: string | null
          project_name: string
          server_renewal_cycle?: string | null
          server_renewal_date?: string | null
          status?: string | null
          updated_at?: string
          website_url: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          domain_renewal_cycle?: string | null
          domain_renewal_date?: string | null
          facebook_token_renewal_cycle?: string | null
          facebook_token_renewal_date?: string | null
          id?: string
          notes?: string | null
          project_name?: string
          server_renewal_cycle?: string | null
          server_renewal_date?: string | null
          status?: string | null
          updated_at?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_monitors_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          admin_feedback: string | null
          category: string
          created_at: string | null
          description: string
          display_order: number | null
          due_date: string | null
          featured: boolean | null
          id: string
          image_url: string
          intern_id: string | null
          rating: number | null
          status: string | null
          submission_content: string | null
          submission_date: string | null
          submission_files: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_feedback?: string | null
          category: string
          created_at?: string | null
          description: string
          display_order?: number | null
          due_date?: string | null
          featured?: boolean | null
          id?: string
          image_url: string
          intern_id?: string | null
          rating?: number | null
          status?: string | null
          submission_content?: string | null
          submission_date?: string | null
          submission_files?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_feedback?: string | null
          category?: string
          created_at?: string | null
          description?: string
          display_order?: number | null
          due_date?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string
          intern_id?: string | null
          rating?: number | null
          status?: string | null
          submission_content?: string | null
          submission_date?: string | null
          submission_files?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_intern_id_fkey"
            columns: ["intern_id"]
            isOneToOne: false
            referencedRelation: "interns"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          category: string | null
          coin_reward: number
          coins_allocated: boolean | null
          created_at: string | null
          created_by: string | null
          criteria: Json
          current_winners: number | null
          department_id: string | null
          description: string
          id: string
          is_active: boolean | null
          max_winners: number | null
          name: string
          period_end: string
          period_start: string
          scope: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          coin_reward: number
          coins_allocated?: boolean | null
          created_at?: string | null
          created_by?: string | null
          criteria: Json
          current_winners?: number | null
          department_id?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          max_winners?: number | null
          name: string
          period_end: string
          period_start: string
          scope?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          coin_reward?: number
          coins_allocated?: boolean | null
          created_at?: string | null
          created_by?: string | null
          criteria?: Json
          current_winners?: number | null
          department_id?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          max_winners?: number | null
          name?: string
          period_end?: string
          period_start?: string
          scope?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          category: string | null
          correct_answer: string
          created_at: string | null
          difficulty: string | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
        }
        Insert: {
          category?: string | null
          correct_answer: string
          created_at?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          options: Json
          question: string
        }
        Update: {
          category?: string | null
          correct_answer?: string
          created_at?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
        }
        Relationships: []
      }
      quiz_submissions: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean | null
          question_id: string
          selected_answer: string
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_answer: string
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_answer?: string
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_catalog: {
        Row: {
          category: string | null
          coin_cost: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          requires_finance_approval: boolean | null
          requires_hr_approval: boolean | null
          stock_quantity: number | null
          terms_conditions: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          coin_cost: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          requires_finance_approval?: boolean | null
          requires_hr_approval?: boolean | null
          stock_quantity?: number | null
          terms_conditions?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          coin_cost?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          requires_finance_approval?: boolean | null
          requires_hr_approval?: boolean | null
          stock_quantity?: number | null
          terms_conditions?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          coins_spent: number
          created_at: string | null
          finance_review_notes: string | null
          finance_reviewed_at: string | null
          finance_reviewed_by: string | null
          fulfilled_at: string | null
          fulfillment_notes: string | null
          hr_review_notes: string | null
          hr_reviewed_at: string | null
          hr_reviewed_by: string | null
          id: string
          requested_at: string | null
          reward_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          coins_spent: number
          created_at?: string | null
          finance_review_notes?: string | null
          finance_reviewed_at?: string | null
          finance_reviewed_by?: string | null
          fulfilled_at?: string | null
          fulfillment_notes?: string | null
          hr_review_notes?: string | null
          hr_reviewed_at?: string | null
          hr_reviewed_by?: string | null
          id?: string
          requested_at?: string | null
          reward_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          coins_spent?: number
          created_at?: string | null
          finance_review_notes?: string | null
          finance_reviewed_at?: string | null
          finance_reviewed_by?: string | null
          fulfilled_at?: string | null
          fulfillment_notes?: string | null
          hr_review_notes?: string | null
          hr_reviewed_at?: string | null
          hr_reviewed_by?: string | null
          id?: string
          requested_at?: string | null
          reward_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_catalog: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          monetary_value: number | null
          points_cost: number
          redemption_limit: number | null
          stock_quantity: number | null
          terms_conditions: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          monetary_value?: number | null
          points_cost: number
          redemption_limit?: number | null
          stock_quantity?: number | null
          terms_conditions?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          monetary_value?: number | null
          points_cost?: number
          redemption_limit?: number | null
          stock_quantity?: number | null
          terms_conditions?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_catalog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rewards_catalog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address_line1: string
          city: string
          company_name: string | null
          country: string
          created_at: string | null
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          logo_path: string | null
          phone_number: string
          pin_code: string
          services: string[]
          state: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1: string
          city: string
          company_name?: string | null
          country: string
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          full_name: string
          id?: string
          logo_path?: string | null
          phone_number: string
          pin_code: string
          services: string[]
          state: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string
          city?: string
          company_name?: string | null
          country?: string
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          logo_path?: string | null
          phone_number?: string
          pin_code?: string
          services?: string[]
          state?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      staff_attendance: {
        Row: {
          check_in_time: string | null
          created_at: string | null
          date: string
          id: string
          is_late: boolean | null
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_late?: boolean | null
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_late?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_staff_attendance_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_staff_attendance_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      staff_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_notifications: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          department_id: string | null
          expires_at: string | null
          id: string
          is_urgent: boolean | null
          read_by: string[] | null
          target_users: string[] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          department_id?: string | null
          expires_at?: string | null
          id?: string
          is_urgent?: boolean | null
          read_by?: string[] | null
          target_users?: string[] | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          department_id?: string | null
          expires_at?: string | null
          id?: string
          is_urgent?: boolean | null
          read_by?: string[] | null
          target_users?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_staff_notifications_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_staff_notifications_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_staff_notifications_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          about_me: string | null
          application_status: string | null
          applied_via_link: boolean | null
          attendance_streak: number | null
          avatar_url: string | null
          created_at: string | null
          cv_url: string | null
          date_of_birth: string | null
          department_id: string | null
          earnings: number | null
          email: string
          emoji_password: string | null
          father_name: string | null
          first_time_passcode: string | null
          full_name: string
          gender: string | null
          hire_date: string | null
          id: string
          is_department_head: boolean | null
          is_emoji_password: boolean | null
          last_login_attempt: string | null
          login_attempts: number | null
          marriage_preference: string | null
          mother_name: string | null
          passcode_used: boolean | null
          profile_photo_url: string | null
          reference_person_name: string | null
          reference_person_number: string | null
          relationship_status: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          siblings: string | null
          total_points: number | null
          updated_at: string | null
          user_id: string
          username: string
          work_confidence_level: string | null
        }
        Insert: {
          about_me?: string | null
          application_status?: string | null
          applied_via_link?: boolean | null
          attendance_streak?: number | null
          avatar_url?: string | null
          created_at?: string | null
          cv_url?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          earnings?: number | null
          email: string
          emoji_password?: string | null
          father_name?: string | null
          first_time_passcode?: string | null
          full_name: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          is_department_head?: boolean | null
          is_emoji_password?: boolean | null
          last_login_attempt?: string | null
          login_attempts?: number | null
          marriage_preference?: string | null
          mother_name?: string | null
          passcode_used?: boolean | null
          profile_photo_url?: string | null
          reference_person_name?: string | null
          reference_person_number?: string | null
          relationship_status?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          siblings?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
          username: string
          work_confidence_level?: string | null
        }
        Update: {
          about_me?: string | null
          application_status?: string | null
          applied_via_link?: boolean | null
          attendance_streak?: number | null
          avatar_url?: string | null
          created_at?: string | null
          cv_url?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          earnings?: number | null
          email?: string
          emoji_password?: string | null
          father_name?: string | null
          first_time_passcode?: string | null
          full_name?: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          is_department_head?: boolean | null
          is_emoji_password?: boolean | null
          last_login_attempt?: string | null
          login_attempts?: number | null
          marriage_preference?: string | null
          mother_name?: string | null
          passcode_used?: boolean | null
          profile_photo_url?: string | null
          reference_person_name?: string | null
          reference_person_number?: string | null
          relationship_status?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          siblings?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string
          work_confidence_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_staff_profiles_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_projects: {
        Row: {
          created_at: string | null
          created_by: string
          department_id: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_subtasks: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_to: string
          attachments: Json | null
          comments: Json | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          points: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to: string
          attachments?: Json | null
          comments?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          points?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string
          attachments?: Json | null
          comments?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          points?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_subtasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "staff_subtasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "staff_subtasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "staff_subtasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "staff_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "staff_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_tasks: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_by: string
          assigned_to: string
          attachments: Json | null
          breaks_taken: number | null
          client_id: string | null
          comments: Json | null
          completed_at: string | null
          created_at: string | null
          department_id: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          points: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          timer_started_at: string | null
          title: string
          trial_period: boolean | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_by: string
          assigned_to: string
          attachments?: Json | null
          breaks_taken?: number | null
          client_id?: string | null
          comments?: Json | null
          completed_at?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          points?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          timer_started_at?: string | null
          title: string
          trial_period?: boolean | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_by?: string
          assigned_to?: string
          attachments?: Json | null
          breaks_taken?: number | null
          client_id?: string | null
          comments?: Json | null
          completed_at?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          points?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          timer_started_at?: string | null
          title?: string
          trial_period?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_staff_tasks_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_staff_tasks_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_staff_tasks_assigned_to"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_staff_tasks_assigned_to"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "staff_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      team_applications: {
        Row: {
          created_at: string
          current_position: string | null
          email: string
          experience_years: number | null
          full_name: string
          id: string
          linkedin_url: string | null
          phone: string
          portfolio_url: string | null
          preferred_role: string | null
          resume_url: string | null
          skills: string
          status: string | null
          updated_at: string
          why_join_team: string
        }
        Insert: {
          created_at?: string
          current_position?: string | null
          email: string
          experience_years?: number | null
          full_name: string
          id?: string
          linkedin_url?: string | null
          phone: string
          portfolio_url?: string | null
          preferred_role?: string | null
          resume_url?: string | null
          skills: string
          status?: string | null
          updated_at?: string
          why_join_team: string
        }
        Update: {
          created_at?: string
          current_position?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          phone?: string
          portfolio_url?: string | null
          preferred_role?: string | null
          resume_url?: string | null
          skills?: string
          status?: string | null
          updated_at?: string
          why_join_team?: string
        }
        Relationships: []
      }
      team_applications_staff: {
        Row: {
          about_me: string | null
          created_at: string | null
          cv_url: string | null
          date_of_birth: string | null
          email: string
          father_name: string | null
          full_name: string
          gender: string | null
          id: string
          marriage_preference: string | null
          mother_name: string | null
          phone: string | null
          preferred_department_id: string | null
          preferred_role: Database["public"]["Enums"]["user_role"] | null
          profile_photo_url: string | null
          reference_person_name: string | null
          reference_person_number: string | null
          relationship_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          siblings: string | null
          status: string | null
          updated_at: string | null
          username: string | null
          work_confidence_level: string | null
        }
        Insert: {
          about_me?: string | null
          created_at?: string | null
          cv_url?: string | null
          date_of_birth?: string | null
          email: string
          father_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          marriage_preference?: string | null
          mother_name?: string | null
          phone?: string | null
          preferred_department_id?: string | null
          preferred_role?: Database["public"]["Enums"]["user_role"] | null
          profile_photo_url?: string | null
          reference_person_name?: string | null
          reference_person_number?: string | null
          relationship_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          siblings?: string | null
          status?: string | null
          updated_at?: string | null
          username?: string | null
          work_confidence_level?: string | null
        }
        Update: {
          about_me?: string | null
          created_at?: string | null
          cv_url?: string | null
          date_of_birth?: string | null
          email?: string
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          marriage_preference?: string | null
          mother_name?: string | null
          phone?: string | null
          preferred_department_id?: string | null
          preferred_role?: Database["public"]["Enums"]["user_role"] | null
          profile_photo_url?: string | null
          reference_person_name?: string | null
          reference_person_number?: string | null
          relationship_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          siblings?: string | null
          status?: string | null
          updated_at?: string | null
          username?: string | null
          work_confidence_level?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_company: string | null
          client_name: string
          client_position: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          message: string
          rating: number
          updated_at: string | null
        }
        Insert: {
          client_company?: string | null
          client_name: string
          client_position?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          message: string
          rating: number
          updated_at?: string | null
        }
        Update: {
          client_company?: string | null
          client_name?: string
          client_position?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          message?: string
          rating?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          metadata: Json | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_activity_log_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user_activity_log_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_coin_transactions: {
        Row: {
          category: string | null
          coins: number
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string
          related_allocation_id: string | null
          related_quest_id: string | null
          related_redemption_id: string | null
          related_task_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          category?: string | null
          coins: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          related_allocation_id?: string | null
          related_quest_id?: string | null
          related_redemption_id?: string | null
          related_task_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          category?: string | null
          coins?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          related_allocation_id?: string | null
          related_quest_id?: string | null
          related_redemption_id?: string | null
          related_task_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coin_transactions_related_allocation_id_fkey"
            columns: ["related_allocation_id"]
            isOneToOne: false
            referencedRelation: "project_coin_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coin_transactions_related_quest_id_fkey"
            columns: ["related_quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coin_transactions_related_redemption_id_fkey"
            columns: ["related_redemption_id"]
            isOneToOne: false
            referencedRelation: "reward_redemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coin_transactions_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "staff_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mood_entries: {
        Row: {
          created_at: string | null
          date: string
          id: string
          mood: Database["public"]["Enums"]["mood_type"]
          personal_quote: string | null
          sentiment_score: number | null
          share_anonymously: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          mood: Database["public"]["Enums"]["mood_type"]
          personal_quote?: string | null
          sentiment_score?: number | null
          share_anonymously?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          mood?: Database["public"]["Enums"]["mood_type"]
          personal_quote?: string | null
          sentiment_score?: number | null
          share_anonymously?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_mood_entries_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user_mood_entries_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_points_log: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          points: number
          reason: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_points_log_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user_points_log_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_presence_status: {
        Row: {
          current_status: string
          last_activity_at: string | null
          reactivation_code: number | null
          session_start_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_status?: string
          last_activity_at?: string | null
          reactivation_code?: number | null
          session_start_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_status?: string
          last_activity_at?: string | null
          reactivation_code?: number | null
          session_start_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_presence_status_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user_presence_status_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_quest_progress: {
        Row: {
          awarded_at: string | null
          awarded_by: string | null
          coins_awarded: boolean | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          progress: Json | null
          quest_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          awarded_by?: string | null
          coins_awarded?: boolean | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: Json | null
          quest_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          awarded_by?: string | null
          coins_awarded?: boolean | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: Json | null
          quest_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_spotify_sessions: {
        Row: {
          access_token: string | null
          created_at: string | null
          current_track: Json | null
          expires_at: string | null
          id: string
          is_playing: boolean | null
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          current_track?: Json | null
          expires_at?: string | null
          id?: string
          is_playing?: boolean | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          current_track?: Json | null
          expires_at?: string | null
          id?: string
          is_playing?: boolean | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_spotify_sessions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user_spotify_sessions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "top_coin_earners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          password: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          password: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vaw_campaigns: {
        Row: {
          campaign_name: string
          created_at: string | null
          cup_design_url: string | null
          end_date: string | null
          id: string
          impressions: number | null
          qr_code_link: string | null
          quantity: number | null
          sponsor_id: string
          start_date: string | null
          status: string | null
          target_location: string | null
          tissue_design_url: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_name: string
          created_at?: string | null
          cup_design_url?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          qr_code_link?: string | null
          quantity?: number | null
          sponsor_id: string
          start_date?: string | null
          status?: string | null
          target_location?: string | null
          tissue_design_url?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_name?: string
          created_at?: string | null
          cup_design_url?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          qr_code_link?: string | null
          quantity?: number | null
          sponsor_id?: string
          start_date?: string | null
          status?: string | null
          target_location?: string | null
          tissue_design_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaw_campaigns_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "vaw_sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      vaw_orders: {
        Row: {
          created_at: string | null
          cups_quantity: number | null
          delivery_date: string | null
          id: string
          status: string | null
          tissues_quantity: number | null
          updated_at: string | null
          vendor_id: string
          waste_bin_requested: boolean | null
        }
        Insert: {
          created_at?: string | null
          cups_quantity?: number | null
          delivery_date?: string | null
          id?: string
          status?: string | null
          tissues_quantity?: number | null
          updated_at?: string | null
          vendor_id: string
          waste_bin_requested?: boolean | null
        }
        Update: {
          created_at?: string | null
          cups_quantity?: number | null
          delivery_date?: string | null
          id?: string
          status?: string | null
          tissues_quantity?: number | null
          updated_at?: string | null
          vendor_id?: string
          waste_bin_requested?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vaw_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vaw_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vaw_recycling_log: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          points_earned: number
          qr_code: string | null
          vendor_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          points_earned: number
          qr_code?: string | null
          vendor_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          points_earned?: number
          qr_code?: string | null
          vendor_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "vaw_recycling_log_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vaw_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vaw_redemptions: {
        Row: {
          created_at: string | null
          id: string
          points_spent: number
          reward_id: string
          status: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_spent: number
          reward_id: string
          status?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaw_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "vaw_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaw_redemptions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vaw_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vaw_rewards: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          points_required: number
          reward_description: string | null
          reward_name: string
          reward_type: string
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          points_required: number
          reward_description?: string | null
          reward_name: string
          reward_type: string
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          points_required?: number
          reward_description?: string | null
          reward_name?: string
          reward_type?: string
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vaw_sponsors: {
        Row: {
          business_category: string | null
          company_name: string
          contact_name: string
          created_at: string | null
          email: string
          gst_number: string | null
          id: string
          phone: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_category?: string | null
          company_name: string
          contact_name: string
          created_at?: string | null
          email: string
          gst_number?: string | null
          id?: string
          phone: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_category?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string | null
          email?: string
          gst_number?: string | null
          id?: string
          phone?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vaw_vendors: {
        Row: {
          address: string
          created_at: string | null
          email: string
          gst_certificate_url: string | null
          id: string
          kyc_document_url: string | null
          password: string
          phone: string
          shop_name: string
          status: string | null
          total_cups_used: number | null
          total_points: number | null
          total_recycled_cups: number | null
          total_tissues_used: number | null
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          address: string
          created_at?: string | null
          email: string
          gst_certificate_url?: string | null
          id?: string
          kyc_document_url?: string | null
          password: string
          phone: string
          shop_name: string
          status?: string | null
          total_cups_used?: number | null
          total_points?: number | null
          total_recycled_cups?: number | null
          total_tissues_used?: number | null
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          address?: string
          created_at?: string | null
          email?: string
          gst_certificate_url?: string | null
          id?: string
          kyc_document_url?: string | null
          password?: string
          phone?: string
          shop_name?: string
          status?: string | null
          total_cups_used?: number | null
          total_points?: number | null
          total_recycled_cups?: number | null
          total_tissues_used?: number | null
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string
          created_at: string | null
          email: string
          id: string
          license_number: string
          location: unknown
          name: string
          phone: string
          status: Database["public"]["Enums"]["vendor_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          email: string
          id?: string
          license_number: string
          location: unknown
          name: string
          phone: string
          status?: Database["public"]["Enums"]["vendor_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          email?: string
          id?: string
          license_number?: string
          location?: unknown
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["vendor_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      word_game_scores: {
        Row: {
          created_at: string | null
          difficulty: string | null
          id: string
          score: number
          time_taken_seconds: number | null
          user_id: string
          words_found: number | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          score?: number
          time_taken_seconds?: number | null
          user_id: string
          words_found?: number | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          score?: number
          time_taken_seconds?: number | null
          user_id?: string
          words_found?: number | null
        }
        Relationships: []
      }
      workspace_layouts: {
        Row: {
          created_at: string
          id: string
          layout_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      chess_leaderboard: {
        Row: {
          current_win_streak: number | null
          elo_rating: number | null
          full_name: string | null
          games_drawn: number | null
          games_lost: number | null
          games_played: number | null
          games_won: number | null
          longest_win_streak: number | null
          user_id: string | null
          win_percentage: number | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      top_coin_earners: {
        Row: {
          full_name: string | null
          last_activity: string | null
          total_coins: number | null
          total_transactions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      allocate_coins_to_project: {
        Args: {
          p_coin_amount: number
          p_employee_id: string
          p_half_time_bonus?: number
          p_head_id: string
          p_original_deadline: string
          p_task_id: string
        }
        Returns: string
      }
      award_quest_completion: {
        Args: { p_awarded_by: string; p_quest_id: string; p_user_id: string }
        Returns: undefined
      }
      calculate_late_penalty: {
        Args: { p_base_coins: number; p_days_late: number }
        Returns: number
      }
      calculate_project_deadlines: {
        Args: { p_original_deadline: string }
        Returns: {
          employee_deadline: string
          head_deadline: string
        }[]
      }
      check_head_budget_available: {
        Args: { p_coins_needed: number; p_head_id: string }
        Returns: boolean
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_first_time_passcode: { Args: never; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_current_financial_year: { Args: never; Returns: string }
      get_nearby_vendors: {
        Args: { distance_meters?: number; lat: number; lng: number }
        Returns: {
          address: string
          created_at: string | null
          email: string
          id: string
          license_number: string
          location: unknown
          name: string
          phone: string
          status: Database["public"]["Enums"]["vendor_status"] | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "vendors"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_coin_balance: { Args: { p_user_id: string }; Returns: number }
      gettransactionid: { Args: never; Returns: unknown }
      hr_approve_late_submission: {
        Args: {
          p_allocation_id: string
          p_approval_notes?: string
          p_hr_user_id: string
          p_waive_penalty?: boolean
        }
        Returns: undefined
      }
      hr_grant_coins: {
        Args: {
          p_amount: number
          p_finance_approval_id?: string
          p_hr_user_id: string
          p_reason: string
          p_user_id: string
        }
        Returns: undefined
      }
      is_admin_email_available: {
        Args: { check_email: string }
        Returns: boolean
      }
      is_sales_department_head: { Args: { _user_id: string }; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      process_project_submission: {
        Args: { p_allocation_id: string; p_submission_date?: string }
        Returns: undefined
      }
      register_admin: {
        Args: { email: string; name: string; password: string; role?: string }
        Returns: string
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_chess_elo: {
        Args: {
          p_game_id: string
          p_is_draw?: boolean
          p_loser_id: string
          p_winner_id: string
        }
        Returns: undefined
      }
      update_order_status: {
        Args: {
          new_status: Database["public"]["Enums"]["order_status"]
          order_id: string
        }
        Returns: {
          created_at: string | null
          delivery_address: string
          delivery_location: unknown
          delivery_person_id: string | null
          id: string
          notes: string | null
          prescription_url: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at: string | null
          user_id: string
          vendor_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      verify_admin_password: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
    }
    Enums: {
      delivery_status: "available" | "busy" | "offline"
      mood_type: "happy" | "neutral" | "sad" | "stressed" | "excited"
      notification_type:
        | "announcement"
        | "task_assigned"
        | "mood_alert"
        | "achievement"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "overdue"
        | "handover"
        | "pending_approval"
        | "review_pending"
      user_role: "hr" | "department_head" | "staff" | "lead" | "manager"
      vendor_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      delivery_status: ["available", "busy", "offline"],
      mood_type: ["happy", "neutral", "sad", "stressed", "excited"],
      notification_type: [
        "announcement",
        "task_assigned",
        "mood_alert",
        "achievement",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "overdue",
        "handover",
        "pending_approval",
        "review_pending",
      ],
      user_role: ["hr", "department_head", "staff", "lead", "manager"],
      vendor_status: ["pending", "approved", "rejected"],
    },
  },
} as const
