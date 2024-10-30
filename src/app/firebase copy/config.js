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

  // States to handle file inputs and descriptions
  const [profilePicture, setProfilePicture] = useState(null); // Single profile picture
  const [obras, setObras] = useState([]); // Multiple images
  const [descriptions, setDescriptions] = useState([]); // Descriptions for each gallery image

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

  // Handle description input for each gallery image
  const handleDescriptionChange = (index, value) => {
    const updatedDescriptions = [...descriptions];
    updatedDescriptions[index] = value;
    setDescriptions(updatedDescriptions);
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

  // Upload gallery images to Firebase Storage and get their URLs with descriptions
  const uploadImages = async (artistName) => {
    const galleryData = []; // Array to store objects with image URLs and descriptions

    for (let i = 0; i < obras.length; i++) {
      const imageFile = obras[i];
      const description = descriptions[i] || ""; // Get corresponding description or an empty string

      // Create custom filename: artistName_0, artistName_1, etc.
      const customFileName = `${artistName}_${i}`;

      // Reference in Firebase Storage with the custom filename under the gallery folder
      const imageRef = ref(storage, `${artistName}/gallery/${customFileName}`);

      // Upload file to Firebase Storage
      await uploadBytes(imageRef, imageFile);

      // Get download URL
      const downloadURL = await getDownloadURL(imageRef);

      // Add image URL and description to the gallery data array
      galleryData.push({ url: downloadURL, description });
    }
    return galleryData; // Return array of objects with URLs and descriptions
  };

  // Function to upload new artist data to Firestore
  async function addNewArtist() {
    try {
      const { nombre } = formData;

      // First, upload profile picture
      const profilePicURL = await uploadProfilePicture(nombre);

      // Then, upload gallery images with descriptions
      const galleryData = await uploadImages(nombre);

      // Save the artist data along with the profile picture and gallery data in Firestore
      const newArtist = await addDoc(artistsCollection, {
        ...formData,
        profilePicture: profilePicURL, // Save the profile picture URL
        obras: galleryData, // Save the gallery data (URLs and descriptions)
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
      setDescriptions([]); // Clear descriptions
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
      {/* Description inputs for each selected gallery image */}
      {Array.from(obras).map((file, index) => (
        <div key={index}>
          <label>{file.name}</label> {/* Display the file name */}
          <input
            type="text"
            placeholder={`Description for ${file.name}`}
            value={descriptions[index] || ""}
            onChange={(e) => handleDescriptionChange(index, e.target.value)}
          />
        </div>
      ))}
      <button onClick={addNewArtist}>Upload</button>
    </div>
  );
}
