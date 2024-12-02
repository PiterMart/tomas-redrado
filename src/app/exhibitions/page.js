"use client";
import styles from "../styles/page.module.css";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import EmblaCarousel from "../carousel/EmblaCarousel";

export default function Exhibitions() {
  const [currentExhibitions, setCurrentExhibitions] = useState([]);
  const [pastExhibitions, setPastExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExhibitions = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "exhibitions"));
      const exhibitions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        exhibitions.push({ id: doc.id, ...data });
      });

      const now = new Date();
      const current = exhibitions.filter(
        (exhibition) => new Date(exhibition.closingDate.toDate()) >= now
      );
      const past = exhibitions.filter(
        (exhibition) => new Date(exhibition.closingDate.toDate()) < now
      );

      setCurrentExhibitions(current);
      setPastExhibitions(past);
    } catch (error) {
      console.error("Error fetching exhibitions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExhibitions();
  }, []);

  if (loading) return <p>Loading exhibitions...</p>;

  // Create separate slide arrays for current and past exhibitions
  const currentExhibitionSlides = currentExhibitions.map((exhibition) => ({
    name: exhibition.name,
    image: exhibition.gallery?.[0]?.url || "/placeholder.jpg",
    openingDate: exhibition.openingDate?.toDate().toLocaleDateString() || "N/A",
    closingDate: exhibition.closingDate?.toDate().toLocaleDateString() || "N/A",
    slug: exhibition.slug || "",
  }));

  const pastExhibitionSlides = pastExhibitions.map((exhibition) => ({
    name: exhibition.name,
    image: exhibition.gallery?.[0]?.url || "/placeholder.jpg",
    openingDate: exhibition.openingDate?.toDate().toLocaleDateString() || "N/A",
    closingDate: exhibition.closingDate?.toDate().toLocaleDateString() || "N/A",
    slug: exhibition.slug || "",
  }));

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.exhibitions_page}>
          <section>
            <p className={styles.title}>Current Exhibitions</p>
            {currentExhibitionSlides.length > 0 ? (
              <EmblaCarousel slides={currentExhibitionSlides} type="exhibitionSimple" />
            ) : (
              <p>No current exhibitions taking place.</p>
            )}
          </section>
          <section>
            <p className={styles.title}>Past Exhibitions</p>
            {pastExhibitionSlides.length > 0 ? (
              <EmblaCarousel slides={pastExhibitionSlides} type="exhibitionSimple" />
            ) : (
              <p>No past exhibitions available.</p>
            )}
          </section>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
