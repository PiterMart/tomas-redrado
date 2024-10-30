import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
      <p className={styles.title}>EXHIBICIONES</p>
        <div className={styles.exhibition_page}>
          <div className={styles.sedes}>
            <div style={{width: '25vw', height: '100%', margin: 'auto', textAlign: 'center', alignContent: 'center', border: '1px solid black', background: 'lightgray'}}><p>SEDE BA</p></div>
            <div style={{width: '25vw', height: '100%', margin: 'auto', textAlign: 'center', alignContent: 'center', border: '1px solid black', background: 'lightgray'}}><p>SEDE PUNTA</p></div>
            <div style={{width: '25vw', height: '100%', margin: 'auto', textAlign: 'center', alignContent: 'center', border: '1px solid black', background: 'lightgray'}}><p>SEDE MIAMI</p></div>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
