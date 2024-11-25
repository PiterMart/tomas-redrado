"use client";
import { app, firestore, storage } from "./firebaseConfig";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
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
    artworks: [], // Ensure we're using artworks field
    cvUrl: "",
    manifesto: "",
    slug: "",
  });

  const [loading, setLoading] = useState(false); // Loading state
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [newGalleryImages, setNewGalleryImages] = useState([]);
  const [newArtworksDetails, setNewArtworksDetails] = useState([]);
  const [cvFile, setCvFile] = useState(null);
  const [newBioParagraph, setNewBioParagraph] = useState("");
  const [extras, setExtras] = useState([]); // Extra paragraphs for each artwork
  const [newExtra, setNewExtra] = useState("");
  const [previewImages, setPreviewImages] = useState([]); // Previews for new artworks

  useEffect(() => {
    if (!artistId) return;

    setLoading(true); // Set loading when fetching data
    const docRef = doc(firestore, "artists", artistId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setArtistData(docSnap.data());
      } else {
        console.log("No such document!");
      }
      setLoading(false); // Stop loading when data is fetched
    });

    return () => unsubscribe();
  }, [artistId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setArtistData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleProfilePictureChange = (e) => setProfilePictureFile(e.target.files[0]);
  const handleCvChange = (e) => setCvFile(e.target.files[0]);

  const handleNewGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setNewGalleryImages(files);
    setPreviewImages(files.map((file) => URL.createObjectURL(file))); // Generate previews
    setNewArtworksDetails(files.map(() => ({
      title: "", 
      date: "", 
      medium: "", 
      measurement: "", 
      description: "", 
      extra: ""
    })));
  };

  const handleNewArtworkDetailChange = (index, field, value) => {
    const updatedDetails = [...newArtworksDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setNewArtworksDetails(updatedDetails);
  };

  const handleNewBioParagraphChange = (e) => setNewBioParagraph(e.target.value);

  const addBioParagraph = () => {
    if (newBioParagraph) {
      setArtistData((prevData) => ({
        ...prevData,
        bio: [...prevData.bio, newBioParagraph],
      }));
      setNewBioParagraph("");
    }
  };

  const deleteBioParagraph = async (index) => {
    const updatedBio = artistData.bio.filter((_, i) => i !== index);
    setArtistData((prevData) => ({
      ...prevData,
      bio: updatedBio,
    }));
    await updateDoc(doc(firestore, "artists", artistId), { bio: updatedBio });
  };

  const deleteArtwork = async (index) => {
    const updatedArtworks = artistData.artworks.filter((_, i) => i !== index);
    setArtistData((prevData) => ({
      ...prevData,
      artworks: updatedArtworks,
    }));
    await updateDoc(doc(firestore, "artists", artistId), { artworks: updatedArtworks });
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
      const { title, date, medium, measurement, description, extra } = details;

      const artworkId = `${artistSlug}_${String(i + 1).padStart(3, '0')}`;
      const artworkSlug = `${artworkId}-${generateSlug(title)}`;
  
      const imageRef = ref(storage, `artists/${artistData.slug}/artworks/${artistData.slug}_${artistData.artworks.length + i}`);
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
        extra,
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
      <input name="name" placeholder="Name" value={artistData.name} onChange={handleInputChange} />
      <p>Origin:</p>
      <input name="origin" placeholder="Origin" value={artistData.origin} onChange={handleInputChange} />
      <p>Manifesto:</p>
      <textarea name="manifesto" placeholder="Artist Manifesto" value={artistData.manifesto || ""} onChange={handleInputChange} />

      
      <p>Bio:</p>
      <textarea placeholder="Add a paragraph to your bio" value={newBioParagraph} onChange={handleNewBioParagraphChange} />
      <button type="button" onClick={addBioParagraph}>Add Bio Paragraph</button>
      <div>
        {artistData.bio.map((paragraph, index) => (
          <div key={index}>
            <p>{paragraph}</p>
            <button type="button" onClick={() => deleteBioParagraph(index)}>Delete</button>
          </div>
        ))}
      </div>

      <p>CV (PDF):</p>
      {artistData.cvUrl && (
        <a href={artistData.cvUrl} target="_blank" rel="noopener noreferrer">
          Current CV (Click to view)
        </a>
      )}
      <input type="file" name="cv" accept=".pdf" onChange={handleCvChange} />
      
      <label>Gallery Images:</label>
      {artistData.artworks.map((artwork, index) => (
        <div key={index} className={styles.artworkContainer}>
          <img src={artwork.url} alt={`Gallery image ${index + 1}`} width="100" />
          <input
            type="text"
            value={artwork.title || ""}
            placeholder="Title"
            onChange={(e) =>
              setArtistData((prevData) => {
                const updatedArtworks = [...prevData.artworks];
                updatedArtworks[index] = { ...updatedArtworks[index], title: e.target.value };
                return { ...prevData, artworks: updatedArtworks };
              })
            }
          />
          <input
            type="text"
            value={artwork.date || ""}
            placeholder="Date"
            onChange={(e) =>
              setArtistData((prevData) => {
                const updatedArtworks = [...prevData.artworks];
                updatedArtworks[index] = { ...updatedArtworks[index], date: e.target.value };
                return { ...prevData, artworks: updatedArtworks };
              })
            }
          />
          <input
            type="text"
            value={artwork.medium || ""}
            placeholder="Medium"
            onChange={(e) =>
              setArtistData((prevData) => {
                const updatedArtworks = [...prevData.artworks];
                updatedArtworks[index] = { ...updatedArtworks[index], medium: e.target.value };
                return { ...prevData, artworks: updatedArtworks };
              })
            }
          />
          <input
            type="text"
            value={artwork.measurement || ""}
            placeholder="Measurement"
            onChange={(e) =>
              setArtistData((prevData) => {
                const updatedArtworks = [...prevData.artworks];
                updatedArtworks[index] = { ...updatedArtworks[index], measurement: e.target.value };
                return { ...prevData, artworks: updatedArtworks };
              })
            }
          />
          <textarea
            value={artwork.description || ""}
            placeholder="Description"
            onChange={(e) =>
              setArtistData((prevData) => {
                const updatedArtworks = [...prevData.artworks];
                updatedArtworks[index] = { ...updatedArtworks[index], description: e.target.value };
                return { ...prevData, artworks: updatedArtworks };
              })
            }
          />
          <button type="button" onClick={() => deleteArtwork(index)}>Delete Artwork</button>
        </div>
      ))}


      <p>Artworks:</p>
      <input type="file" name="artworks" multiple onChange={handleNewGalleryImagesChange} />
      {newArtworksDetails.map((artwork, index) => (
        <div key={index}>
          {previewImages[index] && (
            <img src={previewImages[index]} alt={`Preview ${index + 1}`} className={styles.artworkPreviewImage} />
          )}
          <input type="text" placeholder="Title" value={artwork.title} onChange={(e) => handleNewArtworkDetailChange(index, 'title', e.target.value)} />
          <input type="text" placeholder="Date" value={artwork.date} onChange={(e) => handleNewArtworkDetailChange(index, 'date', e.target.value)} />
          <input type="text" placeholder="Medium" value={artwork.medium} onChange={(e) => handleNewArtworkDetailChange(index, 'medium', e.target.value)} />
          <input type="text" placeholder="Measurement" value={artwork.measurement} onChange={(e) => handleNewArtworkDetailChange(index, 'measurement', e.target.value)} />
          <textarea placeholder="Description" value={artwork.description} onChange={(e) => handleNewArtworkDetailChange(index, 'description', e.target.value)} />
          {/* <div>
            <textarea placeholder="Add an extra detail" value={newExtra} onChange={(e) => setNewExtra(e.target.value)} />
            <button onClick={() => addExtra(index)}>Add Extra</button>
          </div> */}
        </div>
      ))}
      

      <button type="submit">Save Changes</button>
      <button type="button" onClick={() => deleteArtist(artistId, artistData, onClose)}>Delete Artist</button>
      <button type="button" onClick={onClose}>Cancel</button>
    </form>
  );
}
