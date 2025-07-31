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

  const fetchHeadquartersData = async () => {
    try {
      const q = query(collection(firestore, "headquarters"), where("slug", "==", headquarterSlug));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // FIX: Get the full document snapshot, not just the data()
        const docSnap = querySnapshot.docs[0];
        const headquartersData = docSnap.data();

        // FIX: Set state including the ID, just like the old working code
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

  if (headquarters === null) return <p>Loading headquarters data...</p>;
  if (!headquarters) return <p>No headquarters found.</p>;

  const exhibitionSlides = exhibitions.map((exhibition) => {
    console.log('Exhibition data:', exhibition); // Debug log
    return {
      name: exhibition.name,
      // FIX: Added banner property that ExhibitionLayout expects
      banner: exhibition.banner,
      image: exhibition.gallery[0]?.url || "/placeholder.jpg",
      openingDate: exhibition.openingDate,
      closingDate: exhibition.closingDate,
      slug: exhibition.slug,
      headquarterSlug: headquarters.slug,
    };
  });
  
  const aboutContent = headquarters.aboutEng || headquarters.about;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.artist_page} style={{ padding: "1rem", marginTop: '5rem' }}>
          <div className={styles.page_container}>
            <img src={headquarters.image} alt={headquarters.name} style={{ width: "100%" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h1 className={styles.title}>{headquarters.name}</h1>
              {/* ... other details ... */}
            </div>
            
            {aboutContent && (
              <div style={{display: 'flex', flexDirection: 'column', gap: "1rem"}}>
                <p className={styles.title}>About</p>
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

            {headquarters.residencyProgram && (
              <div style={{display: 'flex', flexDirection: 'column', gap: "1rem"}}>
                <p className={styles.title}>Residency Program</p>

                {/* FIX 2: Added missing code block to render the description */}
                {headquarters.residencyProgram.description && (
                  <div>
                    {(headquarters.residencyProgram.description.en || headquarters.residencyProgram.description.es).map((paragraph, index) => (
                      <p key={index} style={{textAlign: 'justify', lineHeight: '1.3rem', marginBottom: '1rem'}}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}

                {/* Residency Schedule */}
                {headquarters.residencyProgram.schedule && (
                  <div style={{marginTop: '1rem'}}>
                    {Object.keys(headquarters.residencyProgram.schedule).sort().map(year => (
                      <div key={year} style={{marginBottom: '1.5rem'}}>
                        <h3 style={{fontSize: '1.5rem', fontWeight: '500'}}>{`Program ${year}`}</h3>
                        <ul style={{ listStyle: 'none', paddingLeft: '0', marginTop: '1rem' }}>
                          {headquarters.residencyProgram.schedule[year].map((slot, index) => (
                            <li key={index} style={{ marginBottom: '0.5rem', display: 'flex' }}>
                              <span style={{ width: '100px', fontWeight: 'bold' }}>
                                {slot.month.en || slot.month.es}:
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