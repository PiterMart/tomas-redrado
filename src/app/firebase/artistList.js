"use client";

import { collection, doc, onSnapshot, getDoc } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import EditArtist from "./EditArtist";
import styles from "../styles/page.module.css";
import { firestore } from "./firebaseConfig";

function convertTimestampToYear(timestamp) {
  if (timestamp && timestamp.seconds) {
    const date = new Date(timestamp.seconds * 1000);
    return date.getFullYear().toString();
  }
  return null;
}

export default function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "artists"), async (querySnapshot) => {
      const artistsData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const artistData = doc.data();

          // // Fetch artworks by IDs
          // const artworks = await fetchArtworksByIds(artistData.artworks || []);

          return {
            id: doc.id,
            display: false,
            ...artistData,
            birthDate: convertTimestampToYear(artistData.birthDate),
          };
        })
      );

      artistsData.sort((a, b) => a.name.localeCompare(b.nombre));
      setArtists(artistsData);
    });

    return () => unsubscribe();
  }, []);

  const toggleDisplay = (id) => {
    setArtists((prevArtists) =>
      prevArtists.map((artist) =>
        artist.id === id ? { ...artist, display: !artist.display } : artist
      )
    );
  };

  useEffect(() => {
    if (!artists.some((artist) => artist.id === selectedArtist?.id)) {
      setSelectedArtist(null);
    }
  }, [artists]);

  return (
    <div className={styles.artist_list}>
      {selectedArtist ? (
        <EditArtist
          artistId={selectedArtist.id}
          onClose={() => setSelectedArtist(null)}
        />
      ) : (
        <ul>
          {artists.map((artist) => (
            <li key={artist.id}>
              <h2>{artist.name}</h2>
              <button onClick={() => toggleDisplay(artist.id)}>
                {artist.display ? "Hide Details" : "Show Details"}
              </button>
              {artist.display && (
                <div className={styles.artist_list_information}>
                  {artist.profilePicture && (
                    <img
                      src={artist.profilePicture}
                      alt={`${artist.name}'s profile`}
                      width="100"
                    />
                  )}
                  <div>
                    <h2>{artist.origin}</h2>
                    <h2>{artist.birthDate}</h2>
                    <p>{artist.manifesto}</p>
                    <p>BIO</p>
                    {artist.bio.map((paragraph, index) => (
                      <div key={index}>
                        <p>{paragraph}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setSelectedArtist(artist)}>Edit</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
