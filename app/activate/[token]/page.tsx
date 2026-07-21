import { getActivationInfo } from "@/app/actions/auth"
import { ActivatePageClient } from "./client"

export default async function ActivatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const check = await getActivationInfo(token)

  return <ActivatePageClient token={token} check={check} />
}