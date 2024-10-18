"use client";
import { initializeApp } from "firebase/app";
import { getFirestore, addDoc, collection } from "firebase/firestore";
import styles from "../styles/page.module.css";
import React, { useState } from "react";

export default function ArtistForm() {
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
  const firestore = getFirestore();

  // Reference to the artists collection
  const artistsCollection = collection(firestore, "artistas");

  // State to hold form inputs
  const [formData, setFormData] = useState({
    bio: "",
    nombre: "",
    obras: "",
    web: "",
  });

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Function to upload new artist
  async function addNewArtist() {
    try {
      const newArtist = await addDoc(artistsCollection, formData);
      console.log(`Document created at ${newArtist.path}`);
  
      // Clear form after successful submission
      setFormData({
        bio: "",
        nombre: "",
        obras: "",
        web: "",
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }
  return (
    <div className={styles.form}>
      <input
        name="bio"
        placeholder="Bio"
        value={formData.bio}
        onChange={handleChange}
      />
      <input
        name="nombre"
        placeholder="Nombre"
        value={formData.nombre}
        onChange={handleChange}
      />
      <input
        name="obras"
        placeholder="Obras"
        value={formData.obras}
        onChange={handleChange}
      />
      <input
        name="web"
        placeholder="Website"
        value={formData.web}
        onChange={handleChange}
      />
      <button onClick={addNewArtist}>Upload</button>
    </div>
  );
}
