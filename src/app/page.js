"use client"
import Image from "next/image";
import styles from "./styles/page.module.css";
import EmblaCarousel from "./carousel/EmblaCarousel";
import { firestore } from "./firebase/firebaseConfig";
import { collection, getDocs, query, where, documentId } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [headquarters, setHeadquarters] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [exhibitionIds, setExhibitionIds] = useState([]);

  useEffect(() => {
    const fetchHeadquarters = async () => {
      try {
        const headquartersSnapshot = await getDocs(collection(firestore, "headquarters"));
        const headquartersData = headquartersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const ids = headquartersData.flatMap((hq) => hq.exhibitions || []);
        setHeadquarters(headquartersData);
        setExhibitionIds(ids);
      } catch (error) {
        console.error("Error fetching headquarters:", error);
      }
    };

    fetchHeadquarters();
  }, []);

  useEffect(() => {
    const fetchExhibitions = async () => {
      if (exhibitionIds.length === 0) return;
      try {
        const exhibitionsSnapshot = await getDocs(
          query(collection(firestore, "exhibitions"), where(documentId(), "in", exhibitionIds))
        );
        const exhibitionsData = exhibitionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExhibitions(exhibitionsData);
      } catch (error) {
        console.error("Error fetching exhibitions:", error);
      }
    };

    fetchExhibitions();
  }, [exhibitionIds]);

  const EXCLUDED_EXHIBITION_ID = ""; // Replace with the ID of the exhibition to exclude

  const exhibitionSlides = exhibitions
  .filter((exhibition) => exhibition.id !== EXCLUDED_EXHIBITION_ID) // Exclude the specific exhibition
  .map((exhibition) => {
    // Ensure proper conversion from Firestore Timestamp to Date
    const openingDate = exhibition.openingDate instanceof Date
      ? exhibition.openingDate
      : exhibition.openingDate?.toDate ? exhibition.openingDate.toDate() : new Date(exhibition.openingDate);

    const closingDate = exhibition.closingDate instanceof Date
      ? exhibition.closingDate
      : exhibition.closingDate?.toDate ? exhibition.closingDate.toDate() : new Date(exhibition.closingDate);

    return {
      name: exhibition.name,
      banner: exhibition.banner,
      image: exhibition.gallery[0]?.url || "/placeholder.jpg", // Fallback if no image
      openingDate,
      closingDate,
      slug: exhibition.slug,
      headquarterSlug: headquarters.find((hq) => hq.exhibitions.includes(exhibition.id))?.name,
    };
  })
  .sort((a, b) => b.openingDate - a.openingDate); // Sort by most recent openingDate

  const OPTIONS = {}
  const SLIDE_COUNT = 5

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Carousel con exhibiciones */}
        <div className={styles.hero}>
          <EmblaCarousel slides={exhibitionSlides} type="exhibition" />;
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}