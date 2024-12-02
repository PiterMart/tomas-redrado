"use client";
import styles from "../../../styles/page.module.css";
import { firestore } from "../../../firebase/firebaseConfig";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import EmblaCarousel from "../../../carousel/EmblaCarousel";

export default function Exhibition({ params }) {
  const { exhibition: exhibitionSlug } = params; // Get slug from params
  const [exhibition, setExhibition] = useState(null); // State to store the exhibition data
  const [artistsData, setArtistsData] = useState([]); // State to store the artist details

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

  // Fetch artist details and associated artworks
  const fetchArtists = async (artists) => {
    try {
      const artistPromises = artists.map(async (artist) => {
        const artistDoc = await getDoc(doc(firestore, "artists", artist.artistSlug)); // Using artistSlug as artistId
        if (artistDoc.exists()) {
          const artistData = artistDoc.data();

          // Fetch artworks for this artist
          const selectedArtworks = await fetchArtworks(artist.selectedArtworks);

          return {
            ...artistData,
            id: artistDoc.id,
            selectedArtworks, // Attach fetched artworks
          };
        }
        return null;
      });

      const fetchedArtists = await Promise.all(artistPromises);
      return fetchedArtists.filter((artist) => artist !== null); // Remove null entries
    } catch (error) {
      console.error("Error fetching artists:", error);
      return [];
    }
  };

  // Fetch artworks by their IDs
  const fetchArtworks = async (artworkIds) => {
    try {
      const artworkPromises = artworkIds.map(async (artworkId) => {
        const artworkDoc = await getDoc(doc(firestore, "artworks", artworkId));
        if (artworkDoc.exists()) {
          return {
            id: artworkDoc.id,
            ...artworkDoc.data(),
          };
        }
        return null;
      });

      const fetchedArtworks = await Promise.all(artworkPromises);
      return fetchedArtworks.filter((artwork) => artwork !== null); // Remove null entries
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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.page_container}>
          <div className={styles.exhibition_page}>
            <p className={styles.title}>{exhibition.name}</p>
            <EmblaCarousel slides={exhibitionSlides} type="picture" />
            <p style={{fontSize: '2rem', width: '75%', margin: 'auto', textAlign: 'center'}}>{exhibition.description}</p>
            <h2 style={{ marginTop: "3rem", fontWeight: "200" }} className={styles.title}>
              Represented Artists
            </h2>
            {artistsData.map((artist) => {
              const artworkSlides = artist.selectedArtworks.map((artwork) => ({
                title: artwork.title,
                url: artwork.url,
                medium: artwork.medium,
                extra: artwork.extra,
                slug: artwork.artworkSlug,
                date: artwork.date,
                measurements: artwork.measurements,
                description: artwork.description,
              }));
              return (
                <div
                  key={artist.id}
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
