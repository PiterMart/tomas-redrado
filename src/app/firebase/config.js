"use client";
import { initializeApp } from "firebase/app";
import { getFirestore, addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  const storage = getStorage(app);

  // Reference to the artists collection
  const artistsCollection = collection(firestore, "artistas");

  // State to hold form inputs
  const [formData, setFormData] = useState({
    bio: "",
    nombre: "", // Artist name
    web: "",
  });

  // State to handle file inputs
  const [profilePicture, setProfilePicture] = useState(null); // Single profile picture
  const [obras, setObras] = useState([]); // Multiple images

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle file input changes
  const handleProfilePictureChange = (e) => {
    setProfilePicture(e.target.files[0]); // Single profile picture
  };

  const handleFileChange = (e) => {
    setObras(e.target.files); // Multiple selected files
  };

  // Upload profile picture to Firebase Storage
  const uploadProfilePicture = async (artistName) => {
    if (!profilePicture) return null; // Skip if no profile picture

    // Create the reference to profilePicture folder with custom filename
    const profilePicRef = ref(storage, `${artistName}/profilePicture/${artistName}_profilePicture`);

    // Upload the profile picture file
    await uploadBytes(profilePicRef, profilePicture);

    // Get the download URL
    const profilePicURL = await getDownloadURL(profilePicRef);

    return profilePicURL;
  };

  // Upload gallery images to Firebase Storage and get their URLs with custom filenames
  const uploadImages = async (artistName) => {
    const imageUrls = [];
    for (let i = 0; i < obras.length; i++) {
      const imageFile = obras[i];

      // Create custom filename: artistName_0, artistName_1, etc.
      const customFileName = `${artistName}_${i}`;

      // Reference in Firebase Storage with the custom filename under the gallery folder
      const imageRef = ref(storage, `${artistName}/gallery/${customFileName}`);

      // Upload file to Firebase Storage
      await uploadBytes(imageRef, imageFile);

      // Get download URL
      const downloadURL = await getDownloadURL(imageRef);

      // Add URL to the list
      imageUrls.push(downloadURL);
    }
    return imageUrls; // Return the array of URLs
  };

  // Function to upload new artist data to Firestore
  async function addNewArtist() {
    try {
      const { nombre } = formData;

      // First, upload profile picture
      const profilePicURL = await uploadProfilePicture(nombre);

      // Then, upload gallery images
      const imageUrls = await uploadImages(nombre);

      // Save the artist data along with the profile picture and image URLs in Firestore
      const newArtist = await addDoc(artistsCollection, {
        ...formData,
        profilePicture: profilePicURL, // Save the profile picture URL
        obras: imageUrls, // Save the gallery image URLs
      });

      console.log(`Document created at ${newArtist.path}`);

      // Clear form after successful submission
      setFormData({
        bio: "",
        nombre: "",
        web: "",
      });
      setProfilePicture(null); // Clear profile picture input
      setObras([]); // Clear gallery file input
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }

  return (
    <div className={styles.form}>
        <p>ARTIST UPLOADER</p>
        
        <input
            name="nombre"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleChange}
        />
        <input
            name="bio"
            placeholder="Bio"
            value={formData.bio}
            onChange={handleChange}
        />
      
        <input
            name="web"
            placeholder="Website"
            value={formData.web}
            onChange={handleChange}
        />
        {/* Profile picture input */}
        <input
            type="file"
            name="profilePicture"
            onChange={handleProfilePictureChange}
        />
        {/* Gallery images input */}
        <input
            type="file"
            name="obras"
            multiple // Allow multiple file selection
            onChange={handleFileChange}
        />
        <button onClick={addNewArtist}>Upload</button>
    </div>
  );
}
