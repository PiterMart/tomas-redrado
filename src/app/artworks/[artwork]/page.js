"use client";
import styles from "../../styles/artwork.module.css";
import "../../styles/page.module.css";
import { firestore } from "../../firebase/firebaseConfig";
import { query, collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Lightbox from "react-image-lightbox";
import "react-image-lightbox/style.css";


export default function Artwork({ params }) {
  const [artwork, setArtwork] = useState(undefined); // Undefined for initial loading state
  const artworkSlug = params.artwork; // Get slug from params
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);


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
        <div className={styles.artwork_page}>
        <div className={styles.artwork_details}>
          <h1 className={styles.title} style={{fontWeight: '400'}}>{title}</h1>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
              <p><strong></strong></p>
              <Link href={`/artists/${artistSlug}`}> <h2 style={{fontWeight: '300'}}>{artistName}</h2></Link>
              <p><strong></strong> {date}</p>
              <p><strong></strong> {medium}</p>
              <p><strong></strong> {measurements}</p>
              <p style={{marginTop: '2rem'}}><strong></strong> {description}</p>
            </div>
            <div style={{alignSelf: "flex-end"}}>
              <button 
                onClick={() => window.history.back()} 
                className={styles.back_link}
              >
                <p style={{fontSize: '1rem', fontWeight: '100', bottom: '0',  alignSelf: 'end', paddingBottom: '1rem'}}>
                {"<"} Back
                </p>
              </button>
            </div>

          </div>
          <div className={styles.artwork_image_container}>
            <img onClick={() => setIsLightboxOpen(true)} src={url} alt={title} style={{ width: "100%", height: "auto"}} />
          </div>
        </div>
      </main>
      {isLightboxOpen && (
        <Lightbox
          mainSrc={url}
          onCloseRequest={() => setIsLightboxOpen(false)}
        />
      )}

      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
