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
        const headquartersSnapshot = await getDocs(collection(firestore, "sedes"));
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
        <div className={styles.page_container} style={{marginTop: '6rem'}}>
          <p className={styles.title}>HEADQUARTERS</p>
          <div>
            {headquarters.map((hq) => (
              <div key={hq.id}>
                <div className={styles.sedes}>
                <Link href={`/headquarters/${hq.slug}`} key={hq.id}>
                  <div className={styles.sedes}>
                    <div className={styles.sedeCard}>
                      <div className={styles2.embla__slide__text} style={{ height: 'auto', width: 'auto', paddingRight: '4rem' }}>
                        <p>{hq.name}</p>
                      </div>
                      {/* <div className={styles2.embla__slide} style={{ width: '50%', height: 'auto' }}>
                        <img
                          src={hq.image}
                          alt={hq.name}
                        />
                      </div> */}
                    </div>
                  </div>
                </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
