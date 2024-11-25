"use client"
import { collection, onSnapshot } from "firebase/firestore";  // Use onSnapshot for real-time updates
import React, { useState, useEffect } from "react";
import EditArtist from "./EditArtist";
import styles from "../styles/page.module.css";
import { firestore } from "./firebaseConfig";

// Function to convert Firestore timestamp to year
function convertTimestampToYear(timestamp) {
  if (timestamp && timestamp.seconds) {
    const date = new Date(timestamp.seconds * 1000); // Convert seconds to milliseconds
    return date.getFullYear().toString(); // Extract the year as a string
  }
  return null;
}

export default function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);

  // Fetch artists from Firestore with real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "artists"), (querySnapshot) => {
      const artistsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        display: false,
        ...doc.data(),
      }));

      artistsData.sort((a, b) => a.name.localeCompare(b.nombre));
      setArtists(artistsData);
    });

    // Cleanup function to unsubscribe from Firestore updates when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleEditClick = (artist) => {
    setSelectedArtist(artist);
  };

  const toggleDisplay = (id) => {
    setArtists((prevArtists) =>
      prevArtists.map((artist) =>
        artist.id === id ? { ...artist, display: !artist.display } : artist
      )
    );
  };

  useEffect(() => {
    // Reset selected artist if the list of artists changes
    if (!artists.some((artist) => artist.id === selectedArtist?.id)) {
      setSelectedArtist(null);
    }
  }, [artists]);

  return (
    <div className={styles.artist_list}>
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
                    alt={`${artist.nombre}'s profile`}
                    width="100"
                  />
                )}
                <div>
                  <h2>{artist.origin}</h2>
                  {/* Use convertTimestampToYear for birthDate */}
                  <h2>{convertTimestampToYear(artist.birthDate)}</h2>
                  <p>{artist.manifesto}</p>
                  <p>BIO</p>
                  {artist.bio.map((paragraph, index) => (
                    <div key={index}>
                      <p>{paragraph}</p>
                    </div>
                  ))}
                </div>
                <p>WEB</p>
                <p>
                  <a
                    href={artist.web}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {artist.web}
                  </a>
                </p>
                <p>CV</p>
                <button>
                  <a href={artist.cv} target="_blank">
                    VIEW CV
                  </a>
                </button>
                <h3>Gallery</h3>
                <div>
                  {artist.artworks.map((artwork, index) => (
                    <div key={index}>
                      <img
                        src={artwork.url}
                        alt={`Gallery image ${index + 1}`}
                        width="100"
                      />
                      <p>{artwork.title}</p>
                      <p>{artwork.technique}</p>
                      <p>{artwork.measurement}</p>
                      <p>{artwork.date}</p>
                      <p>{artwork.extras}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => handleEditClick(artist)}>Edit</button>
          </li>
        ))}
      </ul>

      {selectedArtist && (
        <EditArtist
          artistId={selectedArtist.id}
          onClose={() => setSelectedArtist(null)}
        />
      )}
    </div>
  );
}
