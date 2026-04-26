import { redirect } from "next/navigation"

import { AddListingForm } from "@/components/AddListingForm"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Post a Listing — HUT",
  description: "List your NYC rental or sale property on HUT.",
}

export default async function NewListingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.["role"] !== "realtor") redirect("/login")

  return <AddListingForm user={user} />
}
