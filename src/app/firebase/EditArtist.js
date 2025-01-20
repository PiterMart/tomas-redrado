"use client";
import { app, firestore, storage } from "./firebaseConfig";
import { doc, setDoc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import styles from "../styles/page.module.css";
import React, { useState, useEffect } from "react";
import { deleteArtist } from "./DeleteArtist";

export default function EditArtist({ artistId, onClose }) {
  const [artistData, setArtistData] = useState({
    bio: [],
    name: "",
    origin: "",
    web: "",
    profilePicture: "",
    artworks: [],
    cvUrl: "",
    manifesto: "",
    slug: "",
  });

  const [artworksData, setArtworksData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [newGalleryImages, setNewGalleryImages] = useState([]);
  const [newArtworksDetails, setNewArtworksDetails] = useState([]);
  const [cvFile, setCvFile] = useState(null);
  const [newBioParagraph, setNewBioParagraph] = useState("");
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    if (!artistId) return;

    setLoading(true);
    const fetchArtistData = async () => {
      const docRef = doc(firestore, "artists", artistId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const artist = docSnap.data();
        setArtistData(artist);

        if (artist.artworks && artist.artworks.length > 0) {
          const fetchedArtworks = await fetchArtworksByIds(artist.artworks);
          setArtworksData(fetchedArtworks);
        }
      } else {
        console.error("Artist not found");
      }
      setLoading(false);
    };

    fetchArtistData();
  }, [artistId]);

  const fetchArtworksByIds = async (artworkIds) => {
    try {
      const artworkPromises = artworkIds.map(async (id) => {
        const docRef = doc(firestore, "artworks", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        } else {
          console.warn(`Artwork not found for ID: ${id}`);
          return null;
        }
      });

      const artworks = await Promise.all(artworkPromises);
      return artworks.filter(Boolean);
    } catch (error) {
      console.error("Error fetching artworks:", error);
      return [];
    }
  };

  const renderArtworks = () => {
    if (artworksData.length === 0) {
      return <p>No artworks available for this artist.</p>;
    }

    return artworksData.map((artwork, index) => (
      <div key={artwork.id} className={styles.artworkContainer}>
        {artwork.url && <img src={artwork.url} alt={artwork.title} width="100" />}
        <input
          type="text"
          value={artwork.title || ""}
          placeholder="Title"
          onChange={(e) => handleArtworkFieldChange(index, "title", e.target.value)}
        />
        <input
          type="text"
          value={artwork.date || ""}
          placeholder="Date"
          onChange={(e) => handleArtworkFieldChange(index, "date", e.target.value)}
        />
        <input
          type="text"
          value={artwork.medium || ""}
          placeholder="Medium"
          onChange={(e) => handleArtworkFieldChange(index, "medium", e.target.value)}
        />
        <input
          type="text"
          value={artwork.measurement || ""}
          placeholder="Measurement"
          onChange={(e) => handleArtworkFieldChange(index, "measurement", e.target.value)}
        />
        <textarea
          value={artwork.description || ""}
          placeholder="Description"
          onChange={(e) => handleArtworkFieldChange(index, "description", e.target.value)}
        />
        <button type="button" onClick={() => deleteArtwork(index)}>Delete Artwork</button>
      </div>
    ));
  };

  const handleArtworkFieldChange = (index, field, value) => {
    setArtworksData((prevData) => {
      const updatedArtworks = [...prevData];
      updatedArtworks[index] = { ...updatedArtworks[index], [field]: value };
      return updatedArtworks;
    });
  };

  const deleteArtwork = async (index) => {
    const updatedArtworks = artistData.artworks.filter((_, i) => i !== index);
    setArtistData((prevData) => ({
      ...prevData,
      artworks: updatedArtworks,
    }));
    await updateDoc(doc(firestore, "artists", artistId), { artworks: updatedArtworks });
  };

  const handleProfilePictureChange = (e) => setProfilePictureFile(e.target.files[0]);
  const handleCvChange = (e) => setCvFile(e.target.files[0]);

  const handleNewGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setNewGalleryImages(files);
    setPreviewImages(files.map((file) => URL.createObjectURL(file)));
    setNewArtworksDetails(files.map(() => ({
      title: "", 
      date: "", 
      medium: "", 
      measurement: "", 
      description: "", 
    })));
  };

  const handleNewArtworkDetailChange = (index, field, value) => {
    const updatedDetails = [...newArtworksDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setNewArtworksDetails(updatedDetails);
  };

  const handleNewBioParagraphChange = (e) => {
    setNewBioParagraph(e.target.value);
  };
  

  const uploadProfilePicture = async () => {
    if (!profilePictureFile) return artistData.profilePicture;

    const profilePicRef = ref(storage, `artists/${artistData.slug}/profilePicture/${artistData.slug}_profilePicture`);
    await uploadBytes(profilePicRef, profilePictureFile);
    return await getDownloadURL(profilePicRef);
  };

  const uploadNewGalleryImages = async (artistSlug) => {
    const newGalleryData = [];
    for (let i = 0; i < newGalleryImages.length; i++) {
      const imageFile = newGalleryImages[i];
      const details = newArtworksDetails[i] || {};
      const { title, date, medium, measurement, description } = details;

      const artworkId = `${artistSlug}_${String(i + 1).padStart(3, '0')}`;
      const artworkSlug = `${artworkId}-${generateSlug(title)}`;

      const imageRef = ref(storage, `artists/${artistData.slug}/artworks/${artworkId}`);
      await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(imageRef);

      newGalleryData.push({
        artworkId,
        url: downloadURL,
        slug: artworkSlug,
        title,
        date,
        medium,
        measurement,
        description,
      });
    }
    return newGalleryData;
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const uploadCv = async () => {
    if (!cvFile) return artistData.cvUrl;

    const cvRef = ref(storage, `artists/${artistData.slug}/cv/${artistData.slug}_CV.pdf`);
    await uploadBytes(cvRef, cvFile);
    return await getDownloadURL(cvRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedProfilePicture = await uploadProfilePicture();
      const newArtworksData = await uploadNewGalleryImages(artistData.slug);
      const updatedCvUrl = await uploadCv();

      const updatedArtworks = [...artistData.artworks, ...newArtworksData];

      const updatedArtistData = {
        ...artistData,
        profilePicture: updatedProfilePicture || artistData.profilePicture,
        artworks: updatedArtworks,
        cvUrl: updatedCvUrl || artistData.cvUrl,
        bio: artistData.bio || [],
      };

      await setDoc(doc(firestore, "artists", artistId), updatedArtistData);
      alert("Artist updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating document:", error);
      alert("There was an error updating the artist.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setArtistData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };


  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {loading && <p>Loading...</p>} {/* Display loading state */}
  
      {/* Profile Picture Field */}
      <label>Profile Picture:</label>
      {artistData.profilePicture && (
        <img src={artistData.profilePicture} alt="Current Profile" width="100" />
      )}
      <input type="file" name="profilePicture" onChange={handleProfilePictureChange} />
  
      {/* Name, Origin, and Manifesto Fields */}
      <p>Name:</p>
      <input
        name="name"
        placeholder="Name"
        value={artistData.name}
        onChange={handleInputChange}
      />
      <p>Origin:</p>
      <input
        name="origin"
        placeholder="Origin"
        value={artistData.origin}
        onChange={handleInputChange}
      />
      <p>Manifesto:</p>
      <textarea
        name="manifesto"
        placeholder="Artist Manifesto"
        value={artistData.manifesto || ""}
        onChange={handleInputChange}
      />
  
      {/* Bio Field */}
      <p>Bio:</p>
      <textarea
        placeholder="Add a paragraph to your bio"
        value={newBioParagraph}
        onChange={handleNewBioParagraphChange}
      />
      {/* <button type="button" onClick={addBioParagraph}>
        Add Bio Paragraph
      </button> */}
      <div>
        {artistData.bio.map((paragraph, index) => (
          <div key={index}>
            <p>{paragraph}</p>
            <button type="button" onClick={() => deleteBioParagraph(index)}>
              Delete
            </button>
          </div>
        ))}
      </div>
  
      {/* CV Field */}
      <p>CV (PDF):</p>
      {artistData.cvUrl && (
        <a href={artistData.cvUrl} target="_blank" rel="noopener noreferrer">
          Current CV (Click to view)
        </a>
      )}
      <input type="file" name="cv" accept=".pdf" onChange={handleCvChange} />
  

  
      {/* Render Artworks */}
      <p>Artworks:</p>
      {renderArtworks()}
  
      {/* Action Buttons */}
      <button type="submit">Save Changes</button>
      <button type="button" onClick={() => deleteArtist(artistId, artistData, onClose)}>
        Delete Artist
      </button>
      <button type="button" onClick={onClose}>
        Cancel
      </button>
    </form>
  );
  
}
