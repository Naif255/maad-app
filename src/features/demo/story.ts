export const STORY = [
  { id: 'home', title: 'طلبات الحي', path: '/c', hint: 'المستهلكة تشوف طلبات المغاسل القريبة', match: (p: string) => p === '/c' || p.startsWith('/c/request') },
  { id: 'scan', title: 'الفحص', path: '/c/scan?for=r-nada', hint: 'فحص حي بالكاميرا', match: (p: string) => p.startsWith('/c/scan') },
  { id: 'book', title: 'الحجز', path: '/c/summary', hint: 'الفرز والحجز والإيصال', match: (p: string) => p.startsWith('/c/summary') || p.startsWith('/c/book') || p.startsWith('/c/receipt') },
  { id: 'laundry', title: 'المغسلة تستلم', path: '/l', hint: 'مسح الرمز والاستلام', match: (p: string) => p.startsWith('/l') },
  { id: 'reward', title: 'المكافأة', path: '/c/wallet', hint: 'الكوبون والنقاط وبطاقة الأثر', match: (p: string) => p.startsWith('/c/wallet') || p.startsWith('/c/reward') || p.startsWith('/c/history') },
  { id: 'factory', title: 'المصنع', path: '/f', hint: 'جولة الاستلام والشهادة', match: (p: string) => p.startsWith('/f') },
  { id: 'impact', title: 'الأثر', path: '/impact', hint: 'لوحة الأثر العامة', match: (p: string) => p.startsWith('/impact') },
]

export function storyIndex(path: string) {
  return STORY.findIndex((s) => s.match(path))
}
