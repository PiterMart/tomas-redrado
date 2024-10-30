"use client";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import styles from "../styles/page.module.css";
import React, { useState, useEffect } from "react";

export default function EditArtistForm({ artistId, onClose }) { // artistId: the ID of the artist document to edit
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

  // State to hold artist data
  const [artistData, setArtistData] = useState({
    bio: "",
    nombre: "",
    web: "",
    profilePicture: "", // URL of profile picture
    obras: [], // Array of gallery image objects {url, description}
  });

  const [profilePictureFile, setProfilePictureFile] = useState(null); // New profile picture
  const [newGalleryImages, setNewGalleryImages] = useState([]); // New gallery images
  const [newDescriptions, setNewDescriptions] = useState([]); // Descriptions for new gallery images

  // Fetch artist data on component load
  useEffect(() => {
    async function fetchArtistData() {
      try {
        const docRef = doc(firestore, "artistas", artistId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setArtistData(docSnap.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    }
    if (artistId) fetchArtistData();
  }, [artistId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setArtistData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle file changes
  const handleProfilePictureChange = (e) => setProfilePictureFile(e.target.files[0]);
  const handleNewGalleryImagesChange = (e) => setNewGalleryImages(e.target.files);

  const handleNewDescriptionChange = (index, value) => {
    const updatedDescriptions = [...newDescriptions];
    updatedDescriptions[index] = value;
    setNewDescriptions(updatedDescriptions);
  };

  // Upload new profile picture
  const uploadProfilePicture = async () => {
    if (!profilePictureFile) return artistData.profilePicture; // Use the existing profile picture if not changed

    const profilePicRef = ref(storage, `${artistData.nombre}/profilePicture/${artistData.nombre}_profilePicture`);
    await uploadBytes(profilePicRef, profilePictureFile);
    return await getDownloadURL(profilePicRef);
  };

  // Upload new gallery images
  const uploadNewGalleryImages = async () => {
    const newGalleryData = [];

    for (let i = 0; i < newGalleryImages.length; i++) {
      const imageFile = newGalleryImages[i];
      const description = newDescriptions[i] || "";

      const imageRef = ref(storage, `${artistData.nombre}/gallery/${artistData.nombre}_${artistData.obras.length + i}`);
      await uploadBytes(imageRef, imageFile);

      const downloadURL = await getDownloadURL(imageRef);
      newGalleryData.push({ url: downloadURL, description });
    }

    return newGalleryData;
  };

  // Update artist data in Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const updatedProfilePicture = await uploadProfilePicture();
      const newGalleryData = await uploadNewGalleryImages();

      // Merge existing images with new ones
      const updatedObras = [...artistData.obras, ...newGalleryData];

      // Update artist data in Firestore
      await setDoc(doc(firestore, "artistas", artistId), {
        ...artistData,
        profilePicture: updatedProfilePicture,
        obras: updatedObras,
      });

      alert("Artist updated successfully!");
      onClose(); // Close the form after submission
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        name="bio"
        placeholder="Bio"
        value={artistData.bio}
        onChange={handleInputChange}
      />
      <input
        name="nombre"
        placeholder="Nombre"
        value={artistData.nombre}
        onChange={handleInputChange}
      />
      <input
        name="web"
        placeholder="Website"
        value={artistData.web}
        onChange={handleInputChange}
      />
      <label>Profile Picture:</label>
      <input
        type="file"
        name="profilePicture"
        onChange={handleProfilePictureChange}
      />
      {artistData.profilePicture && (
        <img src={artistData.profilePicture} alt="Current Profile" width="100" />
      )}

      <label>Gallery Images:</label>
      {artistData.obras.map((image, index) => (
        <div key={index}>
          <img src={image.url} alt={`Gallery image ${index + 1}`} width="100" />
          <input
            type="text"
            value={image.description}
            placeholder={`Description for ${image.url.split("/").pop()}`}
            onChange={(e) =>
              setArtistData((prevData) => {
                const updatedObras = [...prevData.obras];
                updatedObras[index] = { ...updatedObras[index], description: e.target.value };
                return { ...prevData, obras: updatedObras };
              })
            }
          />
        </div>
      ))}

      <label>New Gallery Images:</label>
      <input type="file" multiple onChange={handleNewGalleryImagesChange} />
      {Array.from(newGalleryImages).map((file, index) => (
        <div key={index}>
          <label>{file.name}</label>
          <input
            type="text"
            placeholder={`Description for ${file.name}`}
            value={newDescriptions[index] || ""}
            onChange={(e) => handleNewDescriptionChange(index, e.target.value)}
          />
        </div>
      ))}

        <button type="submit">Save Changes</button>
        <button type="button" onClick={onClose}>Cancel</button>
    </form>
  );
}
