"use client";
import { firestore, storage } from "./firebaseConfig";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import styles from "../styles/page.module.css";
import React, { useState, useRef } from "react";

export default function ArtistForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fileInputRef = useRef(null);

  const artistsCollection = collection(firestore, "artists");

  const [formData, setFormData] = useState({
    name: "",
    origin: "",
    bio: [],
    manifesto: [],
    web: "",
  });
  const [birthDate, setBirthDate] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [newArtwork, setNewArtwork] = useState({
    file: null,
    title: "",
    date: "",
    medium: "",
    measurements: "",
    description: "",
    extras: [],
  });
  const [cvFile, setCvFile] = useState(null);
  const [newExtra, setNewExtra] = useState("");
  const [newManifestoParagraph, setNewManifestoParagraph] = useState("");
  const [newBioParagraph, setNewBioParagraph] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleBirthDateChange = (e) => {
    setBirthDate(e.target.value);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    setProfilePicture(file);
    setProfilePicturePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleNewArtworkFileChange = (e) => {
    const file = e.target.files[0];
    setNewArtwork((prevArtwork) => ({
      ...prevArtwork,
      file,
    }));
  };

  const handleNewArtworkChange = (field, value) => {
    setNewArtwork((prevArtwork) => ({
      ...prevArtwork,
      [field]: value,
    }));
  };

  const addArtwork = () => {
    if (!newArtwork.file) {
      setError("Please select an artwork file before adding.");
      return;
    }
    setArtworks([...artworks, newArtwork]);
    setNewArtwork({
      file: null,
      title: "",
      date: "",
      medium: "",
      measurements: "",
      description: "",
      extras: [],
    });
    setError(null);
  };

  const handleBioParagraphChange = (e) => {
    setNewBioParagraph(e.target.value);
  };

  const addBioParagraph = () => {
    if (newBioParagraph.trim()) {
      setFormData((prevData) => ({
        ...prevData,
        bio: [...prevData.bio, newBioParagraph.trim()],
      }));
      setNewBioParagraph("");
    }
  };

  const handleManifestoParagraphChange = (e) => {
    setNewManifestoParagraph(e.target.value);
  };

  const addManifestoParagraph = () => {
    if (newManifestoParagraph.trim()) {
      setFormData((prevData) => ({
        ...prevData,
        manifesto: [...prevData.manifesto, newManifestoParagraph.trim()],
      }));
      setNewManifestoParagraph("");
    }
  };

  const uploadProfilePicture = async (artistSlug) => {
    if (!profilePicture) return null;
    const profilePicRef = ref(storage, `artists/${artistSlug}/profilePicture/${artistSlug}_profilePicture`);
    await uploadBytes(profilePicRef, profilePicture);
    return await getDownloadURL(profilePicRef);
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    setCvFile(file);
  };

  const addExtra = (index) => {
    if (newExtra.trim()) {
      handleExtraChange(index, newExtra.trim());
      setNewExtra("");
    }
  };

  const uploadImages = async (artistSlug) => {
    const galleryData = [];
    for (let i = 0; i < artworks.length; i++) {
      const { file, title, date, medium, measurements, description, extras } = artworks[i];
      const artworkId = `${artistSlug}_${String(i + 1).padStart(3, '0')}`;
      const artworkSlug = `${artworkId}-${generateSlug(title)}`;

      const imageRef = ref(storage, `artists/${artistSlug}/artworks/${artworkId}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);

      galleryData.push({
        artworkId,
        slug: artworkSlug,
        url: downloadURL,
        title,
        date,
        medium,
        measurements,
        extras,
        description,
      });
    }
    return galleryData;
  };

  const uploadCv = async (artistSlug) => {
    if (!cvFile) return null;
    const cvRef = ref(storage, `artists/${artistSlug}/cv/${artistSlug}_CV.pdf`);
    await uploadBytes(cvRef, cvFile);
    return await getDownloadURL(cvRef);
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  function resetForm() {
    setFormData({ bio: [], manifesto: [], name: "", origin: "", web: "" });
    setBirthDate("");
    setProfilePicture(null);
    setProfilePicturePreview(null);
    setArtworks([]);
    setNewArtwork({
      file: null,
      title: "",
      date: "",
      medium: "",
      measurements: "",
      description: "",
      extras: [],
    });
    setCvFile(null);
    setNewBioParagraph("");
    setNewManifestoParagraph("");
    setNewExtra("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function addNewArtist() {
    setLoading(true);
    setError(null);

    try {
      const { name, origin, bio, manifesto, web } = formData;

      if (!name.trim()) throw new Error("Artist name is required.");
      if (!origin.trim()) throw new Error("Artist origin is required.");

      const slug = generateSlug(name);
      const profilePicURL = await uploadProfilePicture(slug);
      if (!profilePicURL) throw new Error("Profile picture upload failed.");

      const galleryData = await uploadImages(slug);
      if (!galleryData || galleryData.length === 0) throw new Error("Artwork images upload failed.");

      const cvURL = await uploadCv(slug);
      const birthDateTimestamp = birthDate ? Timestamp.fromDate(new Date(birthDate)) : null;

      await addDoc(artistsCollection, {
        ...formData,
        slug,
        profilePicture: profilePicURL,
        artworks: galleryData,
        cv: cvURL,
        birthDate: birthDateTimestamp,
      });

      setSuccess(`Successfully added artist ${name}.`);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.form}>
      {/* Profile Picture Input */}
      <div className={styles.profilePictureContainer}>
        <input
          type="file"
          name="profilePicture"
          accept="image/*" // Optional: Restrict to image files
          onChange={handleProfilePictureChange}
          ref={fileInputRef} // Attach ref to file input
        />
        <p className={styles.subtitle}>PROFILE PICTURE</p>
        {profilePicturePreview && (
          <img
            src={profilePicturePreview}
            alt="Profile Preview"
            className={styles.profilePreviewImage}
          />
        )}

      </div>

      {/* Name Input */}
      <p className={styles.subtitle}>NAME</p>
      <input
        name="name"
        placeholder="Nombre"
        value={formData.name}
        onChange={handleChange}
      />
      <p className={styles.subtitle}>ORIGIN</p>

      {/* Origin Input */}
      <input
        name="origin"
        placeholder="Origen"
        value={formData.origin}
        onChange={handleChange}
      />
      <p className={styles.subtitle}>BIRTH DATEE</p>
      {/* Birth Date Input */}
      <input
        type="date"
        name="birthDate"
        value={birthDate}
        onChange={handleBirthDateChange}
        placeholder="Fecha de nacimiento"
      />

      {/* Bio Paragraphs Input */}
      <div>
      <p className={styles.subtitle}>BIO</p>
        <textarea
          placeholder="Add a paragraph to your bio"
          value={newBioParagraph}
          onChange={handleBioParagraphChange}
        />
        <button type="button" onClick={addBioParagraph}>Add Bio Paragraph</button>
      </div>
      <div>
        {formData.bio.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* Manifesto Paragraphs Input */}
      <div>
        <p className={styles.subtitle}>MANIFESTO</p>
        <textarea
          placeholder="Add a paragraph to your manifesto"
          value={newManifestoParagraph}
          onChange={handleManifestoParagraphChange}
        />
        <button type="button" onClick={addManifestoParagraph}>Add Manifesto Paragraph</button>
      </div>
      <div>
        {formData.manifesto.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* Website Input */}
      <p className={styles.subtitle}>WEBSITE</p>
      <input
        name="web"
        placeholder="Website"
        value={formData.web}
        onChange={handleChange}
      />

      {/* CV File Input */}
      <p className={styles.subtitle}>CV (PDF)</p>
      <input type="file" name="cv" accept=".pdf" onChange={handleCvChange} />

      {/* Gallery Images Input */}
      <p className={styles.subtitle}>Artworks</p>
                {/* Current Artwork Preview */}
    {newArtwork.file && (
      <div className={styles.artworkPreview}>
        <p>Artwork Preview</p>
        <img
          src={URL.createObjectURL(newArtwork.file)}
          alt="New Artwork Preview"
          className={styles.artworkPreviewImage}
        />
      </div>
    )}
      <input
        type="file"
        name="newArtwork"
        accept="image/*"
        onChange={handleNewArtworkFileChange}
      />
      <input
        type="text"
        placeholder="Title"
        value={newArtwork.title}
        onChange={(e) => handleNewArtworkChange("title", e.target.value)}
      />
      <input
        type="text"
        placeholder="Date"
        value={newArtwork.date}
        onChange={(e) => handleNewArtworkChange("date", e.target.value)}
      />
      <input
        type="text"
        placeholder="Medium"
        value={newArtwork.medium}
        onChange={(e) => handleNewArtworkChange("medium", e.target.value)}
      />
      <input
        type="text"
        placeholder="Measurements"
        value={newArtwork.measurements}
        onChange={(e) => handleNewArtworkChange("measurements", e.target.value)}
      />
      <textarea
        placeholder="Description"
        value={newArtwork.description}
        onChange={(e) => handleNewArtworkChange("description", e.target.value)}
      />

      <button type="button" onClick={addArtwork}>
        Add Artwork
      </button>

      {artworks.map((artwork, index) => (
        <div key={index} className={styles.artwork}>
          <p>Artwork {index + 1}</p>
          <img src={URL.createObjectURL(artwork.file)} alt="Artwork Preview" className={styles.artworkPreviewImage} />
          <p>Title: {artwork.title}</p>
          <p>Date: {artwork.date}</p>
          <p>Medium: {artwork.medium}</p>
          <p>Measurements: {artwork.measurements}</p>
          <p>Description: {artwork.description}</p>
        </div>
      ))}

      {/* Error Message */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Success Message */}
      {success && <p className={styles.success}>{success}</p>} {/* Optional: Add CSS for success messages */}

      {/* Submit Button */}
      <button type="button" onClick={addNewArtist} disabled={loading}>
        {loading ? "Uploading..." : "Add Artist"}
      </button>
    </div>
  );
}
