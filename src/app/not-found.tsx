import type { Metadata } from "next";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <main className={styles.wrapper}>
      <p className={styles.code}>404</p>
      <h1 className={styles.heading}>Page not found</h1>
      <p className={styles.message}>The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.</p>
      <Link href="/" className={`btn btn-primary ${styles.cta}`}>
        Back to Auctions
      </Link>
    </main>
  );
}
