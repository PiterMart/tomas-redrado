"use client";
import styles from "../styles/page.module.css";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Link from "next/link";

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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.exhibitions_page} style={{ padding: "1.5rem" }}>
          {/* <h1>Exhibitions</h1> */}
          <section>
            <h2>Current Exhibitions</h2>
            {currentExhibitions.length > 0 ? (
              currentExhibitions.map((exhibition) => (
                <div key={exhibition.id} className={styles.exhibition}>
                  <img
                    className={styles.embla__slide__img}
                    src={exhibition.gallery[0].url}
                    alt={exhibition.name}
                    style={{maxHeight: "30vh"}}
                  />
                  <h3>{exhibition.name}</h3>
                  <p>{exhibition.description}</p>
                  <Link href={`/headquarters/${exhibition.sede}/${exhibition.slug}`}>
                    View Exhibition
                  </Link>
                </div>
              ))
            ) : (
              <p>No current exhibitions.</p>
            )}
          </section>
          <section>
            <h2>Past Exhibitions</h2>
            {pastExhibitions.length > 0 ? (
              pastExhibitions.map((exhibition) => (
                <div key={exhibition.id} className={styles.exhibition}>
                  <img
                    className={styles.embla__slide__img}
                    src={exhibition.gallery[0].url}
                    alt={exhibition.name}
                    style={{maxHeight: "30vh"}}
                  />
                  <h3>{exhibition.name}</h3>
                  <p>{exhibition.description}</p>
                  <Link href={`/exhibiciones/${exhibition.slug}`}>
                    View Exhibition
                  </Link>
                </div>
              ))
            ) : (
              <p>No past exhibitions.</p>
            )}
          </section>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
