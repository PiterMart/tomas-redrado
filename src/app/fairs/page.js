"use client";
import styles from "../styles/page.module.css";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import EmblaCarousel from "../carousel/EmblaCarousel";

export default function Fairs() {
  const [currentFairs, setCurrentFairs] = useState([]);
  const [pastFairs, setPastFairs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFairs = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "fairs"));
      const fairsData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fairsData.push({ id: doc.id, ...data });
      });

      const now = new Date();
      const current = fairsData.filter(
        (fair) => new Date(fair.closingDate.toDate()) >= now
      );
      const past = fairsData.filter(
        (fair) => new Date(fair.closingDate.toDate()) < now
      );

      setCurrentFairs(current);
      setPastFairs(past);
    } catch (error) {
      console.error("Error fetching fairs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFairs();
  }, []);

  if (loading) return <p>Loading fairs...</p>;

  // Slides for current and past fairs
  const currentFairSlides = currentFairs.map((fair) => ({
    name: fair.name,
    image: fair.gallery?.[0]?.url || "/placeholder.jpg",
    openingDate: fair.openingDate?.toDate().toLocaleDateString() || "N/A",
    closingDate: fair.closingDate?.toDate().toLocaleDateString() || "N/A",
    slug: fair.slug,
    location: fair.location,
  }));

  const pastFairSlides = pastFairs.map((fair) => ({
    name: fair.name,
    image: fair.gallery?.[0]?.url || "/placeholder.jpg",
    openingDate: fair.openingDate?.toDate().toLocaleDateString() || "N/A",
    closingDate: fair.closingDate?.toDate().toLocaleDateString() || "N/A",
    slug: fair.slug,
    location: fair.location,
  }));

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.exhibitions_page}>
          {/* Current Fairs Section */}
          <section>
            <p className={styles.title}>Current Fairs</p>
            {currentFairSlides.length > 0 ? (
              <EmblaCarousel slides={currentFairSlides} type="fair" />
            ) : (
              <p>No current fairs available.</p>
            )}
          </section>

          {/* Past Fairs Section */}
          <section>
            <p className={styles.title}>Past Fairs</p>
            {pastFairSlides.length > 0 ? (
              <EmblaCarousel slides={pastFairSlides} type="fair" />
            ) : (
              <p>No past fairs available.</p>
            )}
          </section>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
