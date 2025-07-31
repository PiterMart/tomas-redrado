"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "../styles/page.module.css";
import styles2 from "../styles/embla.module.css";
import Link from "next/link";
import { app, firestore, storage } from "../firebase/firebaseConfig";
import { collection, addDoc, getDocs, Timestamp, updateDoc, arrayUnion, doc } from "firebase/firestore";

export default function Home() {
  const [headquarters, setHeadquarters] = useState([]);
  const [exhibitions, setExhibitions] = useState([]); // Add state for exhibitions

  useEffect(() => {
    const fetchHeadquarters = async () => {
      try {
        const headquartersSnapshot = await getDocs(collection(firestore, "headquarters"));
        const headquartersData = headquartersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log("Headquarters Data:", headquartersData); // Log the fetched data
        setHeadquarters(headquartersData);
      } catch (error) {
        console.error("Error fetching headquarters:", error);
      }
    };

    fetchHeadquarters();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.page_container} style={{marginTop: '8rem'}}>
          <p className={styles.title}>HEADQUARTERS</p>
          <div>
                  {headquarters.map((hq) => {
                    // Render each headquarter with a unique style based on its ID
                    if (hq.id === "m6NojPmUP9L1m1YT5IXt") {
                      return (
                        <Link href={`/headquarters/${hq.slug}`} key={hq.id} style={{width: "100%"}}>
                        <div className={styles.sedes}>
                          <div className={styles.sedeCard} style={{marginTop: '1rem'}}>
                            <div style={{ height: 'auto', width: 'auto', paddingRight: '4rem', margin: 'auto' }}>
                              <p style={{fontSize: '5rem', fontWeight: '200', lineHeight: '4rem'}}>{hq.name}</p>
                              <p style={{fontSize: '1.5rem', textAlign: "end"}}>{hq.country}</p>
                              <p style={{fontSize: '1rem', textAlign: "end"}}>({hq.type})</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                      );
                    } else if (hq.id === "2qB0QydPmevqv2DOeGqX") {
                      return (
                        <Link href={`/headquarters/${hq.slug}`} key={hq.id} style={{width: "100%"}}>
                        <div className={styles.sedes}>
                          <div className={styles.sedeCard}>
                            <div style={{ height: 'auto', width: 'auto', paddingRight: '4rem', margin: 'auto' }}>
                              <p style={{fontSize: '5rem', fontWeight: '200', lineHeight: '4rem'}}>{hq.name}</p>
                              <p style={{fontSize: '1.5rem', textAlign: "end"}}>{hq.country}</p>
                              <p style={{fontSize: '1rem', textAlign: "end"}}>({hq.type})</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                      );
                    } else if (hq.id === "BW6IqbaQ9DhsgQFyL8WC") {
                      return (
                        <Link href={`/headquarters/${hq.slug}`} key={hq.id} style={{width: "100%"}}>
                        <div className={styles.sedes} >
                          <div className={styles.sedeCard} >
                            <div style={{ height: 'auto', width: 'auto', paddingRight: '4rem', margin: 'auto' }}>
                              <p style={{fontSize: '5rem', fontWeight: '200', lineHeight: '4rem'}}>{hq.name}</p>
                              <p style={{fontSize: '1.5rem', textAlign: "end"}}>{hq.country}</p>
                              <p style={{fontSize: '1rem', textAlign: "end"}}>({hq.type})</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                      );
                    } else {
                      return null; // Skip any extra items
                    }
                  })}
                </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
