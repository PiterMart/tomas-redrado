"use client";
import { collection, getDocs } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import EditArtistForm from "./EditArtistForm";
import styles from "../styles/page.module.css";
import { firestore } from "./firebaseConfig";

export default function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);

  // Fetch artists from Firestore
  useEffect(() => {
    async function fetchArtists() {
      try {
        const querySnapshot = await getDocs(collection(firestore, "artistas"));
        const artistsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          display: false,
          ...doc.data(),
        }));

        artistsData.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setArtists(artistsData);
      } catch (error) {
        console.error("Error fetching artists:", error);
      }
    }

    fetchArtists();
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

  return (
    <div className={styles.artist_list}>
      <ul>
        {artists.map((artist) => (
          <li key={artist.id}>
            <h2>{artist.nombre}</h2>
            <button onClick={() => toggleDisplay(artist.id)}>
              {artist.display ? "Hide Details" : "Show Details"}
            </button>
            {artist.display && (
              <div className={styles.artist_list_information}>
                {artist.profilePicture && (
                  <img src={artist.profilePicture} alt={`${artist.nombre}'s profile`} width="100" />
                )}
                <div>
                {artist.bio.map((paragraph, index) => (
                  <div key={index}>
                    <p>{paragraph}</p>
                  </div>
                ))}
              </div>
                <p><a href={artist.web} target="_blank" rel="noopener noreferrer">{artist.web}</a></p>
                <p><a href={artist.cv} target="_blank"> CV</a></p>
                <h3>Gallery</h3>
                <div>
                  {artist.obras.map((obra, index) => (
                    <div key={index}>
                      <img src={obra.url} alt={`Gallery image ${index + 1}`} width="100" />
                      <p>{obra.description}</p>
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
        <EditArtistForm
          artistId={selectedArtist.id}
          onClose={() => setSelectedArtist(null)}
        />
      )}
    </div>
  );
}
