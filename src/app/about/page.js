import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";

export default function About() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.page_container}>
          <div className={styles.artists_page}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%'}}>
              <p className={styles.title} style={{marginBottom: '1rem', lineHeight: '3rem', textAlign: 'left'}}>Tomas Redrado Art</p>
              <p>  is committed to advancing the appreciation of contemporary art through a dynamic and historically rooted aesthetic. Our mission is to elevate the global recognition of Latin American, Caribbean, and local (Florida) artists, while establishing Miami as a premier international cultural destination.</p>
              <p>This project challenges conventional perspectives, encouraging exploration of innovative and provocative art forms. We prioritize the artist’s creative autonomy, fostering an environment where breaking norms and engaging deeply with audiences are central to our approach. Based in Miami, TRA seeks to invigorate the local art scene through meaningful dialogue with the international art community.</p>
              <p>Our collaborations with leading institutions and authorities, including the ICA, Fountainhead, the Miami Downtown Development Authority, and Miami-Dade County officials, are integral to our mission. These partnerships enable us to promote and critically engage with contemporary art on a global scale, contributing significantly to Miami’s vibrant cultural landscape.</p>
            </div>
            <video autoPlay loop muted className={styles.video}>
              <source src="/TomasRedradoExhibition.mp4" />
            </video>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
