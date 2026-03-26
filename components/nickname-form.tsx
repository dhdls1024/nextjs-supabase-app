// 닉네임 설정 컴포넌트
// Supabase auth.updateUser()로 user_metadata.nickname을 저장
// 인라인 편집: Pencil 클릭 → Input → Check(저장) / X(취소)
"use client"

import { Check, Pencil, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface NicknameFormProps {
  // 서버에서 user_metadata.nickname을 읽어 초기값으로 전달
  initialNickname: string
}

export function NicknameForm({ initialNickname }: NicknameFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState(initialNickname)
  const [editingValue, setEditingValue] = useState("")
  const [saving, setSaving] = useState(false)

  function handleEditStart() {
    setEditingValue(nickname)
    setIsEditing(true)
  }

  function handleCancel() {
    setIsEditing(false)
    setEditingValue("")
  }

  // Supabase auth.updateUser — user_metadata.nickname 저장
  // profiles.nickname도 동기화하여 그룹 멤버 목록에서 닉네임으로 표시되도록 함
  async function handleSave() {
    const trimmed = editingValue.trim()
    if (!trimmed) return
    setSaving(true)
    const supabase = createClient()

    // auth user_metadata 업데이트
    const { error: authError } = await supabase.auth.updateUser({
      data: { nickname: trimmed },
    })

    if (!authError) {
      // profiles 테이블도 동기화 — 그룹 멤버 목록 표시에 사용
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("profiles").update({ nickname: trimmed }).eq("id", user.id)
      }
      setNickname(trimmed)
      setIsEditing(false)
    }

    setSaving(false)
  }

  return (
    <div className="mt-3 flex items-center justify-between border-t pt-3">
      <span className="text-sm text-muted-foreground">닉네임</span>

      {isEditing ? (
        // 수정 모드: Input + 저장/취소
        <div className="flex items-center gap-1">
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            className="h-7 w-36 text-sm"
            maxLength={20}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") handleCancel()
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-500 hover:text-green-600"
            onClick={handleSave}
            disabled={saving}
            aria-label="저장"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={handleCancel}
            aria-label="취소"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        // 표시 모드: 닉네임 + Pencil
        <div className="flex items-center gap-1">
          <span className="text-sm">{nickname || "미설정"}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleEditStart}
            aria-label="닉네임 수정"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
