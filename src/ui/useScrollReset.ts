import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function useScrollReset() {
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    ref.current?.scrollTo(0, 0)
  }, [pathname])
  return ref
}
