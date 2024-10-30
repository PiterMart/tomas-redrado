import Image from "next/image";
import styles from "./styles/page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <Image
            src="/TomasRedradoLogo.svg"
            alt="TomasRedrado"
            width={0}
            height= {0}
            loading="lazy"
            className={styles.hero_image}
          />
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
