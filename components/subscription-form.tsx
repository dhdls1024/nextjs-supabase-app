// 구독 추가/수정 폼 컴포넌트
// react-hook-form + zod로 유효성 검증, shadcn/ui로 UI 구성
// 카테고리 칩 선택 → 서비스 드롭다운 → 자동 logo_url 채우기 흐름
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

import { createSubscription } from "@/app/actions/subscription"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ServicePreset } from "@/lib/types/database"
import { BILLING_CYCLES, CATEGORIES, SUBSCRIPTION_STATUSES } from "@/lib/types/index"
import { subscriptionSchema } from "@/lib/validations/subscription"

// z.input: 폼 입력 타입 (status optional — zod default 때문)
// z.output: 폼 제출 타입 (status required — zod default 적용 후)
type SubscriptionFormInput = z.input<typeof subscriptionSchema>
type SubscriptionFormOutput = z.output<typeof subscriptionSchema>

// Google Favicon API URL 생성 함수
// sz=64: 64px 크기 아이콘 요청
const FAVICON_BASE = "https://www.google.com/s2/favicons"
function getFaviconUrl(domain: string): string {
  return `${FAVICON_BASE}?domain=${domain}&sz=64`
}

// 필드 에러 메시지 컴포넌트 — 각 필드 아래에 오류 표시
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm text-destructive">{message}</p>
}

// 로고 URL 미리보기 컴포넌트
// 카테고리 칩 컴포넌트
// 선택된 카테고리는 variant="default"(어두운 배경)로 강조 표시
function CategoryChips({
  selected,
  onChange,
}: {
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <Button
          key={cat.value}
          type="button" // form submit 방지
          variant={selected === cat.value ? "default" : "outline"}
          size="sm"
          className="rounded-full px-4"
          onClick={() => onChange(cat.value)}
        >
          {cat.label}
        </Button>
      ))}
    </div>
  )
}

// 서비스 선택 드롭다운 아이템 컴포넌트
function ServiceDropdownItem({
  service,
  onSelect,
}: {
  service: ServicePreset
  onSelect: (service: ServicePreset) => void
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
      onClick={() => onSelect(service)}
    >
      {/* Google Favicon API로 서비스 아이콘 표시 */}
      <Image
        src={getFaviconUrl(service.domain)}
        alt={service.name}
        width={24}
        height={24}
        className="h-6 w-6 rounded object-contain"
      />
      <span>{service.name}</span>
    </button>
  )
}

// 서비스 선택 피커 컴포넌트
// 선택된 카테고리의 서비스 목록을 드롭다운으로 표시
// 외부 클릭 시 닫히도록 useRef + useEffect 사용
function ServicePicker({
  category,
  selectedName,
  onSelect,
  onManualInput,
  presets,
}: {
  category: string
  selectedName: string
  onSelect: (service: ServicePreset) => void
  onManualInput: () => void
  presets: ServicePreset[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 선택된 카테고리에 해당하는 프리셋만 필터링
  const services = category ? presets.filter((p) => p.category === category) : []

  function handleSelect(service: ServicePreset) {
    onSelect(service)
    setIsOpen(false)
  }

  function handleManualInput() {
    onManualInput()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 트리거 버튼 — 선택된 서비스명 또는 안내 문구 표시 */}
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={!category} // 카테고리 미선택 시 비활성화
      >
        <span className={selectedName ? "" : "text-muted-foreground"}>
          {selectedName || (category ? "서비스를 선택하세요" : "카테고리를 먼저 선택하세요")}
        </span>
        <svg
          className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 드롭다운 목록 */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {services.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">서비스 목록이 없습니다.</p>
          )}
          {services.map((service) => (
            <ServiceDropdownItem key={service.domain} service={service} onSelect={handleSelect} />
          ))}

          {/* 직접 입력 옵션 — 항상 목록 마지막에 표시 */}
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleManualInput}
          >
            <Pencil className="h-4 w-4" />
            <span>직접 입력</span>
          </button>
        </div>
      )}
    </div>
  )
}

