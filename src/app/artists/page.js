import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Link href="/">
        <button> TO HOME</button>
        </Link>
        <Link href="/artists/zyntax">
        <button> ZYNTAX</button>
        </Link>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
