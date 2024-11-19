"use client";
import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { app, firestore, storage } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [randomArtwork, setRandomArtwork] = useState(null);

  // Fetch artists from Firestore and select a random artwork
  useEffect(() => {
    async function fetchArtists() {
      try {
        const querySnapshot = await getDocs(collection(firestore, "artists"));
        const artistsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort artists alphabetically by name
        artistsData.sort((a, b) => a.name.localeCompare(b.name));
        setArtists(artistsData);

        // Select a random artwork
        if (artistsData.length > 0) {
          const randomArtist = artistsData[Math.floor(Math.random() * artistsData.length)];
          if (randomArtist.artworks && randomArtist.artworks.length > 0) {
            const randomArt = randomArtist.artworks[Math.floor(Math.random() * randomArtist.artworks.length)];
            setRandomArtwork(randomArt);
          }
        }
      } catch (error) {
        console.error("Error fetching artists:", error);
      }
    }

    fetchArtists();
  }, []);

  const currentPath = usePathname();

  const isCurrent = (path) => {
    return currentPath === path;
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.page_container}>
          {/* <p className={styles.title}>ARTISTAS</p> */}
          <div className={styles.artist_page}>
            <div className={styles.name_list}>
              <ul>
                {artists.map((artist) => (
                  <li key={artist.id}>
                    <Link href={`/artists/${artist.slug}`}>
                      {artist.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: "transparent", width: "100%",height: 'auto', justifyContent: "center", alignContent: "center" }}>
              {randomArtwork ? (
                <img
                  src={randomArtwork.url}
                  alt={randomArtwork.title}
                  width={500}
                  height={500}
                  loading="lazy"
                  style={{ margin: "auto", width: "auto", maxHeight: '50vh', height: '100%', display: "block" }}
                />
              ) : (
                <p></p>
              )}
            </div>
          </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
