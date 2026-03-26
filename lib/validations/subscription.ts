// 구독 폼 Zod 검증 스키마
import { z } from "zod"

// subscriptionSchema: 구독 추가/수정 폼 유효성 검증
export const subscriptionSchema = z.object({
  // name: 필수, 최소 1자
  name: z.string().min(1, "구독 서비스명을 입력해주세요"),
  // category: 허용된 값만 입력 가능
  category: z.enum(["OTT", "AI", "SHOPPING", "MUSIC", "OTHER"], {
    message: "카테고리를 선택해주세요",
  }),
  // amount: 양수만 허용
  amount: z.number().positive("금액은 0보다 커야 합니다"),
  // billing_cycle: 허용된 값만 입력 가능
  billing_cycle: z.enum(["MONTHLY", "YEARLY"], {
    message: "결제 주기를 선택해주세요",
  }),
  // next_billing_date: 유효한 날짜 문자열 (YYYY-MM-DD)
  next_billing_date: z
    .string()
    .min(1, "다음 결제일을 입력해주세요")
    .refine((val) => !isNaN(Date.parse(val)), "유효한 날짜를 입력해주세요"),
  // status: 기본값 ACTIVE
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).default("ACTIVE"),
  // logo_url: 선택 입력
  logo_url: z.string().url("유효한 URL을 입력해주세요").optional().or(z.literal("")),
  // notes: 선택 입력
  notes: z.string().optional(),
})

// 폼 데이터 타입 — z.infer로 스키마에서 자동 추론
export type SubscriptionFormData = z.infer<typeof subscriptionSchema>
