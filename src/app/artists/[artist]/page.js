"use client"
import Image from "next/image";
import styles from "../../styles/page.module.css";
import { firestore } from "../../firebase/firebaseConfig"; 
import { query, collection, where, getDocs } from "firebase/firestore"; 
import React, { useEffect, useState } from "react";

export default function Artist({ params }) {
  const [artist, setArtist] = useState(null);
  const artistSlug = params.artist; // Get slug from params

  useEffect(() => {
    const fetchArtist = async () => {
      console.log("Fetching artist with slug:", artistSlug); // Log the artist slug
      try {
        const q = query(collection(firestore, "artistas"), where("slug", "==", artistSlug)); // Query by slug
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0]; // Get the first document
          setArtist({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such document!");
          setArtist(null);
        }
      } catch (error) {
        console.error("Error fetching artist:", error);
        setArtist(null);
      }
    };

    fetchArtist();
  }, [artistSlug]);

  if (artist === null) return <p>Error fetching artist. Please try again.</p>;
  if (!artist) return <p>Loading...</p>; // Loading state

  return (
    <div className={styles.page}>
      <main className={styles.main}>
      <h1 className={styles.title}>{artist.nombre}</h1>
        <div className={styles.artist_page}>
          <div className={styles.name_list}>
          {artist.profilePicture && (
            <img src={artist.profilePicture} alt={`${artist.nombre}'s profile`} style={{width: '200px', height: 'auto', overflow: 'hidden'}} />
          )}
            <ul>
              <li>BIO</li>
              <li>PORTFOLIO</li>
              <li>MANIFESTO</li>
            </ul>
          </div>
          <div className={styles.artist_page_contents}>
          <p className={styles.title}>OBRAS</p>
            <div className={styles.artist_page_image_container}>
              {artist.obras.map((obra, index) => (
                <div key={index}>
                  <img src={obra.url} alt={`Gallery image ${index + 1}`} />
                  <p>{artist.nombre}</p>
                  <p>{obra.description}</p>
                </div>
              ))}
            </div>
            <div className={styles.artist_page_contents_bio}>
              <p className={styles.title}>BIO</p>
              {artist.bio.map((paragraph, index) => (
                <div key={index}>
                  <p>{paragraph}</p>
                </div>
              ))}
              <p>{artist.bio[0]}</p>
            </div>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
