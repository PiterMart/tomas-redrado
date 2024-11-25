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
        const headquartersSnapshot = await getDocs(collection(firestore, "sedes"));
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


  const exhibitionSlides = exhibitions.map((exhibition) => ({
    name: exhibition.name,
    image: exhibition.gallery[0]?.url || "/placeholder.jpg", // Fallback si no hay imagen
    openingDate: exhibition.openingDate,
    closingDate: exhibition.closingDate,
    slug: exhibition.slug,
    sedeSlug: headquarters.find((hq) => hq.exhibitions.includes(exhibition.id))?.slug,
  }));
  const OPTIONS = {}
  const SLIDE_COUNT = 5
  // const SLIDES = Array.from(Array(SLIDE_COUNT).keys())

  return (
    <div className={styles.page}>
      <main className={styles.main}>

        {/* Carousel con exhibiciones */}
        <div className={styles.hero}>
          <EmblaCarousel slides={exhibitionSlides} options={OPTIONS} />
          <EmblaCarousel slides={exhibitionSlides} type="exhibition" />;
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
