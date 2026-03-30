"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Role = "renter" | "realtor"

export function LoginForm() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("renter")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const userRole = data.user?.user_metadata?.role
    router.push(userRole === "realtor" ? "/profile" : "/listings")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f0e9dc] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-extrabold tracking-[0.18em] uppercase text-gray-900">
            HUT
          </Link>
          {role === "realtor" ? (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] text-xs font-bold uppercase tracking-wider">
                <i className="fa-solid fa-star text-[10px]" />
                Realtor Portal
              </span>
            </div>
          ) : (
            <p className="mt-2 text-gray-500 text-sm">Sign in to your account</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c9a96e] text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c9a96e] text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-[#c9a96e] text-white text-sm font-bold hover:bg-[#b8935a] transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#c9a96e] font-semibold hover:underline">
            Create one
          </Link>
        </p>

        <div className="mt-4 text-center">
          {role === "realtor" ? (
            <button
              type="button"
              onClick={() => setRole("renter")}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to regular sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRole("realtor")}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              I&apos;m a realtor
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
