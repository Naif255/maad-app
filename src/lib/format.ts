import type { Reward } from '@/domain/types'

const nf = new Intl.NumberFormat('en-US')
const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const num = (n: number) => nf.format(Math.round(n))
export const num1 = (n: number) => nf1.format(n)
export const sar = (n: number) => (n >= 100 ? nf.format(Math.round(n)) : nf2.format(n))
export const kg = (n: number) => (n >= 100 ? nf.format(Math.round(n)) : nf1.format(n))

const dateFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long' })
const dateYearFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn', { hour: 'numeric', minute: '2-digit' })
const weekdayFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long' })

export const date = (t: number) => dateFmt.format(t)
export const dateYear = (t: number) => dateYearFmt.format(t)
export const time = (t: number) => timeFmt.format(t)
export const weekday = (t: number) => weekdayFmt.format(t)

export function ago(t: number, now: number) {
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 45) return 'الحين'
  const m = Math.round(s / 60)
  if (m < 2) return 'قبل دقيقة'
  if (m === 2) return 'قبل دقيقتين'
  if (m < 11) return `قبل ${m} دقائق`
  if (m < 60) return `قبل ${m} دقيقة`
  const h = Math.round(m / 60)
  if (h < 2) return 'قبل ساعة'
  if (h === 2) return 'قبل ساعتين'
  if (h < 11) return `قبل ${h} ساعات`
  if (h < 24) return `قبل ${h} ساعة`
  const d = Math.round(h / 24)
  if (d < 2) return 'أمس'
  if (d === 2) return 'قبل يومين'
  if (d < 11) return `قبل ${d} أيام`
  return date(t)
}

export function daysLeft(t: number, now: number) {
  const d = Math.ceil((t - now) / 86400000)
  if (d <= 0) return 'ينتهي اليوم'
  if (d === 1) return 'باقي يوم'
  if (d === 2) return 'باقي يومين'
  if (d <= 10) return `باقي ${d} أيام`
  return `باقي ${d} يوم`
}

export function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function hangers(n: number) {
  if (n === 1) return 'علاقة وحدة'
  if (n === 2) return 'علاقتين'
  if (n >= 3 && n <= 10) return `${num(n)} علاقات`
  return `${num(n)} علاقة`
}

export function hangersWord(n: number) {
  return n >= 3 && n <= 10 ? 'علاقات' : 'علاقة'
}

export function points(n: number) {
  if (n === 1) return 'نقطة وحدة'
  if (n === 2) return 'نقطتين'
  if (n >= 3 && n <= 10) return `${num(n)} نقاط`
  return `${num(n)} نقطة`
}

export function rewardTitle(r: Reward) {
  if (r.kind === 'ironing') return r.value === 2 ? 'كوي قطعتين مجانًا' : `كوي ${r.value} ${r.value <= 10 ? 'قطع' : 'قطعة'} مجانًا`
  if (r.kind === 'discount') return `خصم ${r.value}٪ على طلبك`
  if (r.value === 1) return 'غسيل ثوب مجانًا'
  if (r.value === 2) return 'غسيل ثوبين مجانًا'
  return `غسيل ${r.value} ${r.value <= 10 ? 'ثياب' : 'ثوب'} مجانًا`
}

export function rewardRule(r: Reward) {
  return `لكل ${hangers(r.per)} صالحة`
}

export const TIER_LABEL = { bronze: 'برونزي', silver: 'فضي', gold: 'ذهبي' } as const

export const CRITERION_LABEL = {
  straightness: 'استقامة الإطار',
  hook: 'سلامة الخطّاف',
  rust: 'خلوّها من الصدأ',
  coating: 'سلامة الطلاء',
  breaks: 'خلوّها من الكسور',
} as const

export const DEFECT_LABEL = {
  straightness: 'إطار معوج',
  hook: 'خطّاف مكسور',
  rust: 'صدأ',
  coating: 'طلاء مقشّر',
  breaks: 'كسر في السلك',
} as const
