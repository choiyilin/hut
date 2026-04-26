"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSaved } from "@/features/saved"

export function AppNav() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { savedIds } = useSaved()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
      <div className="flex h-[76px] items-center justify-between gap-4 px-7 sm:px-[52px]">
        <Link
          href="/"
          className="flex flex-shrink-0 items-center text-[1.6rem] font-extrabold tracking-[0.18em] text-gray-900 uppercase select-none"
        >
          HUT
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          <button
            onClick={() => router.push(`/listings?type=rent&_r=${Date.now()}`)}
            className="rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            Rent
          </button>
          <button
            onClick={() => router.push(`/listings?type=sale&_r=${Date.now()}`)}
            className="rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            Buy
          </button>
        </nav>

        <div className="hidden flex-shrink-0 items-center gap-2 sm:flex">
          {userEmail ? (
            <>
              {/* Saved */}
              <Link
                href="/saved"
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100"
              >
                <i className="fa-regular fa-heart text-xs" />
                Saved
                {savedIds.size > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-extrabold text-white">
                    {savedIds.size}
                  </span>
                )}
              </Link>

              {/* Divider */}
              <span className="h-5 w-px bg-gray-200" />

              {/* Profile link */}
              <Link
                href="/profile"
                className="max-w-[160px] truncate text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                {userEmail}
              </Link>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-700"
            >
              <i className="fa-regular fa-user text-xs" />
              Login&thinsp;/&thinsp;Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
