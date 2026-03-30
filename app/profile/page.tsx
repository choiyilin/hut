"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useSaved } from "@/contexts/SavedContext"
import { AppNav } from "@/components/AppNav"
import type { RealtorListingRow } from "@/types"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [realtorListings, setRealtorListings] = useState<RealtorListingRow[]>([])
  const [realtorLoading, setRealtorLoading] = useState(false)
  const { savedIds } = useSaved()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
        return
      }
      setUser(user)
      setLoading(false)
    })
  }, [router])

  useEffect(() => {
    if (!user || user.user_metadata?.role !== "realtor") return
    setRealtorLoading(true)
    const supabase = createClient()
    supabase
      .from("realtor_listings")
      .select("*")
      .eq("user_id", user.id)
      .order("date_posted", { ascending: false })
      .then(({ data }) => {
        setRealtorListings((data ?? []) as RealtorListingRow[])
        setRealtorLoading(false)
      })
  }, [user])

  const handleDeleteListing = async (id: string) => {
    const supabase = createClient()
    await supabase.from("realtor_listings").delete().eq("id", id)
    setRealtorListings((prev) => prev.filter((l) => l.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
      </div>
    )
  }

  if (!user) return null

  const isRealtor = user.user_metadata?.role === "realtor"

  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??"

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight leading-none mb-10">
          Profile
        </h1>

        <div className="max-w-lg">
          {/* Avatar + identity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-4">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl font-extrabold tracking-wider">
                  {initials}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-bold text-gray-900 truncate">{user.email}</p>
                  {isRealtor && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] text-xs font-bold uppercase tracking-wider">
                      <i className="fa-solid fa-star text-[9px]" />
                      Realtor
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5">Member since {memberSince}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 grid grid-cols-2 gap-4">
              {isRealtor ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-extrabold text-gray-900">{realtorListings.length}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">Listings</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-extrabold text-gray-900">{realtorListings.length}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">Listings Posted</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-extrabold text-gray-900">{savedIds.size}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">Saved</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-extrabold text-gray-900">0</p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">Listings Posted</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Realtor CTA */}
          {isRealtor && (
            <Link
              href="/listings/new"
              className="flex items-center justify-center gap-2 w-full py-3 mb-4 rounded-full bg-[#c9a96e] text-white text-sm font-bold hover:bg-[#b8935a] transition-colors"
            >
              <i className="fa-solid fa-plus" />
              Add a Listing
            </Link>
          )}

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {!isRealtor && (
              <Link
                href="/saved"
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <i className="fa-regular fa-heart text-gray-400 w-4 text-center" />
                  <span className="text-sm font-semibold text-gray-700">Saved Listings</span>
                </div>
                <i className="fa-solid fa-chevron-right text-gray-300 text-xs" />
              </Link>
            )}
            <Link
              href="/listings"
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <i className="fa-regular fa-building text-gray-400 w-4 text-center" />
                <span className="text-sm font-semibold text-gray-700">Browse Apartments</span>
              </div>
              <i className="fa-solid fa-chevron-right text-gray-300 text-xs" />
            </Link>
          </div>

          {/* Manage Listings (realtor only) */}
          {isRealtor && (
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-900">Manage Listings</span>
                <Link
                  href="/listings/new"
                  className="text-xs font-bold text-[#c9a96e] hover:underline flex items-center gap-1"
                >
                  <i className="fa-solid fa-plus text-[10px]" />
                  Add new
                </Link>
              </div>

              {realtorLoading ? (
                <p className="px-6 py-5 text-sm text-gray-400">Loading…</p>
              ) : realtorListings.length === 0 ? (
                <p className="px-6 py-5 text-sm text-gray-400">No listings yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {realtorListings.map((listing) => (
                    <li key={listing.id} className="flex items-center justify-between px-6 py-4 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ${listing.price.toLocaleString()}/mo · {listing.neighborhood}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Delete listing"
                      >
                        <i className="fa-solid fa-trash text-sm" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
