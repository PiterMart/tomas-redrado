"use client";
import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { app, firestore } from "../firebase/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [randomArtwork, setRandomArtwork] = useState(null);

  useEffect(() => {
    async function fetchArtistsAndArtworks() {
      try {
        // Fetch artists
        const querySnapshot = await getDocs(collection(firestore, "artists"));
        const artistsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // Fetch artworks separately
        const artworksSnapshot = await getDocs(collection(firestore, "artworks"));
        const artworksData = artworksSnapshot.docs.map((doc) => ({
          id: doc.id,
          slug: doc.data().artworkSlug || doc.id, // Use `artworkSlug` for the slug
          ...doc.data(),
        }));
  
        // Associate artworks with artists
        const artistsWithArtworks = artistsData.map((artist) => ({
          ...artist,
          artworks: artworksData.filter((artwork) => artist.artworks?.includes(artwork.id)),
        }));
  
        // Sort artists alphabetically by name
        artistsWithArtworks.sort((a, b) => a.name.localeCompare(b.name));
        setArtists(artistsWithArtworks);
  
        // Select a random artwork
        if (artworksData.length > 0) {
          const randomArt = artworksData[Math.floor(Math.random() * artworksData.length)];
          setRandomArtwork(randomArt);
        }
      } catch (error) {
        console.error("Error fetching artists or artworks:", error);
      }
    }
  
    fetchArtistsAndArtworks();
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
          <div className={styles.artists_page}>
            <div className={styles.name_list}>
              <motion.ul
                initial="hidden"
                animate="visible"
                variants={listVariants}
                className={styles.name_list}
              >
                {artists.map((artist) => (
                  <motion.li key={artist.id} variants={itemVariants}>
                    <Link href={`/artists/${artist.slug}`}>{artist.name}</Link>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              className={styles.artists_image}
              style={{
                background: "transparent",
                width: "100%",
                height: "auto",
                justifyContent: "center",
                alignContent: "center",
              }}
            >
              {randomArtwork ? (
                <Link href={`/artworks/${randomArtwork.slug}`}>
                  <img
                    src={randomArtwork.url}
                    alt={randomArtwork.title}
                    width={500}
                    height={500}
                    loading="lazy"
                    style={{
                      margin: "auto",
                      width: "auto",
                      maxHeight: "50vh",
                      height: "100%",
                      display: "block",
                    }}
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
