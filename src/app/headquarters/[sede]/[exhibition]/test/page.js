"use client";
import styles from "../../../styles/page.module.css";
import { firestore } from "../../../firebase/firebaseConfig";
import { query, collection, where, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import EmblaCarousel from "../../../carousel/EmblaCarousel";

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
        const docSnap = querySnapshot.docs[0]; // Get the first document
        const exhibitionData = docSnap.data();
        setExhibition({ id: docSnap.id, ...exhibitionData });

        // Fetch the artists based on the exhibition data
        if (exhibitionData.artists && exhibitionData.artists.length > 0) {
          fetchArtists(exhibitionData.artists);
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

  // Fetch artist details from the artists collection
  const fetchArtists = async (artists) => {
    try {
      const artistsDetails = [];

      // Loop through each artist in the exhibition and fetch their details
      for (const artist of artists) {
        const q = query(collection(firestore, "artists"), where("slug", "==", artist.slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const artistData = querySnapshot.docs[0].data();
          artistsDetails.push({
            ...artistData,
            selectedArtworks: artist.selectedArtworks || [],
          });

          // Fetch the artworks data for the selected artworks
          fetchArtworks(artist.selectedArtworks);
        } else {
          console.error(`No artist found with slug: ${artist.slug}`);
        }
      }

      setArtistsData(artistsDetails);
    } catch (error) {
      console.error("Error fetching artists:", error);
    }
  };

  // Fetch artwork data based on artwork slugs
  const fetchArtworks = async (artworkSlugs) => {
    try {
      const artworksDetails = [];

      for (const slug of artworkSlugs) {
        const q = query(collection(firestore, "artists"), where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const artworkData = querySnapshot.docs[0].data();
          artworksDetails.push(artworkData);
        } else {
          console.error(`No artwork found with slug: ${slug}`);
        }
      }

      setArtworksData((prevData) => [...prevData, ...artworksDetails]);
    } catch (error) {
      console.error("Error fetching artworks:", error);
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
  const SLIDE_COUNT = 5

  return (
    <div className={styles.page}>
      <main className={styles.main}>
      <div className={styles.artist_page} style={{padding: '1.5rem', marginTop: '6rem'}}>
        <h2>{exhibition.name}</h2>
        <EmblaCarousel slides={exhibitionSlides} type="picture" />
        <p style={{fontSize: '1.5rem'}}>{exhibition.description}</p>
        {/* Render Artists and Artworks */}
        {artistsData.length > 0 ? (
          <div className={styles.artistsContainer}>
            <p className={styles.title}>Artists</p>
            {artistsData.map((artist) => (
              <div key={artist.slug} className={styles.artist}>
                <h3>{artist.name}</h3>
                {/* Render selected artworks */}
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
            ))}
          </div>
        ) : (
          <p>No artists found in this exhibition.</p>
        )}
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
