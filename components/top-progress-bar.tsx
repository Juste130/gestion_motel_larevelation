"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function TopProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Navigation finished
    setLoading(false)
  }, [pathname, searchParams])

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.href.includes("#") &&
        target.getAttribute("target") !== "_blank"
      ) {
        const targetUrl = new URL(target.href)
        const currentUrl = new URL(window.location.href)
        if (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search) {
          setLoading(true)
        }
      }
    }

    const anchors = document.querySelectorAll("a[href]")
    anchors.forEach((a) => a.addEventListener("click", handleAnchorClick as EventListener))

    return () => {
      anchors.forEach((a) => a.removeEventListener("click", handleAnchorClick as EventListener))
    }
  }, [pathname, searchParams])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-amber-100 overflow-hidden">
      <div className="h-full bg-amber-500 animate-pulse w-full origin-left transition-all duration-300" />
    </div>
  )
}
