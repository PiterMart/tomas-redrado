"use client";
import Image from "next/image";
import styles from "../../styles/page.module.css";
import { firestore } from "../../firebase/firebaseConfig";
import { query, collection, where, getDocs, documentId } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import EmblaCarousel from "@/app/carousel/EmblaCarousel";

export default function Sede({ params }) {
  const { sede: sedeSlug } = params; // Get slug from params
  const [headquarters, setHeadquarters] = useState(null);
  const [exhibitions, setExhibitions] = useState([]); // State to store exhibitions
  const [exhibitionIds, setExhibitionIds] = useState([]); // State to store exhibition IDs

  // Define fetchHeadquarters outside of useEffect
  const fetchHeadquarters = async () => {
    console.log("Fetching headquarters with slug:", sedeSlug); // Log the slug
    try {
      const q = query(collection(firestore, "sedes"), where("slug", "==", sedeSlug));
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
    image: exhibition.gallery[0]?.url || "/placeholder.jpg", // Fallback si no hay imagen
    openingDate: exhibition.openingDate,
    closingDate: exhibition.closingDate,
    slug: exhibition.slug,
    // sedeSlug: headquarters.find((hq) => hq.exhibitions.includes(exhibition.id))?.slug,
  }));

  useEffect(() => {
    fetchHeadquarters();
  }, [sedeSlug]);

  useEffect(() => {
    fetchExhibitions();
  }, [exhibitionIds]);

  if (headquarters === null) return <p>Loading headquarters data...</p>;
  if (!headquarters) return <p>No headquarters found.</p>;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        
        <div className={styles.artist_page} style={{padding: '1rem'}}>
          <div className={styles.page_container}>
            <img src={headquarters.image} />
            <h1 className={styles.title}>{headquarters.name}</h1>
            <p>{headquarters.location}</p>
            {headquarters.about.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            
            <h1>EXHIBICIONES</h1>
            <EmblaCarousel slides={exhibitionSlides} type="exhibition" />
          </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
