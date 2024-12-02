"use client";
import styles from "../../styles/artwork.module.css";
import "../../styles/page.module.css";
import { firestore } from "../../firebase/firebaseConfig";
import { query, collection, where, getDocs, doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Lightbox from "react-image-lightbox";
import "react-image-lightbox/style.css";

export default function Artwork({ params }) {
  const [artwork, setArtwork] = useState(undefined); // Undefined for initial loading state
  const [artist, setArtist] = useState(null); // To store artist details
  const artworkSlug = params.artwork; // Get slug from params
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchArtworkAndArtist = async () => {
      try {
        console.log("Fetching artwork with slug:", artworkSlug);

        // Query the 'artworks' collection for the specific slug
        const q = query(collection(firestore, "artworks"), where("artworkSlug", "==", artworkSlug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // There should only be one document for the given slug
          const docSnap = querySnapshot.docs[0];
          const artworkData = docSnap.data();

          setArtwork({
            id: docSnap.id,
            ...artworkData,
          });

          // Fetch artist details using the stored artist ID or reference
          if (artworkData.artistId) {
            const artistDocRef = doc(firestore, "artists", artworkData.artistId);
            const artistDocSnap = await getDoc(artistDocRef);

            if (artistDocSnap.exists()) {
              const artistData = artistDocSnap.data();
              setArtist({
                name: artistData.name,
                slug: artistData.slug,
              });
            } else {
              console.error("Artist not found for artwork.");
              setArtist(null);
            }
          } else {
            console.warn("No artistId found in artwork document.");
          }
        } else {
          setArtwork(null); // No artwork found for this slug
        }
      } catch (error) {
        console.error("Error fetching artwork or artist:", error);
        setArtwork(null); // Explicit null for error state
      }
    };

    fetchArtworkAndArtist();
  }, [artworkSlug]);

  if (artwork === undefined) return <p>Loading...</p>; // Loading state
  if (artwork === null) return <p>Error fetching artwork. Please try again.</p>;

  const { title, url, date, medium, measurements, description } = artwork;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.artwork_page}>
          <div className={styles.artwork_details}>
            <h1 className={styles.title} style={{ fontWeight: "400" }}>{title}</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {artist ? (
                <Link href={`/artists/${artist.slug}`}>
                  <h2 style={{ fontWeight: "300" }}>{artist.name}</h2>
                </Link>
              ) : (
                <h2 style={{ fontWeight: "300" }}>Unknown Artist</h2>
              )}
              <p>{date}</p>
              <p>{medium}</p>
              <p>{measurements}</p>
              <p style={{ marginTop: "2rem" }}>{description}</p>
            </div>
            <div style={{ alignSelf: "flex-end" }}>
              <button
                onClick={() => window.history.back()}
                className={styles.back_link}
              >
                <p style={{ fontSize: "1rem", fontWeight: "100", paddingBottom: "1rem" }}>
                  {"<"} Back
                </p>
              </button>
            </div>
          </div>
          <div className={styles.artwork_image_container}>
            <img
              onClick={() => setIsLightboxOpen(true)}
              src={url}
              alt={title}
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>
      </main>
      {isLightboxOpen && (
        <Lightbox
          mainSrc={url}
          onCloseRequest={() => setIsLightboxOpen(false)}
        />
      )}

      <footer className={styles.footer}></footer>
    </div>
  );
}
