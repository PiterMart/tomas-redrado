"use client";
import styles from "../styles/page.module.css";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Contact() {
  const [headquarters, setHeadquarters] = useState([]); // State to store all headquarters
  const [loading, setLoading] = useState(true);

  // Fetch all headquarters
  const fetchHeadquarters = async () => {
    try {
      const headquartersSnapshot = await getDocs(collection(firestore, "headquarters"));
      const headquartersData = headquartersSnapshot.docs.map((doc) => ({
        id: doc.id, // Firestore document ID
        ...doc.data(),
      }));
      setHeadquarters(headquartersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching headquarters:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeadquarters();
  }, []);

  if (loading) return <p>Loading headquarters...</p>;
  if (!headquarters.length) return <p>No headquarters found.</p>;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div style={{ padding: "10rem 1rem 1rem 1rem", margin: "auto" }}>
          <p>Director</p>
          <p className={styles.title}>Tomas Redrado</p>
          <p style={{marginTop: '1rem'}}>
            <a href="mailto:tr@tomasredrado.com">tr@tomasredrado.com</a>
          </p>
          <div className={styles.page_container} style={{ marginTop: "7rem", margin: 'auto' }}>
          {/* <p className={styles.title}>HEADQUARTERS</p> */}
          <div>
            {headquarters.map((hq) => (
              <div key={hq.id} className={styles.sedes} style={{justifyContent: 'center', gap: '1.5rem'}}>
                <Link href={`/headquarters/${hq.slug}`}>
                  <div className={styles.sedeCard}>
                    <div className={styles.sedeCardText} style={{ height: "auto", width: "auto"}}>
                      <p style={{fontSize: '3rem', fontWeight: '300'}}>{hq.name}</p>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '1rem'}}>
                        <p>{hq.location}</p>
                        <p>{hq.schedule}</p>
                        <p>{hq.phone}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
