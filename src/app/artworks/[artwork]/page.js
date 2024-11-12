"use client";
import styles from "../../styles/page.module.css";
import { firestore } from "../../firebase/firebaseConfig";
import { query, collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Artwork({ params }) {
  const [artwork, setArtwork] = useState(undefined); // Undefined for initial loading state
  const artworkSlug = params.artwork; // Get slug from params

  useEffect(() => {
    const fetchArtwork = async () => {
      console.log("Fetching artwork with slug:", artworkSlug); // Log the artwork slug
      try {
        const q = query(collection(firestore, "artists")); // Get all artists
        const querySnapshot = await getDocs(q);

        let foundArtwork = null;

        // Iterate through all artist documents
        querySnapshot.forEach((docSnap) => {
          const artistData = docSnap.data();
          const artwork = artistData.artworks.find(o => o.slug === artworkSlug); // Find artwork by slug
          if (artwork) {
            foundArtwork = { 
              artistId: docSnap.id, 
              artistName: artistData.name,
              artistSlug: artistData.slug,  // Add artist name to the artwork data
              ...artwork 
            }; // Set found artwork, artist ID, and artist name
          }
        });

        setArtwork(foundArtwork);
      } catch (error) {
        console.error("Error fetching artwork:", error);
        setArtwork(null); // Explicit null for error state
      }
    };

    fetchArtwork();
  }, [artworkSlug]);

  if (artwork === undefined) return <p>Loading...</p>; // Loading state
  if (artwork === null) return <p>Error fetching artwork. Please try again.</p>;

  const { title, url, artistName, date, medium, measurements, extra, description, artistSlug } = artwork;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.artwork_page} style={{margin: 'auto', display: 'flex', flexDirection: 'column', gap: '3rem'}}>
        <h1 className={styles.title}>{title}</h1>
          <div className={styles.artwork_image_container}>
            <img src={url} alt={title} style={{ width: "100%", height: "auto", maxHeight: '80vh', width: 'auto' }} />
          </div>
          <div className={styles.artwork_details}>
            <h2>Details</h2>
            <p><strong>Artist:</strong> {artistName}</p>
            <p><strong>Date:</strong> {date}</p>
            <p><strong>Medium:</strong> {medium}</p>
            <p><strong>Measurements:</strong> {measurements}</p>
            {/* <p><strong>Extras:</strong> {Array.isArray(extra) ? extra.join(", ") : extra}</p>  */}
            <p><strong>Description:</strong> {description}</p>
          </div>
          <Link href={`/artists/${artistSlug}`} className={styles.back_link}>Back to Artist</Link>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
