"use client"
import Image from "next/image";
import styles from "../../styles/page.module.css";
import { firestore } from "../../firebase/firebaseConfig"; 
import { query, collection, where, getDocs } from "firebase/firestore"; 
import React, { useEffect, useState } from "react";
import Link from "next/link";

// Helper function to convert Firestore timestamp to a date string
function convertTimestampToYear(timestamp) {
  if (timestamp && timestamp.seconds) {
    const date = new Date(timestamp.seconds * 1000); // Convert seconds to milliseconds
    return date.getFullYear().toString(); // Extract the year as a string
  }
  return null;
}


export default function Artist({ params }) {
  const [artist, setArtist] = useState(null);
  const artistSlug = params.artist;

  useEffect(() => {
    const fetchArtist = async () => {
      console.log("Fetching artist with slug:", artistSlug);
      try {
        const q = query(collection(firestore, "artists"), where("slug", "==", artistSlug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const artistData = docSnap.data();

          // Convert Firestore timestamp fields to date strings
          const formattedArtist = {
            ...artistData,
            id: docSnap.id,
            birthDate: convertTimestampToYear(artistData.birthDate),
            obras: artistData.artworks.map(artwork => ({
              ...artwork,
              date: convertTimestampToYear(artwork.date),
            }))
          };
          

          setArtist(formattedArtist);
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
  if (!artist) return <p>Loading...</p>;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>{artist.name}</h1>
        <h1 className={styles.subtitle}>{artist.origen}</h1>
        <h1 className={styles.subtitle}>{artist.birthDate}</h1>
        <div className={styles.artist_page}>
          <div className={styles.name_list}>
            {artist.profilePicture && (
              <img src={artist.profilePicture} alt={`${artist.nombre}'s profile`} style={{width: '200px', height: 'auto', overflow: 'hidden'}} />
            )}
            <ul>
              <li><a href="#obras">OBRAS</a></li>
              <li><a href="#bio">BIO</a></li>
              <li><a href={artist.cv} target="_blank"> CV</a></li>
            </ul>
          </div>
          <div className={styles.artist_page_contents}>
            <p>{artist.bio[0]}</p>
            <a href="#bio"><button>leer mas </button></a>
            <div className={styles.artist_page_contents_obras} id="obras" style={{scrollMargin: '10rem'}}>
              <p className={styles.title}>OBRAS</p>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', overflow: 'hidden'}}>
                {artist.artworks.map((artwork, index) => (
                  <Link href={`/artworks/${artwork.slug}`} key={index}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                      <div className={styles.artist_page_image_container}>
                        <img src={artwork.url} alt={`Gallery image ${index + 1}`} />
                      </div>
                      <div>
                        <div>
                          <p>{artist.name}</p>
                          <div style={{display: 'flex', flexDirection: 'row', gap: '0.25rem'}}>
                            <p>{artwork.title}</p>
                            <p>{artwork.date}</p>
                          </div>
                        </div>
                        <div style={{color: 'gray'}}>
                          <p>{artwork.measurements}</p>
                          <p>{artwork.technique}</p>
                          <p>{artwork.extra}</p>
                          <p>{artwork.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className={styles.artist_page_contents_bio} id="bio">
              <p className={styles.title}>BIO</p>
              {artist.bio.map((paragraph, index) => (
                <div key={index}>
                  <p>{paragraph}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
