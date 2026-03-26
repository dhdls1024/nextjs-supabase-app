// 공유 그룹 폼 Zod 검증 스키마
import { z } from "zod"

// groupSchema: 그룹 생성 폼 유효성 검증
export const groupSchema = z.object({
  // name: 필수, 최소 1자
  name: z.string().min(1, "그룹 이름을 입력해주세요"),
})

// 폼 데이터 타입 — z.infer로 스키마에서 자동 추론
export type GroupFormData = z.infer<typeof groupSchema>
