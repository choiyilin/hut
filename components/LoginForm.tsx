"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { categorizeAuthError } from "@/lib/auth/errors"
import { LoginPayloadSchema, type Role } from "@/schemas/auth"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const needsConfirmation = searchParams.get("confirmed") === "false"
  const [role, setRole] = useState<Role>("renter")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsed = LoginPayloadSchema.safeParse({ email, password, role })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (authError) {
      const categorized = categorizeAuthError(authError)
      setError(categorized.message)
      setLoading(false)
      return
    }

    const userRole = data.user.user_metadata?.["role"]

    // If the user picked "I'm a realtor" in the UI but this account isn't a
    // realtor account, tell them — don't silently redirect to the renter flow.
    if (parsed.data.role === "realtor" && userRole !== "realtor") {
      setError("This account is not registered as a realtor. Please sign up for a realtor account.")
      setLoading(false)
      return
    }

    router.push(userRole === "realtor" ? "/profile" : "/listings")
    router.refresh()
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
            <p className="mt-2 text-sm text-gray-500">Sign in to your account</p>
          )}
        </div>

        {needsConfirmation && (
          <p className="mb-5 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            Check your email for a confirmation link, then sign in.
          </p>
        )}

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {role === "realtor" ? (
            <>
              No realtor account?{" "}
              <Link
                href="/signup?realtor=true"
                className="font-semibold text-[#c9a96e] hover:underline"
              >
                Sign up as a realtor
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-[#c9a96e] hover:underline">
                Create one
              </Link>
            </>
          )}
        </p>

        <div className="mt-4 text-center">
          {role === "realtor" ? (
            <button
              type="button"
              onClick={() => setRole("renter")}
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              ← Back to regular sign in
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
