import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";
import ArtistForm from "../firebase/ArtistUploader";
import ArtistList from "../firebase/artistList";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p className={styles.title}>ARTIST UPLOADER</p>
        <ArtistForm/>
        <p className={styles.title}>ARTIST LIST</p>
        <ArtistList/>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
