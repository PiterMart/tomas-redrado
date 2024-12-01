"use client";
import Image from "next/image";
import styles from "../../styles/page.module.css";
import { firestore } from "../../firebase/firebaseConfig"; 
import { query, collection, where, getDocs, doc, getDoc } from "firebase/firestore"; 
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
  const [artworks, setArtworks] = useState([]); // State to store detailed artworks
  const artistSlug = params.artist;

  useEffect(() => {
    const fetchArtistData = async () => {
      console.log("Fetching artist with slug:", artistSlug);
      try {
        // Query the artist's document based on the slug
        const artistQuery = query(
          collection(firestore, "artists"),
          where("slug", "==", artistSlug)
        );
        const artistSnapshot = await getDocs(artistQuery);

        if (!artistSnapshot.empty) {
          const artistDoc = artistSnapshot.docs[0];
          const artistData = artistDoc.data();

          const formattedArtist = {
            ...artistData,
            id: artistDoc.id,
            birthDate: convertTimestampToYear(artistData.birthDate),
          };

          setArtist(formattedArtist);

          // Fetch artwork details
          if (artistData.artworks && artistData.artworks.length > 0) {
            const artworkDetails = await fetchArtworksByIds(artistData.artworks);
            setArtworks(artworkDetails);
          }
        } else {
          console.error("No artist found with this slug.");
          setArtist(null);
        }
      } catch (error) {
        console.error("Error fetching artist:", error);
        setArtist(null);
      }
    };

    fetchArtistData();
  }, [artistSlug]);

  // Fetch artworks from the `artworks` collection by IDs
  const fetchArtworksByIds = async (artworkIds) => {
    try {
      const artworkPromises = artworkIds.map(async (id) => {
        const artworkDoc = await getDoc(doc(firestore, "artworks", id));
        return { id: artworkDoc.id, ...artworkDoc.data() };
      });

      return Promise.all(artworkPromises);
    } catch (error) {
      console.error("Error fetching artworks:", error);
      return [];
    }
  };

  if (artist === null) return <p>Error fetching artist. Please try again.</p>;
  if (!artist) return <p>Loading...</p>;

  const artworkSlides = artworks.map((artwork) => ({
    title: artwork.title,
    url: artwork.url,
    medium: artwork.medium,
    extras: artwork.extras,
    slug: artwork.artworkSlug,
    date: convertTimestampToYear(artwork.date),
    measurements: artwork.measurements,
    description: artwork.description,
  }));

  const OPTIONS = {};

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.page_container}>
          <div>
            <div className={styles.artist_page_NameCard}>
              <h1 className={styles.title} style={{ paddingTop: "5rem" }}>
                {artist.name}
              </h1>
              <div>
                <h1 className={styles.subtitle}>{artist.origin},</h1>
                <h1 className={styles.subtitle}>{artist.birthDate}.</h1>
              </div>
              <div className={styles.artist_page_nav}>
                {artist.profilePicture && (
                  <img
                    src={artist.profilePicture}
                    alt={`${artist.name}'s profile`}
                    style={{
                      width: "200px",
                      height: "auto",
                      overflow: "hidden",
                      filter: "grayscale(1)",
                    }}
                  />
                )}
              </div>
            </div>
            <div className={styles.artist_page}>
              <div className={styles.artist_page_contents}>
                <div>
                  <p style={{ fontSize: "1.5rem" }}>{artist.bio[0]}</p>
                  <Link href="#bio">
                    <button
                      style={{
                        padding: "0px",
                        marginTop: "1.5rem",
                        marginRight: "0px",
                        width: "100%",
                        textAlign: "right",
                        color: "gray",
                      }}
                    >
                      Read More
                    </button>
                  </Link>
                </div>
                <div
                  className={styles.artist_page_contents_obras}
                  id="obras"
                  style={{ scrollMargin: "10rem" }}
                >
                  <p className={styles.title}>ARTWORKS</p>
                  <EmblaCarousel slides={artworkSlides} type="artwork" />
                </div>
                <div
                  className={styles.artist_page_contents_bio}
                  id="bio"
                >
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
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
