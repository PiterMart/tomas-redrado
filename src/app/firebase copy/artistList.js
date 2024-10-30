"use client";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import EditArtistForm from "./EditArtistForm"; // Import the EditArtistForm component

export default function ArtistList() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);

  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null); // Store selected artist for editing

  // Fetch artists from Firestore
  useEffect(() => {
    async function fetchArtists() {
      try {
        const querySnapshot = await getDocs(collection(firestore, "artistas"));
        const artistsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setArtists(artistsData);
      } catch (error) {
        console.error("Error fetching artists:", error);
      }
    }

    fetchArtists();
  }, []);

  // Render artist details and select for editing
  const handleEditClick = (artist) => {
    setSelectedArtist(artist); // Set the selected artist for editing
  };

  return (
    <div>
      <h1>Artists</h1>
      <ul>
        {artists.map((artist) => (
          <li key={artist.id}>
            <h2>{artist.nombre}</h2>
            <p>{artist.bio}</p>
            <p><a href={artist.web} target="_blank" rel="noopener noreferrer">{artist.web}</a></p>
            {artist.profilePicture && (
              <img src={artist.profilePicture} alt={`${artist.nombre}'s profile`} width="100" />
            )}
            <h3>Gallery</h3>
            <div>
              {artist.obras.map((obra, index) => (
                <div key={index}>
                  <img src={obra.url} alt={`Gallery image ${index + 1}`} width="100" />
                  <p>{obra.description}</p>
                </div>
              ))}
            </div>
            <button onClick={() => handleEditClick(artist)}>Edit</button>
          </li>
        ))}
      </ul>

      {/* Display EditArtistForm if an artist is selected */}
      {selectedArtist && (
    <EditArtistForm
            artistId={selectedArtist.id}
            onClose={() => setSelectedArtist(null)} // Close form after editing
        />
        )}
    </div>
  );
}
