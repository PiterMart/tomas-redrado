"use client";
import styles from "../../../styles/page.module.css";
import { firestore } from "../../../firebase/firebaseConfig";
import { query, collection, where, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import EmblaCarousel from "../../../carousel/EmblaCarousel";
import Link from "next/link";

export default function Exhibition({ params }) {
  const { exhibition: exhibitionSlug } = params; // Get slug from params
  const [exhibition, setExhibition] = useState(null); // State to store the exhibition data
  const [artistsData, setArtistsData] = useState([]); // State to store the artist details
  const [artworksData, setArtworksData] = useState([]); // State to store artworks data

  // Fetch the exhibition details based on the slug
  const fetchExhibition = async () => {
    console.log("Fetching exhibition with slug:", exhibitionSlug);
    try {
      const q = query(collection(firestore, "exhibitions"), where("slug", "==", exhibitionSlug));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const exhibitionData = docSnap.data();
        setExhibition({ id: docSnap.id, ...exhibitionData });
  
        // Fetch the artists and their artworks
        if (exhibitionData.artists && exhibitionData.artists.length > 0) {
          const artistsDetails = await fetchArtists(exhibitionData.artists);
          setArtistsData(artistsDetails);
        }
      } else {
        console.error("No such exhibition found!");
        setExhibition(null);
      }
    } catch (error) {
      console.error("Error fetching exhibition:", error);
      setExhibition(null);
    }
  };

  // Add the fetchArtists function
const fetchArtists = async (artists) => {
  try {
    // Fetch artist details for all artists in the exhibition
    const artistPromises = artists.map(async (artist) => {
      const artistDoc = await getDocs(query(collection(firestore, "artists"), where("slug", "==", artist.artistSlug)));
      if (!artistDoc.empty) {
        const artistData = artistDoc.docs[0].data();
        const selectedArtworks = await fetchArtworks(artist.selectedArtworks);
        return {
          ...artistData,
          slug: artist.artistSlug,
          selectedArtworks, // Add fetched artworks for this artist
        };
      }
      return null;
    });

    // Wait for all artist data to be fetched
    const fetchedArtists = await Promise.all(artistPromises);
    return fetchedArtists.filter((artist) => artist !== null); // Remove any null entries
  } catch (error) {
    console.error("Error fetching artists:", error);
    return [];
  }
};

// Add the fetchArtworks function
const fetchArtworks = async (artworks) => {
  try {
    // Fetch details for all artworks
    const artworkPromises = artworks.map(async (artworkId) => {
      const artworkDoc = await getDocs(query(collection(firestore, "artworks"), where("slug", "==", artworkId)));
      if (!artworkDoc.empty) {
        return {
          id: artworkDoc.docs[0].id,
          ...artworkDoc.docs[0].data(),
        };
      }
      return null;
    });

    // Wait for all artworks to be fetched
    const fetchedArtworks = await Promise.all(artworkPromises);
    return fetchedArtworks.filter((artwork) => artwork !== null); // Remove any null entries
  } catch (error) {
    console.error("Error fetching artworks:", error);
    return [];
  }
};


  useEffect(() => {
    fetchExhibition();
  }, [exhibitionSlug]);

  if (exhibition === null) return <p>Loading exhibition data...</p>;
  if (!exhibition) return <p>No exhibition found.</p>;

  const exhibitionSlides = exhibition.gallery.map((gallery) => ({
    image: gallery.url,
  }));

  const OPTIONS = {}

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.page_container}>
          <div className={styles.exhibition_page}>
            <p className={styles.title}>{exhibition.name}</p>
            <EmblaCarousel slides={exhibitionSlides} type="picture" />
            <h2 style={{ marginTop: "3rem", fontWeight: "200" }} className={styles.title}>
              Represented Artists
            </h2>
            {artistsData.map((artist) => {
              const artworkSlides = artist.selectedArtworks.map((artwork) => ({
                title: artwork.title,
                url: artwork.url,
                medium: artwork.medium,
                extra: artwork.extra,
                slug: artwork.slug,
                date: artwork.date,
                measurements: artwork.measurements,
                description: artwork.description,
              }));
              return (
                <div
                  key={artist.slug}
                  className={styles.artist}
                  style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                  <p style={{ fontWeight: "300", fontSize: "1.5rem" }}>{artist.name}</p>
                  {artworkSlides.length > 0 ? (
                    <EmblaCarousel slides={artworkSlides} type="artwork" />
                  ) : (
                    <p>No artworks found for this artist.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
