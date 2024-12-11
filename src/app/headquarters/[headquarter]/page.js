"use client";
import styles from "../../styles/page.module.css";
import Link from "next/link";
import { firestore } from "../../firebase/firebaseConfig";
import { query, collection, where, getDocs, documentId } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import EmblaCarousel from "@/app/carousel/EmblaCarousel";
import { motion } from "framer-motion";

export default function Headquarter({ params }) {
  const { headquarter: headquarterSlug } = params; // Get slug from params
  const [headquarters, setHeadquarters] = useState(null);
  const [exhibitions, setExhibitions] = useState([]); // State to store exhibitions
  const [exhibitionIds, setExhibitionIds] = useState([]); // State to store exhibition IDs
  const [artists, setArtists] = useState([]);

  // Define fetchHeadquarters outside of useEffect
  const fetchHeadquarters = async () => {
    console.log("Fetching headquarters with slug:", headquarterSlug); // Log the slug
    try {
      const q = query(collection(firestore, "headquarters"), where("slug", "==", headquarterSlug));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0]; // Get the first document
        const headquartersData = docSnap.data();
        setHeadquarters({ id: docSnap.id, ...headquartersData });
        setExhibitionIds(headquartersData.exhibitions || []); // Store exhibition IDs

        // Fetch artists if 'first-semester' field exists and is not empty
        if (headquartersData["first-semester"] && headquartersData["first-semester"].length > 0) {
          const artistIds = headquartersData["first-semester"];
          const artistsQuery = query(
            collection(firestore, "artists"),
            where(documentId(), "in", artistIds)
          );
          const artistsSnapshot = await getDocs(artistsQuery);
          const artistsData = artistsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setArtists(artistsData);
        }

      } else {
        console.error("No such headquarters found!");
        setHeadquarters(null);
      }
    } catch (error) {
      console.error("Error fetching headquarters:", error);
      setHeadquarters(null);
    }
  };

  // Define fetchExhibitions outside of useEffect
  const fetchExhibitions = async () => {
    if (exhibitionIds.length === 0) return; // Skip if there are no exhibitions
    try {
      const exhibitionsSnapshot = await getDocs(
        query(collection(firestore, "exhibitions"), where(documentId(), "in", exhibitionIds))
      );
      const exhibitionsData = exhibitionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Exhibitions Data:", exhibitionsData); // Log the fetched exhibitions data
      setExhibitions(exhibitionsData);
    } catch (error) {
      console.error("Error fetching exhibitions:", error);
    }
  };
  const exhibitionSlides = exhibitions.map((exhibition) => ({
    name: exhibition.name,
    image: exhibition.gallery[0]?.url || "/placeholder.jpg",
    openingDate: exhibition.openingDate,
    closingDate: exhibition.closingDate,
    slug: exhibition.slug,
    headquarterSlug: headquarters.slug, // Use the `slug` from the single headquarter object
  }));
  

  useEffect(() => {
    fetchHeadquarters();
  }, [headquarterSlug]);

  useEffect(() => {
    fetchExhibitions();
  }, [exhibitionIds]);

  if (headquarters === null) return <p>Loading headquarters data...</p>;
  if (!headquarters) return <p>No headquarters found.</p>;


  const listVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.5, // Adjust time between each child's animation
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeInOut", // Smooth start and stop
      },
    },
  };
  

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.artist_page} style={{ padding: "1rem", marginTop: '5rem' }}>
          <div className={styles.page_container}>
            <img src={headquarters.image} alt={headquarters.name} style={{ width: "100%" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h1 className={styles.title}>{headquarters.name}</h1>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <p>{headquarters.location}</p>
                <p>{headquarters.schedule}</p>
                <p>{headquarters.phone}</p>
              </div>
            </div>
            {/* Check if about is an array */}
            <div style={{display: 'flex', flexDirection: 'column', gap: "1rem"}}>
            <p className={styles.title} >About</p>
            {Array.isArray(headquarters.about) ? (
              headquarters.about.map((paragraph, index) => <p key={index} style={{textAlign: 'justify', lineHeight: '1.3rem'}}>{paragraph}</p>)
            ) : (
              <p>{headquarters.about || "No information available about this headquarter."}</p>
            )}
            </div>
          {/* Conditionally render the exhibitions section */}
          {exhibitionSlides.length > 0 && (
            <>
              <h1>EXHIBITIONS</h1>
              <EmblaCarousel slides={exhibitionSlides} type="exhibition" />
            </>
          )}
          {/* Conditionally render the 'arthouse' field text */}
          {headquarters.arthouse && (
            <div style={{display: 'flex', flexDirection: 'column', gap: "1rem"}}>
              <p className={styles.title} >Arthouse</p>
              <p style={{textAlign: 'justify', lineHeight: '1.3rem'}}>{headquarters.arthouse}</p>
            </div>
          )}
          {/* Conditionally render the artist residencies section */}
          {artists.length > 0 && (
            <div style={{display: 'flex', flexDirection: 'column', gap: "1rem"}}>
              <p className={styles.subtitle} style={{fontSize: '2rem', fontWeight: '300'}}>First Semester Artists</p>
              <div className={styles.name_list}>
              <motion.ul
                initial="hidden"
                animate="visible"
                variants={listVariants}
                className={styles.name_list}
              >
                {artists.map((artist) => (
                  <motion.li key={artist.id} variants={itemVariants}>
                    <Link href={`/artists/${artist.slug}`}>{artist.name}</Link>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
            </div>
          )}
          </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
  
}
