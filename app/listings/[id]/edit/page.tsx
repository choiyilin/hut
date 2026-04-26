import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AddListingForm } from "@/components/AddListingForm"
import type { RealtorListingRow } from "@/types"

type Props = {
  params: Promise<{ id: string }>
}

export const metadata = { title: "Edit Listing — HUT" }

export default async function EditListingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.["role"] !== "realtor") redirect("/login")

  const { data } = await supabase
    .from("realtor_listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!data) redirect("/profile")

  return <AddListingForm user={user} initialData={data as RealtorListingRow} />
}
