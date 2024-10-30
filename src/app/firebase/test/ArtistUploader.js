"use client";
import { app, firestore, storage } from "./firebaseConfig";
import { getFirestore, addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import styles from "../styles/page.module.css";
import React, { useState } from "react";

export default function ArtistForm() {
  const artistsCollection = collection(firestore, "artistas");

  const [formData, setFormData] = useState({
    nombre: "",
    bio: "",
    web: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null); // Profile picture preview
  const [obras, setObras] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [previewImages, setPreviewImages] = useState([]); // Previews for obra images

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    setProfilePicture(file);
    setProfilePicturePreview(file ? URL.createObjectURL(file) : null); // Create preview URL
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setObras(files);

    // Generate preview URLs for each obra
    const previewURLs = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previewURLs);
  };

  const handleDescriptionChange = (index, value) => {
    const updatedDescriptions = [...descriptions];
    updatedDescriptions[index] = value;
    setDescriptions(updatedDescriptions);
  };

  const uploadProfilePicture = async (artistName) => {
    if (!profilePicture) return null;
    const profilePicRef = ref(storage, `${artistName}/profilePicture/${artistName}_profilePicture`);
    await uploadBytes(profilePicRef, profilePicture);
    const profilePicURL = await getDownloadURL(profilePicRef);
    return profilePicURL;
  };

  const uploadImages = async (artistName) => {
    const galleryData = [];
    for (let i = 0; i < obras.length; i++) {
      const imageFile = obras[i];
      const description = descriptions[i] || "";
      const customFileName = `${artistName}_${i}`;
      const imageRef = ref(storage, `${artistName}/gallery/${customFileName}`);
      await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(imageRef);
      galleryData.push({ url: downloadURL, description });
    }
    return galleryData;
  };

  async function addNewArtist() {
    try {
      const { nombre } = formData;
      const profilePicURL = await uploadProfilePicture(nombre);
      const galleryData = await uploadImages(nombre);

      const newArtist = await addDoc(artistsCollection, {
        ...formData,
        profilePicture: profilePicURL,
        obras: galleryData,
      });

      console.log(`Document created at ${newArtist.path}`);

      setFormData({ bio: "", nombre: "", web: "" });
      setProfilePicture(null);
      setProfilePicturePreview(null);
      setObras([]);
      setDescriptions([]);
      setPreviewImages([]);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }

  return (
    <div className={styles.form}>
      <p className={styles.title}>ARTIST UPLOADER</p>
      {/* Profile picture input and preview */}
      <div className={styles.profilePictureContainer}>
      <p> FOTO DE PERFIL</p>
        <input
          type="file"
          name="profilePicture"
          onChange={handleProfilePictureChange}
        />
        {profilePicturePreview && (
          <img
            src={profilePicturePreview}
            alt="Profile Preview"
            className={styles.profilePreviewImage}
          />
        )}
      </div>
      <input
        name="nombre"
        placeholder="Nombre"
        value={formData.nombre}
        onChange={handleChange}
      />
      <textarea
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

      {/* Gallery images input with previews and description inputs */}
      <p> Obras</p>
      <input
        type="file"
        name="obras"
        multiple
        onChange={handleFileChange}
      />
      {Array.from(obras).map((file, index) => (
        <div key={index} className={styles.obraContainer}>
          <label>{file.name}</label>
          <input
            type="text"
            placeholder={`Description for ${file.name}`}
            value={descriptions[index] || ""}
            onChange={(e) => handleDescriptionChange(index, e.target.value)}
          />
          {previewImages[index] && (
            <img
              src={previewImages[index]}
              alt={`Preview ${index + 1}`}
              className={styles.obraPreviewImage}
            />
          )}
        </div>
      ))}

      <button onClick={addNewArtist}>Upload</button>
    </div>
  );
}
