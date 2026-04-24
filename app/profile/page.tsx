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
    // getSession() reads the locally-cached session set at sign-up/sign-in,
    // so user_metadata (including role) is always present immediately.
    // getUser() makes a network round-trip and can return stale metadata on
    // freshly-created accounts before Supabase finishes writing the row.
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        router.replace("/login")
        return
      }
      setUser(user)
      setLoading(false)
    })
  }, [router])

  useEffect(() => {
    if (!user || user.user_metadata?.["role"] !== "realtor") return
    setRealtorLoading(true)
    const supabase = createClient()
    supabase
      .from("realtor_listings")
      .select("*")
      .eq("user_id", user.id)
      .order("date_posted", { ascending: false })
      .then(async ({ data }) => {
        const listings = (data ?? []) as RealtorListingRow[]
        setRealtorListings(listings)
        setRealtorLoading(false)

        const missing = listings.filter((l) => l.lat === 0 && l.lng === 0)
        if (missing.length === 0) return

        await fetch("/api/geocode/backfill", { method: "POST" })
      })
  }, [user])

  const handleDeleteListing = async (id: string) => {
    const supabase = createClient()
    await supabase.from("realtor_listings").delete().eq("id", id)
    setRealtorListings((prev) => prev.filter((l) => l.id !== id))
  }

  const handleDelistToggle = async (listing: RealtorListingRow) => {
    const nextStatus = listing.status === "off-market" ? "active" : "off-market"
    const supabase = createClient()
    await supabase
      .from("realtor_listings")
      .update({ status: nextStatus })
      .eq("id", listing.id)
    setRealtorListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, status: nextStatus } : l))
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
      </div>
    )
  }

  if (!user) return null

  const isRealtor = user.user_metadata?.["role"] === "realtor"

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
                    <p className="text-2xl font-extrabold text-gray-900">
                      {realtorListings.filter((l) => l.status !== "draft").length}
                    </p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">Active</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-extrabold text-gray-900">
                      {realtorListings.filter((l) => l.status === "draft").length}
                    </p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">Drafts</p>
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
          </div>

          {/* Manage Listings (realtor only) */}
          {isRealtor && (() => {
            const published = realtorListings.filter((l) => l.status !== "draft")
            const forRent = published.filter((l) => l.listing_type === "rent")
            const forSale = published.filter((l) => l.listing_type === "sale")
            const drafts = realtorListings.filter((l) => l.status === "draft")

            const renderPublishedRow = (listing: RealtorListingRow) => (
              <li key={listing.id} className="flex items-center justify-between px-6 py-4 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-xs text-gray-400">
                      ${listing.price.toLocaleString()}{listing.listing_type === "rent" ? "/mo" : ""} · {listing.neighborhood}
                    </p>
                    {listing.status === "off-market" && (
                      <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Delisted
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-colors"
                    aria-label="Edit listing"
                  >
                    <i className="fa-solid fa-pen text-xs" />
                  </Link>
                  <button
                    onClick={() => handleDelistToggle(listing)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                      listing.status === "off-market"
                        ? "text-green-500 hover:bg-green-50"
                        : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                    }`}
                    aria-label={listing.status === "off-market" ? "Relist listing" : "Delist listing"}
                    title={listing.status === "off-market" ? "Relist" : "Delist"}
                  >
                    <i className={`fa-solid ${listing.status === "off-market" ? "fa-eye" : "fa-eye-slash"} text-xs`} />
                  </button>
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Delete listing"
                  >
                    <i className="fa-solid fa-trash text-xs" />
                  </button>
                </div>
              </li>
            )

            return (
              <>
                {/* Manage Listings */}
                <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-900">Manage Listings</span>
                  </div>

                  {realtorLoading ? (
                    <p className="px-6 py-5 text-sm text-gray-400">Loading…</p>
                  ) : published.length === 0 ? (
                    <p className="px-6 py-5 text-sm text-gray-400">No listings yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {forRent.length > 0 && (
                        <div>
                          <div className="px-6 py-2 bg-gray-50">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">For Rent</span>
                          </div>
                          <ul className="divide-y divide-gray-100">
                            {forRent.map(renderPublishedRow)}
                          </ul>
                        </div>
                      )}
                      {forSale.length > 0 && (
                        <div>
                          <div className="px-6 py-2 bg-gray-50">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">For Sale</span>
                          </div>
                          <ul className="divide-y divide-gray-100">
                            {forSale.map(renderPublishedRow)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Drafts */}
                {(realtorLoading || drafts.length > 0) && (
                  <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <span className="text-sm font-bold text-gray-900">Drafts</span>
                    </div>
                    {realtorLoading ? (
                      <p className="px-6 py-5 text-sm text-gray-400">Loading…</p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {drafts.map((listing) => (
                          <li key={listing.id} className="flex items-center justify-between px-6 py-4 gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {listing.title || "Untitled Draft"}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{listing.neighborhood}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Link
                                href={`/listings/${listing.id}/edit`}
                                className="px-3 py-1.5 rounded-full text-xs font-bold text-[#c9a96e] border border-[#c9a96e]/30 hover:bg-[#c9a96e]/10 transition-colors"
                              >
                                Continue
                              </Link>
                              <button
                                onClick={() => handleDeleteListing(listing.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                aria-label="Delete draft"
                              >
                                <i className="fa-solid fa-trash text-xs" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
