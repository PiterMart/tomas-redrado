"use client"
import { useState } from "react";
import styles from "../styles/page.module.css";
import ArtistUploader from "../firebase/ArtistUploader";
import ArtistUpdater from "../firebase/ArtistUpdater";
import ExhibitionForm from "../firebase/ExhibitionUploader";
import ExhibitionUpdater from "../firebase/ExhibitionUpdater";
import FairUploader from "../firebase/FairUploader";
import FairUpdater from "../firebase/FairUpdater";

export default function Home() {
  const [activeSection, setActiveSection] = useState("artist");

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ maxWidth: "1500px", paddingTop: "10rem" }}>
        {/* Navigation Buttons */}
        <div style={{margin: 'auto'}}>
          <p className={styles.title}> What are you working on?</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
          <button onClick={() => setActiveSection("artist")} className={styles.subtitle}>Artists</button>
          <button onClick={() => setActiveSection("exhibition")} className={styles.subtitle}>Exhibitions</button>
          <button onClick={() => setActiveSection("fair")} className={styles.subtitle}>Fairs</button>
        </div>
        {/* Artist Section */}
        {activeSection === "artist" && (
          <div id="artist" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", margin: "auto", gap: "1.5rem", alignItems: "center" }}>
              <p className={styles.title}>ARTIST UPLOADER</p>
              <ArtistUploader />
            </div>
          </div>
        )}
        {/* Exhibition Section */}
        {activeSection === "exhibition" && (
          <div id="exhibition" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", margin: "auto", gap: "1.5rem", alignItems: "center" }}>
              <p className={styles.title}>EXHIBITION UPLOADER</p>
              <ExhibitionForm />
            </div>
          </div>
        )}

        {/* Fair Section */}
        {activeSection === "fair" && (
          <div id="fair" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", margin: "auto", gap: "1.5rem", alignItems: "center" }}>
              <p className={styles.title}>FAIR UPLOADER</p>
              <FairUploader />
            </div>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", margin: "auto", gap: "1.5rem", alignItems: "center" }}>
              <p className={styles.title}>FAIR UPDATER</p>
              <FairUpdater />
            </div>
          </div>
        )}
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
