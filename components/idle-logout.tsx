"use client"

import { useEffect, useRef } from "react"
import { signOut, useSession } from "next-auth/react"

const IDLE_LIMIT_MS = 10 * 60 * 1000 // 10 minutes
const ACTIVITY_EVENTS = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"] as const

export function IdleLogout() {
  const { status } = useSession()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status !== "authenticated") return

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/login?reason=inactivity" })
      }, IDLE_LIMIT_MS)
    }

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, reset))
    reset()

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, reset))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [status])

  return null
}