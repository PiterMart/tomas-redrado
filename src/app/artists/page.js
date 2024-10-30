"use client"
import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { app, firestore, storage } from "../firebase/firebaseConfig";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

export default function ArtistPage() {
  
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);

  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null); // Store selected artist for editing

  // Fetch artists from Firestore
  useEffect(() => {
    async function fetchArtists() {
      try {
        const querySnapshot = await getDocs(collection(firestore, "artistas"));
        const artistsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          display: false,
          ...doc.data(),
        }));
        
        // Sort artists alphabetically by nombre
        artistsData.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        setArtists(artistsData);
      } catch (error) {
        console.error("Error fetching artists:", error);
      }
    }
  
    fetchArtists();
  }, []);

  const currentPath = usePathname();

  const isCurrent = (path) => {
    return currentPath === path;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p className={styles.title}>ARTISTAS</p>
        <div className={styles.artist_page}>
          <div className={styles.name_list}>
            <ul>
            {artists.map((artist) => (
            <li key={artist.id}>
            <Link href={`/artists/${artist.slug}`}>
              {artist.nombre}
            </Link>
              </li>
        ))}
            </ul>
          </div>
          <div style={{background: 'lightgray', width: '100%', justifyContent: 'center', alignContent: 'center'}}>
            <Image
              src="/TomasRedradoLogo.svg"
              alt="TomasRedrado"
              width={500}
              height= {500}
              loading="lazy"
              style={{margin: 'auto', width: '50%', display: 'block'}}
            />
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
