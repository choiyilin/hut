"use client"

import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Role = "renter" | "realtor"

export function SignupForm() {
  const [role, setRole] = useState<Role>("renter")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f0e9dc] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-4 text-4xl">✉️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm">
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
          </p>
          {role === "realtor" && (
            <p className="mt-3 text-sm font-semibold text-[#c9a96e]">You signed up as a Realtor.</p>
          )}
          <Link href="/login" className="mt-6 inline-block text-sm text-[#c9a96e] font-semibold hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    )
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
            <p className="mt-2 text-gray-500 text-sm">Create your account</p>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c9a96e] text-sm"
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#c9a96e] font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        <div className="mt-4 text-center">
          {role === "realtor" ? (
            <button
              type="button"
              onClick={() => setRole("renter")}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to regular sign up
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
