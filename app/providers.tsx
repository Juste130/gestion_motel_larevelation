"use client"

import { Suspense } from "react"
import { SessionProvider } from "next-auth/react"
import { TopProgressBar } from "@/components/top-progress-bar"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      {children}
    </SessionProvider>
  )
}