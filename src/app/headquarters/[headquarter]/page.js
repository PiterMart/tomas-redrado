"use client";
import styles from "../../styles/page.module.css";
import { firestore } from "../../firebase/firebaseConfig";
import { query, collection, where, getDocs, documentId } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import EmblaCarousel from "@/app/carousel/EmblaCarousel";

export default function Headquarter({ params }) {
  const { headquarter: headquarterSlug } = params; // Get slug from params
  const [headquarters, setHeadquarters] = useState(null);
  const [exhibitions, setExhibitions] = useState([]); // State to store exhibitions
  const [exhibitionIds, setExhibitionIds] = useState([]); // State to store exhibition IDs

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

  

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.artist_page} style={{ padding: "1rem", marginTop: '5rem' }}>
          <div className={styles.page_container}>
            <img src={headquarters.image} alt={headquarters.name} style={{ width: "100%" }} />
            <h1 className={styles.title}>{headquarters.name}</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p>{headquarters.location}</p>
              <p>{headquarters.schedule}</p>
              <p>{headquarters.phone}</p>
            </div>
            {/* Check if about is an array */}
            {Array.isArray(headquarters.about) ? (
              headquarters.about.map((paragraph, index) => <p key={index}>{paragraph}</p>)
            ) : (
              <p>{headquarters.about || "No information available about this headquarter."}</p>
            )}
            <h1>EXHIBITIONS</h1>
            <EmblaCarousel slides={exhibitionSlides} type="exhibition" />
          </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
  
}
