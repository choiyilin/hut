import { redirect } from "next/navigation"

import { ProfileClient } from "@/components/ProfileClient"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Profile — HUT" }

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return <ProfileClient user={user} />
}
