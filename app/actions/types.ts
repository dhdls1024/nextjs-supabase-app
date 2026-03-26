// Server Action 공통 반환 타입
// 모든 mutating Server Actions는 이 타입을 반환한다
export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }
