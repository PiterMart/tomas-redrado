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
  const [exhibitions, setExhibitions] = useState([]);

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
      setExhibitions(exhibitionsData);
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

  const exhibitionSlides = exhibitions.map((exhibition) => ({
    name: exhibition.name,
    image: exhibition.gallery[0]?.url || "/placeholder.jpg", // Fallback si no hay imagen
    openingDate: exhibition.openingDate,
    closingDate: exhibition.closingDate,
    slug: exhibition.slug,
    sedeSlug: headquarters.find((hq) => hq.exhibitions.includes(exhibition.id))?.slug,
  }));

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.exhibitions_page}>
          {/* <h1>Exhibitions</h1> */}
          <section>
            <p className={styles.title}>Current Exhibitions</p>
            <EmblaCarousel slides={exhibitionSlides} type="exhibition" />
            <div style={{display: "flex", flexDirection: 'row', gap: '2rem',}}>
              {currentExhibitions.length > 0 ? (
                currentExhibitions.map((exhibition) => (
                  <div key={exhibition.id} className={styles.exhibition}>
                    <Link href={`/headquarters/${exhibition.sede}/${exhibition.slug}`}>
                      <img
                        className={styles.embla__slide__img}
                        src={exhibition.gallery[0].url}
                        alt={exhibition.name}
                        style={{maxHeight: "30vh"}}
                      />
                      <h3>{exhibition.name}</h3>
                    </Link>
                  </div>
                ))
              ) : (
                <p>No current exhibitions.</p>
              )}
            </div>
          </section>
          <section>
          <p className={styles.title}>Past Exhibitions</p>
            <div style={{display: "flex", flexDirection: 'row', gap: '2rem', overflow: 'hidden'}}>
              {pastExhibitions.length > 0 ? (
                pastExhibitions.map((exhibition) => (
                  <div key={exhibition.id} className={styles.exhibition}>
                    <Link href={`/headquarters/${exhibition.sede}/${exhibition.slug}`}>
                      <img
                        className={styles.embla__slide__img}
                        src={exhibition.gallery[0].url}
                        alt={exhibition.name}
                        style={{maxHeight: "30vh"}}
                      />
                      <h3>{exhibition.name}</h3>
                    </Link>
                  </div>
                ))
              ) : (
                <p>No past exhibitions.</p>
              )}
            </div>
          </section>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
