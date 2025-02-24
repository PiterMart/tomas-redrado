"use client";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import styles from "../styles/page.module.css";
import ArtistUploader from "../firebase/ArtistUploader";
import ExhibitionForm from "../firebase/ExhibitionUploader";
import FairUploader from "../firebase/FairUploader";
import FairUpdater from "../firebase/FairUpdater";

export default function Home() {
  const [activeSection, setActiveSection] = useState("artist");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("Checking authentication...");
  
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("User Status:", currentUser);
      setUser(currentUser);
    });
  
    return () => unsubscribe();
  }, []);
  

  const handleLogin = async () => {
    setError(""); // Clear previous errorsL
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("Invalid email or password.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <div className={styles.loginContainer}> {/* Add CSS Module class */}
        <h2 className={styles.loginTitle}>Login to acces uploader</h2>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formGroup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          <button onClick={handleLogin} className={styles.loginButton}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ maxWidth: "1500px", paddingTop: "10rem" }}>
        {/* Logout Button */}
        <button onClick={handleLogout} style={{ position: "absolute", top: 20, right: 20 }}>
          Logout
        </button>

        {/* Navigation Buttons */}
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
        <div style={{ margin: "auto" }}>
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
            <p className={styles.title}>ARTIST UPLOADER</p>
            <ArtistUploader />
          </div>
        )}

        {/* Exhibition Section */}
        {activeSection === "exhibition" && (
          <div id="exhibition" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <p className={styles.title}>EXHIBITION UPLOADER</p>
            <ExhibitionForm />
          </div>
        )}

        {/* Fair Section */}
        {activeSection === "fair" && (
          <div id="fair" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <p className={styles.title}>FAIR UPDATER</p>
            <FairUpdater />
          </div>
        )}
      </main>
    </div>
  );
}
