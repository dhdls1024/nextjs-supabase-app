"use server"

// Supabase Storage Server Actions
// receipts 버킷: 비공개 (Signed URL로 접근)
// logos 버킷: 공개 (공개 URL로 접근)

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { Receipt, ReceiptInsert } from "@/lib/types/database"

import type { ActionResult } from "./types"

// 허용 파일 타입 및 크기 상수
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]
// Signed URL 유효 시간 (초)
const SIGNED_URL_EXPIRES_IN = 60

// 특정 구독의 영수증 목록 조회
// userId를 인자로 받아 Auth 왕복 호출을 제거 — 호출부에서 1회만 getUser() 수행
export async function getReceipts(subscriptionId: string, userId: string): Promise<Receipt[]> {
  if (!userId) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("uploaded_at", { ascending: false })

  if (error) return []
  return data ?? []
}

// 영수증 파일 업로드 — Storage + DB INSERT
// 경로 규칙: {userId}/{subscriptionId}/{timestamp}_{fileName} (Storage RLS와 일치)
export async function uploadReceipt(
  formData: FormData,
  subscriptionId: string
): Promise<ActionResult<Receipt>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  const file = formData.get("file") as File | null
  if (!file) return { success: false, error: "파일을 선택해주세요." }

  // 파일 타입 검증
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { success: false, error: "JPG, PNG, PDF 파일만 업로드 가능합니다." }
  }

  // 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "파일 크기는 10MB 이하여야 합니다." }
  }

  // 한글/공백/특수문자 포함된 파일명이 Supabase Storage key 유효성 검증 실패를 막기 위해
  // 파일명을 UUID로 대체하고 원본 파일명은 DB file_name 컬럼에만 보관
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const safeFileName = `${crypto.randomUUID()}.${ext}`
  const filePath = `${user.id}/${subscriptionId}/${safeFileName}`

  // Storage 업로드
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(filePath, file, { upsert: false })

  if (uploadError) {
    return { success: false, error: uploadError.message ?? "파일 업로드에 실패했습니다." }
  }

  // DB INSERT — Storage 업로드 성공 후에만 실행
  const receiptInsert: ReceiptInsert = {
    subscription_id: subscriptionId,
    file_url: filePath,
    file_name: file.name,
  }

  const { data, error: dbError } = await supabase
    .from("receipts")
    .insert(receiptInsert)
    .select()
    .single()

  if (dbError || !data) {
    // DB 실패 시 Storage rollback
    await supabase.storage.from("receipts").remove([filePath])
    return { success: false, error: dbError?.message ?? "영수증 저장에 실패했습니다." }
  }

  revalidatePath(`/subscriptions/${subscriptionId}`)
  // 영수증은 subscription_id만 알고 어느 그룹 페이지에서 업로드됐는지 알 수 없으므로
  // "layout" 스코프로 /groups 하위 모든 페이지를 함께 갱신
  revalidatePath("/groups", "layout")
  return { success: true, data: data as Receipt }
}

// 비공개 파일 Signed URL 생성 (60초 유효)
export async function getSignedUrl(filePath: string): Promise<ActionResult<string>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(filePath, SIGNED_URL_EXPIRES_IN)

  if (error || !data?.signedUrl) {
    return { success: false, error: error?.message ?? "URL 생성에 실패했습니다." }
  }

  return { success: true, data: data.signedUrl }
}

// 영수증 삭제 — Storage + DB DELETE
export async function deleteReceipt(
  receiptId: string,
  filePath: string,
  subscriptionId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  // Storage 파일 삭제
  const { error: storageError } = await supabase.storage.from("receipts").remove([filePath])
  if (storageError) {
    return { success: false, error: storageError.message ?? "파일 삭제에 실패했습니다." }
  }

  // DB 레코드 삭제
  const { error: dbError } = await supabase.from("receipts").delete().eq("id", receiptId)

  if (dbError) {
    return { success: false, error: dbError.message ?? "영수증 삭제에 실패했습니다." }
  }

  revalidatePath(`/subscriptions/${subscriptionId}`)
  return { success: true, data: undefined }
}
