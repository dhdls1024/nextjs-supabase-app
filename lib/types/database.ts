// Supabase MCP로 자동 생성된 데이터베이스 타입
// createClient<Database>() 제네릭에 사용

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Supabase 자동 생성 Database 타입
export type Database = {
  // Supabase 내부 버전 메타정보
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_subscriptions: {
        Row: {
          group_id: string
          id: string
          member_payment_statuses: Record<string, string>
          member_split_amounts: Record<string, number>
          payment_status: string
          split_amount: number
          subscription_id: string
        }
        Insert: {
          group_id: string
          id?: string
          member_payment_statuses?: Record<string, string>
          member_split_amounts?: Record<string, number>
          payment_status?: string
          split_amount: number
          subscription_id: string
        }
        Update: {
          group_id?: string
          id?: string
          member_payment_statuses?: Record<string, string>
          member_split_amounts?: Record<string, number>
          payment_status?: string
          split_amount?: number
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_subscriptions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_subscriptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          file_name: string
          file_url: string
          id: string
          subscription_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_url: string
          id?: string
          subscription_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: string
          subscription_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          category: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          next_billing_date: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle: string
          category: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          next_billing_date: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          category?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          next_billing_date?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      category_monthly_stats: {
        Row: {
          category: string | null
          month: string | null
          total_amount: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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

// 편의 타입 헬퍼 — Tables<"subscriptions"> 형태로 Row 타입 추출
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

// ============================================================
// 앱 전용 편의 타입 (Row 타입에서 유니온 리터럴 강화)
// ============================================================

// profiles 테이블 Row 타입 — Tables 헬퍼로 추출
export type Profile = Tables<"profiles">

// subscriptions 테이블 Row 타입 (카테고리/상태를 유니온 리터럴로 강화)
export type Subscription = Omit<
  Tables<"subscriptions">,
  "category" | "billing_cycle" | "status"
> & {
  category: "OTT" | "AI" | "SHOPPING" | "MUSIC" | "OTHER"
  billing_cycle: "MONTHLY" | "YEARLY"
  status: "ACTIVE" | "PAUSED" | "CANCELLED"
}

// subscriptions 테이블 INSERT 타입
export type SubscriptionInsert = {
  user_id: string
  name: string
  category: "OTT" | "AI" | "SHOPPING" | "MUSIC" | "OTHER"
  amount: number
  billing_cycle: "MONTHLY" | "YEARLY"
  next_billing_date: string
  status?: "ACTIVE" | "PAUSED" | "CANCELLED"
  logo_url?: string | null
  notes?: string | null
}

// subscriptions 테이블 UPDATE 타입
export type SubscriptionUpdate = {
  name?: string
  category?: "OTT" | "AI" | "SHOPPING" | "MUSIC" | "OTHER"
  amount?: number
  billing_cycle?: "MONTHLY" | "YEARLY"
  next_billing_date?: string
  status?: "ACTIVE" | "PAUSED" | "CANCELLED"
  logo_url?: string | null
  notes?: string | null
}

// receipts 테이블 Row 타입
export type Receipt = Tables<"receipts">

// receipts 테이블 INSERT 타입
export type ReceiptInsert = {
  subscription_id: string
  file_url: string
  file_name: string
  uploaded_at?: string
}

// groups 테이블 Row 타입
export type Group = Tables<"groups">

// groups 테이블 INSERT 타입
export type GroupInsert = {
  name: string
  owner_id: string
  invite_code: string
}

// group_members 테이블 Row 타입 (role을 유니온 리터럴로 강화)
export type GroupMember = Omit<Tables<"group_members">, "role"> & {
  role: "OWNER" | "MEMBER"
}

// group_members 테이블 INSERT 타입
export type GroupMemberInsert = {
  group_id: string
  user_id: string
  role?: "OWNER" | "MEMBER"
}

// group_subscriptions 테이블 Row 타입 (payment_status를 유니온 리터럴로 강화)
// member_split_amounts: 멤버별 정산금 { userId: number }
// member_payment_statuses: 멤버별 납부 상태 { userId: "PENDING" | "PAID" }
export type GroupSubscription = Omit<
  Tables<"group_subscriptions">,
  "payment_status" | "member_payment_statuses"
> & {
  payment_status: "PENDING" | "PAID"
  member_split_amounts: Record<string, number>
  member_payment_statuses: Record<string, "PENDING" | "PAID">
}

// group_subscriptions 테이블 INSERT 타입
export type GroupSubscriptionInsert = {
  group_id: string
  subscription_id: string
  split_amount: number
  payment_status?: "PENDING" | "PAID"
  member_split_amounts?: Record<string, number>
  member_payment_statuses?: Record<string, "PENDING" | "PAID">
}

// group_subscriptions 테이블 UPDATE 타입
export type GroupSubscriptionUpdate = {
  split_amount?: number
  payment_status?: "PENDING" | "PAID"
  member_split_amounts?: Record<string, number>
  member_payment_statuses?: Record<string, "PENDING" | "PAID">
}
