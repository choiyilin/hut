import Link from "next/link"
import { VideoStage } from "@/components/VideoStage"
import styles from "./page.module.css"

export default function HomePage() {
  return (
    <>
      <VideoStage />

      {/* Dark overlay */}
      <div className={styles["overlay"]} role="presentation" />

      {/* Navigation */}
      <header className={styles["header"]}>
        <Link href="/" className={styles["logo"]}>
          HUT
        </Link>

        <nav aria-label="Main navigation">
          <ul className={styles["navList"]}>
            <li>
              <Link href="/listings?type=rent">
                Rent <i className="fa-solid fa-plus" />
              </Link>
            </li>
            <li>
              <Link href="/listings?type=sale">
                Buy <i className="fa-solid fa-plus" />
              </Link>
            </li>
            <li>
              <a href="#">
                List <i className="fa-solid fa-plus" />
              </a>
            </li>
            <li>
              <a href="#">Agents</a>
            </li>
            <li>
              <a href="#">
                Featured <i className="fa-solid fa-plus" />
              </a>
            </li>
          </ul>
        </nav>

        <Link href="/login" className={styles["btnAuth"]}>
          <i className="fa-regular fa-user" />
          Login&thinsp;/&thinsp;Sign up
        </Link>
      </header>

      {/* Hero */}
      <main className={styles["hero"]}>
        <h1 className={styles["heroH1"]}>Find your perfect Hut</h1>

        <div className={styles["searchWrap"]}>
          <form method="GET" action="/listings" className={styles["searchPill"]}>
            <input type="hidden" name="type" value="rent" />
            <input
              type="text"
              name="q"
              placeholder="Search a neighborhood, address, zip code, borough…"
              aria-label="Search properties"
              autoComplete="off"
              spellCheck={false}
              className={styles["searchInput"]}
            />
            <button type="submit" className={styles["searchBtn"]} aria-label="Search">
              <i className="fa-solid fa-magnifying-glass" />
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
