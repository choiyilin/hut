"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useSaved } from "@/features/saved"
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
    await supabase.from("realtor_listings").update({ status: nextStatus }).eq("id", listing.id)
    setRealtorListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, status: nextStatus } : l)),
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

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "??"

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
        <h1 className="mb-10 text-5xl leading-none font-extrabold tracking-tight text-gray-900">
          Profile
        </h1>

        <div className="max-w-lg">
          {/* Avatar + identity */}
          <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-5">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gray-900">
                <span className="text-xl font-extrabold tracking-wider text-white">{initials}</span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-lg font-bold text-gray-900">{user.email}</p>
                  {isRealtor && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#c9a96e]/10 px-2 py-0.5 text-xs font-bold tracking-wider text-[#c9a96e] uppercase">
                      <i className="fa-solid fa-star text-[9px]" />
                      Realtor
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-400">Member since {memberSince}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
              {isRealtor ? (
                <>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-2xl font-extrabold text-gray-900">
                      {realtorListings.filter((l) => l.status !== "draft").length}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      Active
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-2xl font-extrabold text-gray-900">
                      {realtorListings.filter((l) => l.status === "draft").length}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      Drafts
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-2xl font-extrabold text-gray-900">{savedIds.size}</p>
                    <p className="mt-0.5 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      Saved
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-2xl font-extrabold text-gray-900">0</p>
                    <p className="mt-0.5 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      Listings Posted
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Realtor CTA */}
          {isRealtor && (
            <Link
              href="/listings/new"
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#c9a96e] py-3 text-sm font-bold text-white transition-colors hover:bg-[#b8935a]"
            >
              <i className="fa-solid fa-plus" />
              Add a Listing
            </Link>
          )}

          {/* Actions */}
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
            {!isRealtor && (
              <Link
                href="/saved"
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <i className="fa-regular fa-heart w-4 text-center text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">Saved Listings</span>
                </div>
                <i className="fa-solid fa-chevron-right text-xs text-gray-300" />
              </Link>
            )}
          </div>

          {/* Manage Listings (realtor only) */}
          {isRealtor &&
            (() => {
              const published = realtorListings.filter((l) => l.status !== "draft")
              const forRent = published.filter((l) => l.listing_type === "rent")
              const forSale = published.filter((l) => l.listing_type === "sale")
              const drafts = realtorListings.filter((l) => l.status === "draft")

              const renderPublishedRow = (listing: RealtorListingRow) => (
                <li key={listing.id} className="flex items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{listing.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-gray-400">
                        ${listing.price.toLocaleString()}
                        {listing.listing_type === "rent" ? "/mo" : ""} · {listing.neighborhood}
                      </p>
                      {listing.status === "off-market" && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
                          Delisted
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#c9a96e]/10 hover:text-[#c9a96e]"
                      aria-label="Edit listing"
                    >
                      <i className="fa-solid fa-pen text-xs" />
                    </Link>
                    <button
                      onClick={() => handleDelistToggle(listing)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        listing.status === "off-market"
                          ? "text-green-500 hover:bg-green-50"
                          : "text-gray-400 hover:bg-orange-50 hover:text-orange-500"
                      }`}
                      aria-label={
                        listing.status === "off-market" ? "Relist listing" : "Delist listing"
                      }
                      title={listing.status === "off-market" ? "Relist" : "Delist"}
                    >
                      <i
                        className={`fa-solid ${listing.status === "off-market" ? "fa-eye" : "fa-eye-slash"} text-xs`}
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
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
                  <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-6 py-4">
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
                            <div className="bg-gray-50 px-6 py-2">
                              <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                                For Rent
                              </span>
                            </div>
                            <ul className="divide-y divide-gray-100">
                              {forRent.map(renderPublishedRow)}
                            </ul>
                          </div>
                        )}
                        {forSale.length > 0 && (
                          <div>
                            <div className="bg-gray-50 px-6 py-2">
                              <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                                For Sale
                              </span>
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
                    <div className="mt-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                      <div className="border-b border-gray-100 px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">Drafts</span>
                      </div>
                      {realtorLoading ? (
                        <p className="px-6 py-5 text-sm text-gray-400">Loading…</p>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {drafts.map((listing) => (
                            <li
                              key={listing.id}
                              className="flex items-center justify-between gap-3 px-6 py-4"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {listing.title || "Untitled Draft"}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                  {listing.neighborhood}
                                </p>
                              </div>
                              <div className="flex flex-shrink-0 items-center gap-1">
                                <Link
                                  href={`/listings/${listing.id}/edit`}
                                  className="rounded-full border border-[#c9a96e]/30 px-3 py-1.5 text-xs font-bold text-[#c9a96e] transition-colors hover:bg-[#c9a96e]/10"
                                >
                                  Continue
                                </Link>
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
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
