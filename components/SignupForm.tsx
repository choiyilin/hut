"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type Role = "renter" | "realtor"

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<Role>(
    searchParams.get("realtor") === "true" ? "realtor" : "renter",
  )
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // When email confirmation is disabled in Supabase, signUp returns a session immediately.
    if (data.session) {
      router.push(role === "realtor" ? "/profile" : "/listings")
      router.refresh()
      return
    }

    // Fallback: email confirmation is still enabled — direct user to login to confirm.
    router.push("/login?confirmed=false")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0e9dc] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-[0.18em] text-gray-900 uppercase"
          >
            HUT
          </Link>
          {role === "realtor" ? (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c9a96e]/10 px-3 py-1 text-xs font-bold tracking-wider text-[#c9a96e] uppercase">
                <i className="fa-solid fa-star text-[10px]" />
                Realtor Portal
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Create your account</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#c9a96e] focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#c9a96e] focus:outline-none"
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#c9a96e] focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#c9a96e] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b8935a] disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#c9a96e] hover:underline">
            Sign in
          </Link>
        </p>

        <div className="mt-4 text-center">
          {role === "realtor" ? (
            <button
              type="button"
              onClick={() => setRole("renter")}
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              ← Back to regular sign up
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRole("realtor")}
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              I&apos;m a realtor
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
