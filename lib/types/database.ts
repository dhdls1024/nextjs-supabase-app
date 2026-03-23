// Supabase 데이터베이스 스키마 타입 정의
// createClient<Database>() 제네릭에 사용

// profiles 테이블 SELECT Row 타입
export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  website: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

// profiles 테이블 INSERT 타입 (트리거로 삽입되므로 id만 필수, 나머지 선택)
export type ProfileInsert = {
  id: string
  username?: string | null
  full_name?: string | null
  website?: string | null
  bio?: string | null
  created_at?: string
  updated_at?: string
}

// profiles 테이블 UPDATE 타입 (모두 선택)
export type ProfileUpdate = {
  username?: string | null
  full_name?: string | null
  website?: string | null
  bio?: string | null
  updated_at?: string
}

// 전체 스키마 타입 — createClient<Database>() 제네릭용
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
    }
  }
}
