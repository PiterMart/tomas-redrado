import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";
import ArtistUploader from "../firebase/ArtistUploader";
import ArtistList from "../firebase/artistList";
import ExhibitionForm from "../firebase/ExhibitionUploader";
import ExhibitionUpdater from "../firebase/ExhibitionUpdater";
import FairUploader from "../firebase/FairUploader";
import FairUpdater from "../firebase/FairUpdater";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main} style={{maxWidth: '1500px', paddingTop: '10rem'}}>
        <div style={{display: "flex", flexDirection: "column", width: "100%", margin: "auto", gap: "1.5rem", alignItems: "center" }}>
          <p className={styles.title}>ARTIST UPLOADER</p>
          <ArtistUploader/>
        </div>
        <div style={{display: "flex", flexDirection: "column", width: "100%", margin: "auto", gap: "1.5rem", alignItems: "center" }}>
          <p className={styles.title}>EXHIBITION UPLOADER</p>
          <ExhibitionForm/>
        </div>
        <div style={{display: "flex", flexDirection: "column", width: "100%", margin: "auto", gap: "1.5rem", alignItems: "center" }}>
          <p className={styles.title}>EXHIBITION UPDATER</p>
          <ExhibitionUpdater/>
        </div>
        <div style={{display: "flex", flexDirection: "column", width: "100%", margin: "auto", gap: "1.5rem", alignItems: "center" }}>
          <p className={styles.title}>FAIR UPLOADER</p>
          <FairUploader/>
        </div>
        <div style={{display: "flex", flexDirection: "column", width: "100%", margin: "auto", gap: "1.5rem", alignItems: "center" }}>
          <p className={styles.title}>FAIR UPDATER</p>
          <FairUpdater/>
        </div>
        <div style={{display: "flex", flexDirection: "column", width: "100%", margin: "auto", gap: "1.5rem", alignItems: "center" }}>
          <p className={styles.title}>ARTIST LIST</p>
          <ArtistList/>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
