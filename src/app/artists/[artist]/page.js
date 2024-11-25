"use client"
import Image from "next/image";
import styles from "../../styles/page.module.css";
import { firestore } from "../../firebase/firebaseConfig"; 
import { query, collection, where, getDocs } from "firebase/firestore"; 
import React, { useEffect, useState } from "react";
import Link from "next/link";
import EmblaCarousel from "../../carousel/EmblaCarousel";

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

  const artworkSlides = artist.artworks.map((artwork, index) => ({
    title: artwork.title,
    url: artwork.url,
    medium: artwork.medium,
    extra: artwork.extra,
    slug: artwork.slug,
    date: artwork.date,
    measurements: artwork.measurements,
    description: artwork.description,
    // artistSlug: artists.find((hq) => hq.artists.includes(artists.id))?.slug,
  }));
  const OPTIONS = {}


  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.page_container}>
          <div className={styles.artist_page_NameCard}>
            <h1 className={styles.title} style={{paddingTop: '5rem'}}>{artist.name}</h1>
            <div>
              <h1 className={styles.subtitle}>{artist.origin},</h1>
              <h1 className={styles.subtitle}>{artist.birthDate}.</h1>
            </div>
            <div className={styles.artist_page_nav}>
              {artist.profilePicture && (
                  <img src={artist.profilePicture} alt={`${artist.nombre}'s profile`} style={{width: '200px', height: 'auto', overflow: 'hidden'}} />
                )}
              <div className={styles.name_list} style={{marginTop: '2rem'}}>
                <ul>
                  <li><a href="#obras">ARTWORKS</a></li>
                  <li><a href="#bio">BIO</a></li>
                  <li><a href={artist.cv} target="_blank"> CV </a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className={styles.artist_page}>
            <div className={styles.artist_page_contents}>
              <div>
                <p style={{fontSize: '1.5rem'}}>{artist.bio[0]}</p>
                <Link href="#bio"><button style={{padding: "0px", marginTop: "1.5rem", marginRight: "0px", width: "100%", textAlign: "right", color: "gray"}}>Read More</button></Link>
              </div>
              <div className={styles.artist_page_contents_obras} id="obras" style={{scrollMargin: '10rem'}}>
              <p className={styles.title}>ARTWORKS</p>
              <EmblaCarousel slides={artworkSlides} type="artwork" />
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
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
