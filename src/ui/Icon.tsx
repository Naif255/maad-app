import type { SVGProps } from 'react'

const P = {
  home: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z',
  scan: 'M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M7 12h10',
  wallet: 'M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5ZM16 13.5h.01',
  history: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4M12 8v4l3 2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0',
  box: 'M4 8 12 4l8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8',
  truck: 'M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  map: 'M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4ZM9 4v13M15 6.5v13',
  cert: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 15.5h5M15 21v-3l1.5 1 1.5-1v3',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  chevron: 'm14 6-6 6 6 6',
  back: 'm9 6 6 6-6 6',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18v2h2M18 18h2v2',
  close: 'M6 6l12 12M18 6 6 18',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  tree: 'M12 21v-6M7 15h10l-3.2-4H16l-4-6-4 6h2.2z',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5l1.4 1.1-2 3.4-1.7-.6a7 7 0 0 1-1.7 1l-.3 1.7h-4l-.3-1.7a7 7 0 0 1-1.7-1l-1.7.6-2-3.4 1.4-1.1a7 7 0 0 1 0-3l-1.4-1.1 2-3.4 1.7.6a7 7 0 0 1 1.7-1L10 2.9h4l.3 1.7a7 7 0 0 1 1.7 1l1.7-.6 2 3.4-1.4 1.1a7 7 0 0 1 0 3Z',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  film: 'M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4',
  bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6z',
  store: 'M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5 12v8h14v-8M10 20v-5h4v5',
  factory: 'M3 20V10l6 3.5V10l6 3.5V5h4v15zM3 20h18',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  gift: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7S10.5 3 8 3.5 7.5 7 12 7ZM12 7s1.5-4 4-3.5S16.5 7 12 7Z',
  hand: 'M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v6M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.6 15a1.5 1.5 0 0 1 2.4-1.8L7 14.5',
  bag: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2',
  layers: 'M12 4 3 9l9 5 9-5zM3 14l9 5 9-5',
  replay: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4',
  forward: 'M5 6l7 6-7 6zM13 6l7 6-7 6z',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  phone: 'M7 3h10v18H7zM11 18h2',
  alert: 'M12 4 2.5 20h19zM12 10v4.5M12 17.5h.01',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 15V9.5A3.5 3.5 0 0 1 9.5 6H16M18 9v5.5a3.5 3.5 0 0 1-3.5 3.5H8',
  ticket: 'M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6H3zM14 6v12',
  scale: 'M12 4v16M5 20h14M6 8h12M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z',
} as const

export type IconName = keyof typeof P

export function Icon({ name, size = 22, strokeWidth = 1.8, ...rest }: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      <path d={P[name]} />
    </svg>
  )
}
