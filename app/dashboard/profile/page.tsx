import { requireSession } from "@/lib/session"
import { getMyProfile } from "@/app/actions/profile"
import { ProfilePageClient } from "./client"

export default async function ProfilePage() {
  await requireSession()
  const me = await getMyProfile()

  return <ProfilePageClient me={me} />
}