// SubscriptionForm: 구독 서비스 추가 폼
// react-hook-form으로 상태 관리, zod 스키마로 유효성 검증
// servicePresets: SSR에서 조회한 서비스 프리셋 데이터를 prop으로 전달받음
export function SubscriptionForm({ servicePresets }: { servicePresets: ServicePreset[] }) {
  const router = useRouter()
  // useTransition: Server Action 호출 중 pending 상태 관리
  const [isPending, startTransition] = useTransition()

  // 직접 입력 모드 — "직접 입력" 선택 시 일반 Input으로 전환
  const [isManualInput, setIsManualInput] = useState(false)

  // zodResolver로 subscriptionSchema 연결, 기본값 설정
  // 제네릭: input 타입(폼 입력)과 output 타입(검증 후 데이터) 분리
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubscriptionFormInput, unknown, SubscriptionFormOutput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      status: "ACTIVE",
    },
  })

  // 카테고리와 서비스명 실시간 감지 — 드롭다운 필터링 및 표시에 사용
  const selectedCategory = watch("category") ?? ""
  const selectedName = watch("name") ?? ""

  // 카테고리 변경 시 서비스 선택 초기화
  // 직접 입력 모드도 해제하여 드롭다운으로 돌아감
  function handleCategoryChange(value: string, fieldOnChange: (v: string) => void) {
    fieldOnChange(value)
    setValue("name", "")
    setValue("logo_url", "")
    setIsManualInput(false)
  }

  // 서비스 프리셋 선택 시 name과 logo_url 자동 입력
  function handleServiceSelect(service: ServicePreset) {
    setValue("name", service.name, { shouldValidate: true })
    setValue("logo_url", getFaviconUrl(service.domain), { shouldValidate: true })
  }

  // 직접 입력 모드 전환 — name/logo_url 초기화 후 Input 표시
  function handleManualInput() {
    setValue("name", "")
    setValue("logo_url", "")
    setIsManualInput(true)
  }

  // 폼 제출 핸들러 — createSubscription Server Action 호출
  function onSubmit(data: SubscriptionFormOutput) {
    startTransition(async () => {
      const result = await createSubscription(data)
      if (result.success) {
        toast.success("구독이 추가되었습니다.")
        router.push("/dashboard")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* 카테고리 칩 — 2열 전체 차지, pill 버튼으로 선택 */}
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label>카테고리</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <CategoryChips
              selected={field.value ?? ""}
              onChange={(value) => handleCategoryChange(value, field.onChange)}
            />
          )}
        />
        <FieldError message={errors.category?.message} />
      </div>

      {/* 서비스명 — 카테고리 선택 후 드롭다운 또는 직접 입력 */}
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="name">서비스명</Label>
        {isManualInput ? (
          // 직접 입력 모드: 일반 Input 표시
          // register로 연결하여 react-hook-form이 값을 추적
          <div className="flex gap-2">
            <Input
              id="name"
              placeholder="서비스명을 직접 입력하세요"
              {...register("name")}
              autoFocus
            />
            {/* 드롭다운으로 돌아가기 버튼 */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsManualInput(false)
                setValue("name", "")
              }}
            >
              목록 선택
            </Button>
          </div>
        ) : (
          // 드롭다운 모드: ServicePicker 표시
          // register로 hidden input 연결하여 react-hook-form 값 동기화
          <>
            <input type="hidden" {...register("name")} />
            <ServicePicker
              category={selectedCategory}
              selectedName={selectedName}
              onSelect={handleServiceSelect}
              onManualInput={handleManualInput}
              presets={servicePresets}
            />
          </>
        )}
        <FieldError message={errors.name?.message} />
      </div>

      {/* 금액 — valueAsNumber로 숫자 타입 변환 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">금액(원)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="예) 13900"
          className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          {...register("amount", { valueAsNumber: true })}
        />
        <FieldError message={errors.amount?.message} />
      </div>

      {/* 결제 주기 — Controller로 Select 연결 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="billing_cycle">결제 주기</Label>
        <Controller
          control={control}
          name="billing_cycle"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="w-full" id="billing_cycle">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {BILLING_CYCLES.map((cycle) => (
                  <SelectItem key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.billing_cycle?.message} />
      </div>

      {/* 다음 결제일 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="next_billing_date">다음 결제일</Label>
        <Input id="next_billing_date" type="date" {...register("next_billing_date")} />
        <FieldError message={errors.next_billing_date?.message} />
      </div>

      {/* 상태 — defaultValue='ACTIVE', Controller로 Select 연결 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">상태</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="w-full" id="status">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.status?.message} />
      </div>

      {/* 메모 — textarea 컴포넌트 없으므로 일반 textarea에 Input 스타일 적용, 2열 전체 차지 */}
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="notes">메모</Label>
        <textarea
          id="notes"
          rows={3}
          placeholder="메모를 입력하세요 (선택)"
          className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          {...register("notes")}
        />
        <FieldError message={errors.notes?.message} />
      </div>

      {/* 버튼 영역 — 저장/취소 버튼, 2열 전체 차지 */}
      <div className="flex gap-2 md:col-span-2">
        {/* isPending: Server Action 진행 중 버튼 비활성화 */}
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중..." : "구독 추가"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          취소
        </Button>
      </div>
    </form>
  )
}
