"use client";
import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { app, firestore, storage } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";

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
                      // Add a small delay
      setTimeout(() => {
        setArtists(artistsData);
      }, 1000);

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

  const listVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.5, // Adjust time between each child's animation
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeInOut", // Smooth start and stop
      },
    },
  };
  
  

  

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.page_container}>
          {/* <p className={styles.title}>ARTISTAS</p> */}
          <div className={styles.artists_page}>
            <div className={styles.name_list}>
              <motion.ul
                initial="hidden"
                animate="visible"
                variants={listVariants}
                className={styles.name_list}
              >
                {artists.map((artist) => (
                  <motion.li 
g                    variants={itemVariants}
                  >
                    <Link href={`/artists/${artist.slug}`}>{artist.name}</Link>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
            <motion.div 
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className={styles.name_list}
            style={{ background: "transparent", width: "100%",height: 'auto', justifyContent: "center", alignContent: "center" }}>
              {randomArtwork ? (
                <Link href={`/artworks/${randomArtwork.slug}`} >
                <img
                  src={randomArtwork.url}
                  alt={randomArtwork.title}
                  width={500}
                  height={500}
                  loading="lazy"
                  style={{ margin: "auto", width: "auto", maxHeight: '50vh', height: '100%', display: "block" }}
                />
                </Link>
              ) : (
                <p></p>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
