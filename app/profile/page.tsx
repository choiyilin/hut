"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useSaved } from "@/contexts/SavedContext"
import { AppNav } from "@/components/AppNav"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
      </div>
    )
  }

  if (!user) return null

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
                <p className="text-lg font-bold text-gray-900 truncate">{user.email}</p>
                <p className="text-sm text-gray-400 mt-0.5">Member since {memberSince}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-extrabold text-gray-900">{savedIds.size}</p>
                <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">Saved</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-extrabold text-gray-900">0</p>
                <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">Listings Posted</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
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
        </div>
      </div>
    </div>
  )
}
