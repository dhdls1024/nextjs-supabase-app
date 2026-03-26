"use client"
// 멤버 초대 모달 컴포넌트
// 초대코드 텍스트 표시 + 초대링크 클립보드 복사 기능 제공

import { Check, Copy } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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

  // 초대 링크를 클립보드에 복사
  const handleCopyLink = async () => {
    const inviteUrl = `${window.location.origin}/groups/join?code=${inviteCode}`
    await navigator.clipboard.writeText(inviteUrl)
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
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 초대 코드 표시 */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">초대 코드</p>
            <div className="flex items-center justify-center rounded-lg border bg-muted py-3">
              <span className="text-xl font-bold tracking-widest">{inviteCode}</span>
            </div>
          </div>

          {/* 초대 링크 복사 */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">초대 링크</p>
            <Button
              variant={copied ? "secondary" : "outline"}
              className="w-full gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  링크 복사
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
