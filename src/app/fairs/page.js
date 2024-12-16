"use client";
import styles from "../styles/page.module.css";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import EmblaCarousel from "../carousel/EmblaCarousel";

export default function Fairs() {
  const [upcomingFairs, setUpcomingFairs] = useState([]);
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

      // Filter fairs into categories
      const upcoming = fairsData.filter(
        (fair) => new Date(fair.openingDate.toDate()) > now
      );
      const current = fairsData.filter(
        (fair) =>
          new Date(fair.openingDate.toDate()) <= now &&
          new Date(fair.closingDate.toDate()) >= now
      );
      const past = fairsData.filter(
        (fair) => new Date(fair.closingDate.toDate()) < now
      );

      setUpcomingFairs(upcoming);
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

  // Helper function to create slides
  const createSlides = (fairs) =>
    fairs.map((fair) => ({
      name: fair.name,
      image: fair.gallery?.[0]?.url || "/placeholder.jpg",
      openingDate: fair.openingDate,
      closingDate: fair.closingDate,
      slug: fair.slug,
      location: fair.location,
    }));

  const upcomingFairSlides = createSlides(upcomingFairs);
  const currentFairSlides = createSlides(currentFairs);
  const pastFairSlides = createSlides(pastFairs);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.exhibitions_page}>
          {/* Upcoming Fairs Section */}
          {upcomingFairSlides.length > 0 && (
            <section>
              <p className={styles.title}>Upcoming Fairs</p>
              <EmblaCarousel slides={upcomingFairSlides} type="fair" />
            </section>
          )}

          {/* Current Fairs Section */}
          {currentFairSlides.length > 0 && (
            <section>
              <p className={styles.title}>Current Fairs</p>
              <EmblaCarousel slides={currentFairSlides} type="fair" />
            </section>
          )}

          {/* Past Fairs Section */}
          {pastFairSlides.length > 0 && (
            <section>
              <p className={styles.title}>Past Fairs</p>
              <EmblaCarousel slides={pastFairSlides} type="fair" />
            </section>
          )}
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
