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
  
  const fetchArtists = async (artists) => {
    const artistSlugs = artists.map((artist) => artist.slug);
    const q = query(collection(firestore, "artists"), where("slug", "in", artistSlugs));
    const querySnapshot = await getDocs(q);
  
    const artistsDetails = querySnapshot.docs.map((doc) => {
      const artistData = doc.data();
      const exhibitionArtist = artists.find((a) => a.slug === artistData.slug);
      const selectedArtworks = exhibitionArtist.selectedArtworks || [];
  
      // Filter artworks from artist's `artworks` array using `selectedArtworks`
      const artworksDetails = artistData.artworks.filter((artwork) =>
        selectedArtworks.includes(artwork.slug)
      );
  
      return { ...artistData, selectedArtworks: artworksDetails };
    });
  
    return artistsDetails;
  };
  
  
  const fetchArtworks = async (selectedArtworks) => {
    if (!selectedArtworks || selectedArtworks.length === 0) return [];
  
    const q = query(collection(firestore, "artworks"), where("slug", "in", selectedArtworks));
    const querySnapshot = await getDocs(q);
  
    if (querySnapshot.empty) {
      console.warn(`No artworks found for slugs: ${selectedArtworks}`);
      return [];
    }
  
    return querySnapshot.docs.map(doc => doc.data());
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
            <h2>{exhibition.name}</h2>
            <EmblaCarousel slides={exhibitionSlides} type="picture" />
            <p style={{fontSize: '1.5rem'}}>{exhibition.description}</p>
            {/* Render Artists and Artworks */}
            <h2 style={{marginTop: '3rem'}}>Represented Artists</h2>
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
                <div key={artist.slug} className={styles.artist} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  <h3>{artist.name}</h3>
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
