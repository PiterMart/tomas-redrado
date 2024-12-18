"use client";
import styles from "../styles/page.module.css";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import EmblaCarousel from "../carousel/EmblaCarousel";

export default function Exhibitions() {
  const [upcomingExhibitions, setUpcomingExhibitions] = useState([]);
  const [currentExhibitions, setCurrentExhibitions] = useState([]);
  const [pastExhibitions, setPastExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headquarters, setHeadquarters] = useState([]);

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

  const fetchExhibitions = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "exhibitions"));
      const exhibitions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        exhibitions.push({ id: doc.id, ...data });
      });

      const now = new Date();

      // Filter exhibitions
      const upcoming = exhibitions.filter(
        (exhibition) => new Date(exhibition.openingDate.toDate()) > now
      );
      const current = exhibitions.filter(
        (exhibition) =>
          new Date(exhibition.openingDate.toDate()) <= now &&
          new Date(exhibition.closingDate.toDate()) >= now
      );
      const past = exhibitions.filter(
        (exhibition) => new Date(exhibition.closingDate.toDate()) < now
      );

      setUpcomingExhibitions(upcoming);
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

  // Create slides for each category
  const createSlides = (exhibitions) =>
    exhibitions.map((exhibition) => ({
      name: exhibition.name,
      image: exhibition.gallery[0]?.url || "/placeholder.jpg", // Fallback si no hay imagen
      openingDate: exhibition.openingDate,
      closingDate: exhibition.closingDate,
      slug: exhibition.slug,
      banner: exhibition.banner,
      headquarterSlug: headquarters.find((hq) => hq.exhibitions.includes(exhibition.id))?.name,
    }));

  const upcomingExhibitionSlides = createSlides(upcomingExhibitions);
  const currentExhibitionSlides = createSlides(currentExhibitions);
  const pastExhibitionSlides = createSlides(pastExhibitions);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.exhibitions_page}>
          {upcomingExhibitionSlides.length > 0 && (
            <section>
              <p className={styles.title}>Upcoming Exhibitions</p>
              <EmblaCarousel slides={upcomingExhibitionSlides} type="exhibitionSimple" />
            </section>
          )}

          {currentExhibitionSlides.length > 0 && (
            <section>
              <p className={styles.title}>Current Exhibitions</p>
              <EmblaCarousel slides={currentExhibitionSlides} type="exhibitionSimple" />
            </section>
          )}

          {pastExhibitionSlides.length > 0 && (
            <section>
              <p className={styles.title}>Past Exhibitions</p>
              <EmblaCarousel slides={pastExhibitionSlides} type="exhibitionSimple" />
            </section>
          )}
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
