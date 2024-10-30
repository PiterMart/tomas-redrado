"use client";
import { app, firestore, storage } from "./firebaseConfig";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import styles from "../styles/page.module.css";
import React, { useState, useEffect } from "react";
import { deleteArtist } from "./DeleteArtist";

export default function EditArtistForm({ artistId, onClose }) {
  // State to hold artist data
  const [artistData, setArtistData] = useState({
    bio: [],
    nombre: "",
    web: "",
    profilePicture: "",
    obras: [],
    cvUrl: "",
  });

  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [newGalleryImages, setNewGalleryImages] = useState([]);
  const [newDescriptions, setNewDescriptions] = useState([]);
  const [cvFile, setCvFile] = useState(null); // State for CV file
  const [newBioParagraph, setNewBioParagraph] = useState(""); // State for new bio paragraph

  // Fetch artist data on component load with real-time updates
  useEffect(() => {
    if (!artistId) return;

    const docRef = doc(firestore, "artistas", artistId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setArtistData(docSnap.data());
        } else {
          console.log("No such document!");
        }
      },
      (error) => {
        console.error("Error fetching document:", error);
      }
    );

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
  const handleNewGalleryImagesChange = (e) => setNewGalleryImages(e.target.files);
  const handleCvChange = (e) => setCvFile(e.target.files[0]); // Handle CV file change

  const handleNewDescriptionChange = (index, value) => {
    const updatedDescriptions = [...newDescriptions];
    updatedDescriptions[index] = value;
    setNewDescriptions(updatedDescriptions);
  };

  const handleNewBioParagraphChange = (e) => {
    setNewBioParagraph(e.target.value);
  };

  const addBioParagraph = () => {
    if (newBioParagraph) {
      setArtistData((prevData) => ({
        ...prevData,
        bio: [...prevData.bio, newBioParagraph],
      }));
      setNewBioParagraph(""); // Clear the input after adding
    }
  };

  // Function to delete a bio paragraph
  const deleteBioParagraph = async (index) => {
    const updatedBio = artistData.bio.filter((_, i) => i !== index); // Remove paragraph by index
    setArtistData((prevData) => ({
      ...prevData,
      bio: updatedBio,
    }));

    // Update Firestore with the new bio array
    await setDoc(doc(firestore, "artistas", artistId), {
      ...artistData,
      bio: updatedBio,
    });
  };

  const uploadProfilePicture = async () => {
    if (!profilePictureFile) return artistData.profilePicture;

    const profilePicRef = ref(storage, `${artistData.nombre}/profilePicture/${artistData.nombre}_profilePicture`);
    await uploadBytes(profilePicRef, profilePictureFile);
    return await getDownloadURL(profilePicRef);
  };

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

  // Upload CV file
  const uploadCv = async () => {
    if (!cvFile) return artistData.cvUrl;

    const cvRef = ref(storage, `${artistData.nombre}/cv/${artistData.nombre}_CV.pdf`);
    await uploadBytes(cvRef, cvFile);
    return await getDownloadURL(cvRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const updatedProfilePicture = await uploadProfilePicture();
      const newGalleryData = await uploadNewGalleryImages();
      const updatedCvUrl = await uploadCv(); // Upload CV

      const updatedObras = [...artistData.obras, ...newGalleryData];

      await setDoc(doc(firestore, "artistas", artistId), {
        ...artistData,
        profilePicture: updatedProfilePicture,
        obras: updatedObras,
        cvUrl: updatedCvUrl, // Save CV URL
        bio: artistData.bio, // Save the bio array
      });

      alert("Artist updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label>Profile Picture:</label>
      {artistData.profilePicture && (
        <img src={artistData.profilePicture} alt="Current Profile" width="100" />
      )}
      <input
        type="file"
        name="profilePicture"
        onChange={handleProfilePictureChange}
      />
      <p>Nombre:</p>
      <input
        name="nombre"
        placeholder="Nombre"
        value={artistData.nombre}
        onChange={handleInputChange}
      />
      <p>Bio:</p>
      {/* New Bio Paragraph Input */}
      <textarea
        placeholder="Add a paragraph to your bio"
        value={newBioParagraph}
        onChange={handleNewBioParagraphChange}
      />
      <button type="button" onClick={addBioParagraph}>Add Bio Paragraph</button>
      <div>
        {artistData.bio.map((paragraph, index) => (
          <div key={index}>
            <p>{paragraph}</p>
            <button type="button" onClick={() => deleteBioParagraph(index)}>Delete</button>
          </div>
        ))}
      </div>
      <p>Web:</p>
      <input
        name="web"
        placeholder="Website"
        value={artistData.web}
        onChange={handleInputChange}
      />

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

      <label>Current CV:</label>
      {artistData.cvUrl && (
        <a href={artistData.cvUrl} target="_blank" rel="noopener noreferrer"><button>View CV</button></a>
      )}
      <input type="file" name="cv" onChange={handleCvChange} /> {/* Input for new CV */}

      <button type="submit">Save Changes</button>
      <button type="button" onClick={deleteArtist}>Delete Artist</button>
      <button type="button" onClick={onClose}>Cancel</button>
    </form>
  );
}
