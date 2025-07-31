"use client";
import styles from "../../styles/page.module.css";
import Link from "next/link";
import { firestore } from "../../firebase/firebaseConfig";
import { query, collection, where, getDocs, documentId } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import EmblaCarousel from "@/app/carousel/EmblaCarousel";
import { motion } from "framer-motion";

export default function Headquarter({ params }) {
  const { headquarter: headquarterSlug } = params;
  const [headquarters, setHeadquarters] = useState(null);
  const [exhibitions, setExhibitions] = useState([]);
  const [exhibitionIds, setExhibitionIds] = useState([]);
  const [residencyArtists, setResidencyArtists] = useState({});
  
  // NEW: State to manage the current language ('en' or 'es')
  const [lang, setLang] = useState('en');

  const fetchHeadquartersData = async () => {
    try {
      const q = query(collection(firestore, "headquarters"), where("slug", "==", headquarterSlug));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const headquartersData = docSnap.data();
        setHeadquarters({ id: docSnap.id, ...headquartersData });
        setExhibitionIds(headquartersData.exhibitions || []);
        
        if (headquartersData.residencyProgram?.schedule) {
          const artistIdsToFetch = [];
          const schedule = headquartersData.residencyProgram.schedule;
          Object.keys(schedule).forEach(year => {
            schedule[year].forEach(slot => {
              slot.artists.forEach(artist => {
                if (artist.artistId) {
                  artistIdsToFetch.push(artist.artistId);
                }
              });
            });
          });

          if (artistIdsToFetch.length > 0) {
            fetchArtistsByIds(artistIdsToFetch);
          }
        }
      } else {
        setHeadquarters(null);
      }
    } catch (error) {
      console.error("Error fetching headquarters:", error);
    }
  };

  const fetchArtistsByIds = async (ids) => {
    const artistsQuery = query(collection(firestore, "artists"), where(documentId(), "in", ids));
    const artistsSnapshot = await getDocs(artistsQuery);
    const artistsData = {};
    artistsSnapshot.docs.forEach(doc => {
      artistsData[doc.id] = { id: doc.id, ...doc.data() };
    });
    setResidencyArtists(artistsData);
  };

  const fetchExhibitions = async () => {
    if (exhibitionIds.length === 0) return;
    try {
      const exhibitionsSnapshot = await getDocs(
        query(collection(firestore, "exhibitions"), where(documentId(), "in", exhibitionIds))
      );
      const exhibitionsData = exhibitionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExhibitions(exhibitionsData);
    } catch (error) {
      console.error("Error fetching exhibitions:", error);
    }
  };

  useEffect(() => {
    if (headquarterSlug) {
      fetchHeadquartersData();
    }
  }, [headquarterSlug]);

  useEffect(() => {
    if (exhibitionIds.length > 0) {
      fetchExhibitions();
    }
  }, [exhibitionIds]);

  // NEW: Function to toggle the language state
  const toggleLanguage = () => {
    setLang(prevLang => (prevLang === 'en' ? 'es' : 'en'));
  };

  if (headquarters === null) return <p>Loading headquarters data...</p>;
  if (!headquarters) return <p>No headquarters found.</p>;

  const exhibitionSlides = exhibitions.map((exhibition) => ({
    // FIX: Add the unique ID for each slide, which the carousel needs
    id: exhibition.id,
    name: exhibition.name,
    banner: exhibition.banner,
    image: exhibition.gallery[0]?.url || "/placeholder.jpg",
    openingDate: exhibition.openingDate,
    closingDate: exhibition.closingDate,
    slug: exhibition.slug,
    headquarterSlug: headquarters.slug,
  }));
  
  // UPDATED: Dynamically get 'about' content based on language state
  const aboutContent = lang === 'en' ? headquarters.aboutEng : headquarters.about;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.artist_page} style={{ padding: "1rem", marginTop: '5rem' }}>
          <div className={styles.page_container}>
            <img src={headquarters.image} alt={headquarters.name} style={{ width: "100%" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h1 className={styles.title}>{headquarters.name}</h1>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <p>{headquarters.type}</p>
                <p>{headquarters.location}</p>
                <p>{headquarters.phone}</p>
              </div>
            </div>
            
            {/* NEW: Language toggle button */}
            <div style={{margin: '2rem 0'}}>
                <button onClick={toggleLanguage} className={styles.language_button}>
                    {lang === 'en' ? 'Ver en Español' : 'View in English'}
                </button>
            </div>

            {/* UPDATED: About section with dynamic title */}
            {aboutContent && (
              <div style={{display: 'flex', flexDirection: 'column', gap: "1rem"}}>
                <p className={styles.title}>{lang === 'en' ? 'About' : 'About'}</p>
                {Array.isArray(aboutContent) ? (
                  aboutContent.map((paragraph, index) => (
                    <p key={index} style={{textAlign: 'justify', lineHeight: '1.3rem'}}>
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p style={{textAlign: 'justify', lineHeight: '1.3rem'}}>{aboutContent}</p>
                )}
              </div>
            )}
            
            {/* NEW: Gallery Program section */}
            {headquarters.galleryProgram?.[lang] && (
                <div style={{display: 'flex', flexDirection: 'column', gap: "1rem"}}>
                    <p className={styles.title}>{lang === 'en' ? 'Gallery Program' : 'Sobre la Galería'}</p>
                    <p style={{textAlign: 'justify', lineHeight: '1.3rem'}}>{headquarters.galleryProgram[lang]}</p>
                </div>
            )}

            {/* UPDATED: Residency Program section with dynamic titles and content */}
            {headquarters.residencyProgram && (
              <div style={{display: 'flex', flexDirection: 'column', gap: "1rem"}}>
                <p className={styles.title}>{lang === 'en' ? 'Residency Program' : 'Sobre la Residencia'}</p>

                {headquarters.residencyProgram.description?.[lang] && (
                  <div>
                    {headquarters.residencyProgram.description[lang].map((paragraph, index) => (
                      <p key={index} style={{textAlign: 'justify', lineHeight: '1.3rem', marginBottom: '1rem'}}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}

                {headquarters.residencyProgram.schedule && (
                  <div style={{marginTop: '1rem'}}>
                    {Object.keys(headquarters.residencyProgram.schedule).sort().map(year => (
                      <div key={year} style={{marginBottom: '1.5rem'}}>
                        <h3 style={{fontSize: '1.5rem', fontWeight: '500'}}>{`Program ${year}`}</h3>
                        <ul style={{ listStyle: 'none', paddingLeft: '0', marginTop: '1rem' }}>
                          {headquarters.residencyProgram.schedule[year].map((slot, index) => (
                            <li key={index} style={{ marginBottom: '0.5rem', display: 'flex' }}>
                              <span style={{ width: '100px', fontWeight: 'bold' }}>
                                {slot.month[lang]}:
                              </span>
                              <span>
                                {slot.artists.map((artist, artistIndex) => {
                                  const fetchedArtist = residencyArtists[artist.artistId];
                                  return (
                                    <React.Fragment key={artistIndex}>
                                      {fetchedArtist ? (
                                        <Link href={`/artists/${fetchedArtist.slug}`} className={styles.artist_link}>
                                          {artist.name}
                                        </Link>
                                      ) : (
                                        <span>{artist.name}</span>
                                      )}
                                      {artistIndex < slot.artists.length - 1 && ' & '}
                                    </React.Fragment>
                                  );
                                })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {exhibitionSlides.length > 0 && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <p className={styles.title}>EXHIBITIONS</p>
                <EmblaCarousel slides={exhibitionSlides} type="exhibition" />
              </div>
            )}
            
          </div>
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}