// 영수증/인보이스 목록 및 파일 업로드 섹션
// Supabase Storage 연동 — 업로드/다운로드/삭제 실제 구현
// initialReceipts: 서버에서 미리 조회한 초기 데이터 (SSR)
// isOwner: 그룹장에게만 삭제 버튼 컬럼 노출
"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useTransition } from "react"
import { toast } from "sonner"

import { deleteReceipt, getSignedUrl, uploadReceipt } from "@/app/actions/storage"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Receipt } from "@/lib/types/database"

// ReceiptSection Props 타입
// initialReceipts: 서버 컴포넌트에서 미리 조회한 영수증 목록
// isOwner: 그룹장 여부 — 삭제 버튼 컬럼 표시 제어 (기본값 false)
type ReceiptSectionProps = {
  subscriptionId: string
  initialReceipts: Receipt[]
  isOwner?: boolean
}

// ReceiptSection: 구독별 영수증/인보이스 목록과 파일 업로드 UI
// h2 제목은 상위 페이지에서 한 번만 표시하므로 이 컴포넌트에서는 제거
// isOwner가 true일 때 삭제 버튼 컬럼을 테이블에 추가
export function ReceiptSection({
  subscriptionId,
  initialReceipts,
  isOwner = false,
}: ReceiptSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 여러 ReceiptSection이 렌더될 때 id 충돌 방지를 위해 subscriptionId를 suffix로 사용
  const inputId = `receipt-upload-${subscriptionId}`

  // 파일 선택 이벤트 핸들러 — FormData 구성 후 uploadReceipt Server Action 호출
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      const result = await uploadReceipt(formData, subscriptionId)
      if (result.success) {
        toast.success("영수증이 업로드되었습니다.")
        router.refresh()
      } else {
        toast.error(result.error ?? "업로드에 실패했습니다.")
      }
    })

    // 같은 파일 재선택 가능하도록 input 초기화
    e.target.value = ""
  }

  // 미리보기/다운로드 핸들러 — Signed URL 생성 후 새 탭에서 열기
  function handleOpen(filePath: string) {
    startTransition(async () => {
      const result = await getSignedUrl(filePath)
      if (result.success) {
        window.open(result.data, "_blank")
      } else {
        toast.error(result.error ?? "파일을 열 수 없습니다.")
      }
    })
  }

  // 영수증 삭제 핸들러 — Storage + DB 삭제
  function handleDelete(receiptId: string, filePath: string) {
    startTransition(async () => {
      const result = await deleteReceipt(receiptId, filePath, subscriptionId)
      if (result.success) {
        toast.success("영수증이 삭제되었습니다.")
        router.refresh()
      } else {
        toast.error(result.error ?? "삭제에 실패했습니다.")
      }
    })
  }

  return (
    <section>
      {/* 파일 업로드 영역 — 드래그 앤 드롭 UI (label 클릭으로 input 열기) */}
      <div className="mb-4 rounded-lg border-2 border-dashed p-6 text-center">
        {/* input은 숨기고 label 클릭으로 파일 선택창 열기 */}
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
          className="hidden"
          id={inputId}
          disabled={isPending}
        />
        <label
          htmlFor={inputId}
          className={`cursor-pointer text-sm text-muted-foreground hover:text-foreground ${
            isPending ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {isPending ? "업로드 중..." : "파일을 선택하거나 드래그하세요 (JPG, PNG, PDF)"}
        </label>
      </div>

      {/* 영수증 목록 테이블 */}
      {initialReceipts.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>파일명</TableHead>
              <TableHead>업로드일</TableHead>
              <TableHead>액션</TableHead>
              {/* 삭제 컬럼 항상 고정 — 멤버일 때 빈 셀로 너비 유지 */}
              <TableHead className="w-16 text-right">{isOwner ? "삭제" : ""}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialReceipts.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.file_name}</TableCell>
                <TableCell>
                  {/* uploaded_at을 YYYY-MM-DD 형식으로 표시 */}
                  {new Date(r.uploaded_at).toLocaleDateString("ko-KR")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {/* 미리보기/다운로드: Signed URL 생성 후 새 탭에서 열기 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpen(r.file_url)}
                      disabled={isPending}
                    >
                      열기
                    </Button>
                  </div>
                </TableCell>
                {/* 삭제 셀 항상 렌더링 — 그룹장만 버튼 표시, 멤버는 빈 셀로 컬럼 너비 유지 */}
                <TableCell className="text-right">
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(r.id, r.file_url)}
                      disabled={isPending}
                      aria-label={`${r.file_name} 삭제`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        // 영수증이 없을 때 안내 메시지 표시
        <p className="text-sm text-muted-foreground">등록된 영수증이 없습니다.</p>
      )}
    </section>
  )
}
