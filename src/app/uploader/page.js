import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";
import ArtistUploader from "../firebase/ArtistUploader";
import ArtistList from "../firebase/artistList";
import ExhibitionForm from "../firebase/ExhibitionUploader";
import FairUploader from "../firebase/FairUploader";
import FairUpdater from "../firebase/FairUpdater";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* <p className={styles.title}>ARTIST UPLOADER</p>
        <ArtistUploader/> */}
        <p className={styles.title}>EXHIBITION UPLOADER</p>
        <ExhibitionForm/>
        {/* <p className={styles.title}>FAIR UPLOADER</p>
        <FairUploader/> */}
        {/* <p className={styles.title}>FAIR UPDATER</p>
        <FairUpdater/> */}
        {/* <p className={styles.title}>ARTIST LIST</p>
        <ArtistList/> */}
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
