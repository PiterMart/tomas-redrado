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
    bio: [],
    web: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [obras, setObras] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [cvFile, setCvFile] = useState(null); // State for CV file
  const [newBioParagraph, setNewBioParagraph] = useState(""); // State for new bio paragraph

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
    setProfilePicturePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setObras(files);

    const previewURLs = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previewURLs);
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    setCvFile(file);
  };

  const handleDescriptionChange = (index, value) => {
    const updatedDescriptions = [...descriptions];
    updatedDescriptions[index] = value;
    setDescriptions(updatedDescriptions);
  };

  const handleBioParagraphChange = (e) => {
    setNewBioParagraph(e.target.value);
  };

  const addBioParagraph = () => {
    if (newBioParagraph) {
      setFormData((prevData) => ({
        ...prevData,
        bio: [...prevData.bio, newBioParagraph],
      }));
      setNewBioParagraph(""); // Clear the input after adding
    }
  };

  const uploadProfilePicture = async (artistSlug) => {
    if (!profilePicture) return null;
    const profilePicRef = ref(storage, `${artistSlug}/profilePicture/${artistSlug}_profilePicture`);
    await uploadBytes(profilePicRef, profilePicture);
    return await getDownloadURL(profilePicRef);
  };

  const uploadImages = async (artistSlug) => {
    const galleryData = [];
    for (let i = 0; i < obras.length; i++) {
      const imageFile = obras[i];
      const description = descriptions[i] || "";
      const customFileName = `${artistSlug}_${i}`; // Use the slug here
      const imageRef = ref(storage, `${artistSlug}/gallery/${customFileName}`);
      await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(imageRef);
      galleryData.push({ url: downloadURL, description });
    }
    return galleryData;
  };

  const uploadCv = async (artistSlug) => {
    if (!cvFile) return null;
    const cvRef = ref(storage, `${artistSlug}/cv/${artistSlug}_CV.pdf`);
    await uploadBytes(cvRef, cvFile);
    return await getDownloadURL(cvRef);
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens from start and end
  };

  async function addNewArtist() {
    try {
      const { nombre } = formData;
      const slug = generateSlug(nombre); // Generate slug from the artist's name
      const profilePicURL = await uploadProfilePicture(slug);
      const galleryData = await uploadImages(slug);
      const cvURL = await uploadCv(slug);

      const newArtist = await addDoc(artistsCollection, {
        ...formData,
        slug, // Add the slug to the artist document
        profilePicture: profilePicURL,
        obras: galleryData,
        cv: cvURL,
      });

      console.log(`Document created at ${newArtist.path}`);

      // Reset form data
      setFormData({ bio: [], nombre: "", web: "" });
      setProfilePicture(null);
      setProfilePicturePreview(null);
      setObras([]);
      setDescriptions([]);
      setPreviewImages([]);
      setCvFile(null);
      setNewBioParagraph(""); // Reset new paragraph input
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }

  return (
    <div className={styles.form}>
      {/* Profile picture input and preview */}
      <div className={styles.profilePictureContainer}>
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
        <p>FOTO DE PERFIL</p>
      </div>

      <input
        name="nombre"
        placeholder="Nombre"
        value={formData.nombre}
        onChange={handleChange}
      />

      {/* Bio Paragraphs Input */}
      <div>
        <textarea
          placeholder="Add a paragraph to your bio"
          value={newBioParagraph}
          onChange={handleBioParagraphChange}
        />
        <button onClick={addBioParagraph}>Add Bio Paragraph</button>
      </div>
      <div>
        {formData.bio.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <input
        name="web"
        placeholder="Website"
        value={formData.web}
        onChange={handleChange}
      />

      {/* CV file input */}
      <p>CV (PDF)</p>
      <input type="file" name="cv" accept=".pdf" onChange={handleCvChange} />

      {/* Gallery images input with previews and description inputs */}
      <p>Obras</p>
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
