import type { Db } from '@/domain/types'
import { useStore, type Celebration } from './store'

interface Shared {
  db: Db
  clockOffset: number
  celebration?: Celebration
  hideNearby: boolean
}

interface Message {
  from: string
  state?: Shared
}

let active = false

export const syncActive = () => active

const pick = (): Shared => {
  const s = useStore.getState()
  return { db: s.db, clockOffset: s.clockOffset, celebration: s.celebration, hideNearby: s.hideNearby }
}

export function startSync() {
  const hot = import.meta.hot
  if (!hot || active) return false
  active = true
  const id = Math.random().toString(36).slice(2)
  let applying = false
  let timer = 0
  const send = () => hot.send('maad:state', { from: id, state: pick() } satisfies Message)
  hot.on('maad:state', (msg: Message) => {
    if (msg.from === id || !msg.state) return
    applying = true
    useStore.setState(msg.state)
    applying = false
  })
  hot.on('maad:hello', (msg: Message) => {
    if (msg.from !== id) send()
  })
  useStore.subscribe((s, prev) => {
    if (applying) return
    if (s.db === prev.db && s.clockOffset === prev.clockOffset && s.celebration === prev.celebration && s.hideNearby === prev.hideNearby) return
    clearTimeout(timer)
    timer = window.setTimeout(send, 60)
  })
  hot.send('maad:hello', { from: id } satisfies Message)
  return true
}
