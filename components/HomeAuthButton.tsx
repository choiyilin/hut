"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import styles from "@/app/page.module.css"

export function HomeAuthButton() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

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
    setUserEmail(null)
    router.refresh()
  }

  if (userEmail) {
    return (
      <div className={styles["authGroup"]}>
        <Link href="/profile" className={styles["btnGhost"]} title={userEmail}>
          <i className="fa-regular fa-user" />
          {userEmail}
        </Link>
        <button onClick={handleSignOut} className={styles["btnAuth"]}>
          Sign out
        </button>
      </div>
    )
  }

  return (
    <Link href="/login" className={styles["btnAuth"]}>
      <i className="fa-regular fa-user" />
      Login&thinsp;/&thinsp;Sign up
    </Link>
  )
}
