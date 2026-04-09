"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSaved } from "@/contexts/SavedContext"

export function AppNav() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isRealtor, setIsRealtor] = useState(false)
  const { savedIds } = useSaved()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null)
      setIsRealtor(session?.user?.user_metadata?.role === "realtor")
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
      setIsRealtor(session?.user?.user_metadata?.role === "realtor")
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
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-[1.6rem] font-extrabold tracking-[0.18em] uppercase text-gray-900 flex items-center flex-shrink-0 select-none"
        >
          HUT
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {["Rent", "Buy", "Agents", "Featured"].map((item) => (
            <a
              key={item}
              href="#"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {item}
            </a>
          ))}
          <Link
            href="/listings/new"
            className={
              isRealtor
                ? "px-3 py-2 text-sm font-bold text-[#c9a96e] hover:text-[#b8935a] hover:bg-[#c9a96e]/5 rounded-lg transition-colors"
                : "px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            }
          >
            List
          </Link>
        </nav>

        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {userEmail ? (
            <>
              {/* Saved */}
              <Link
                href="/saved"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <i className="fa-regular fa-heart text-xs" />
                Saved
                {savedIds.size > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-extrabold">
                    {savedIds.size}
                  </span>
                )}
              </Link>

              {/* Divider */}
              <span className="w-px h-5 bg-gray-200" />

              {/* Profile link */}
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium truncate max-w-[160px] transition-colors"
              >
                {userEmail}
              </Link>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors"
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
