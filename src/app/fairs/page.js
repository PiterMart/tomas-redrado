import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";

export default function Fairs() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div style={{paddingTop: '5rem'}}>
          <p>This is fairs page</p>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}