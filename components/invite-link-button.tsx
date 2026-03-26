"use client"
// 멤버 초대 모달 컴포넌트
// 초대코드 텍스트 표시 + 초대코드 클립보드 복사 기능 제공

import { Check, Copy } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type InviteLinkButtonProps = {
  inviteCode: string
}

// 복사 피드백 표시 지속 시간 (밀리초)
const COPY_FEEDBACK_DURATION = 2000

export function InviteLinkButton({ inviteCode }: InviteLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  // 초대 코드를 클립보드에 복사
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">멤버 초대</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>멤버 초대</DialogTitle>
          <DialogDescription>초대 코드를 공유하여 멤버를 초대하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 초대 코드 표시 */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">초대 코드</p>
            <div className="flex items-center justify-center rounded-lg border bg-muted py-3">
              <span className="text-xl font-bold tracking-widest">{inviteCode}</span>
            </div>
          </div>

          {/* 초대 코드 복사 버튼 */}
          <Button
            variant={copied ? "secondary" : "outline"}
            className="w-full gap-2"
            onClick={handleCopyCode}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                복사됨!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                코드 복사
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
