"use client";
import { useEffect, useState, useRef } from "react";
import { firestore, storage } from "./firebaseConfig";
import { getDocs, addDoc, collection, doc, updateDoc, Timestamp, arrayUnion, getDoc } from "firebase/firestore";  
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import styles from "../styles/page.module.css";
import DatePicker from "react-datepicker";
import imageCompression from 'browser-image-compression';

export default function ArtistUpdater() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [existingArtworks, setExistingArtworks] = useState([]);
  const [deletedArtworks, setDeletedArtworks] = useState([]);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    origin: "",
    bio: [],
    manifesto: [],
    web: "",
    slug: "",
    profilePicture: "",
    cvUrl: "",
    birthDate: null,
  });

  const [newArtwork, setNewArtwork] = useState({
    file: null,
    images: [],
    title: "",
    date: "",
    medium: "",
    measurements: "",
    description: "",
    extras: [],
  });

  const [newExtra, setNewExtra] = useState("");
  const [newManifestoParagraph, setNewManifestoParagraph] = useState("");
  const [newBioParagraph, setNewBioParagraph] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [cvFile, setCvFile] = useState(null);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const artistSnapshot = await getDocs(collection(firestore, "artists"));
        const artistsData = artistSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setArtists(artistsData);
      } catch (error) {
        console.error("Error fetching artists:", error);
      }
    };
    fetchArtists();
  }, []);
    

  const handleArtistSelection = async (artistId) => {
    setSelectedArtist(artistId);
    if (!artistId) {
      resetForm();
      return;
    }

    try {
      const artistDoc = await getDoc(doc(firestore, "artists", artistId));
      if (artistDoc.exists()) {
        const data = artistDoc.data();
        setFormData({
          ...data,
          birthDate: data.birthDate?.toDate() || null,
          bio: data.bio || [],
          manifesto: data.manifesto || []
        });

        // Load profile picture preview
        setProfilePicturePreview(data.profilePicture || null);

        // Fetch artworks
        if (data.artworks?.length > 0) {
          const artworksData = await Promise.all(
            data.artworks.map(async artworkId => {
              const artworkDoc = await getDoc(doc(firestore, "artworks", artworkId));
              return artworkDoc.exists() ? { id: artworkDoc.id, ...artworkDoc.data() } : null;
            })
          );
          setExistingArtworks(artworksData.filter(artwork => artwork !== null));
        }
      }
    } catch (error) {
      console.error("Error loading artist data:", error);
      setError("Failed to load artist data.");
    }
  };

  const compressImage = async (file, options) => {
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error("Compression error:", error);
      throw error;
    }
  };

  const uploadProfilePicture = async (slug) => {
    if (!profilePictureFile) return formData.profilePicture;

    try {
      const compressedFile = await compressImage(profilePictureFile, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 800,
        useWebWorker: true
      });

      const profilePicRef = ref(storage, `artists/${slug}/images/profile`);
      await uploadBytes(profilePicRef, compressedFile);
      return await getDownloadURL(profilePicRef);
    } catch (error) {
      console.error("Profile picture upload failed:", error);
      throw error;
    }
  };

  const uploadArtworkImages = async (slug, artworkData) => {
    try {
      // Upload main artwork
      const compressedMain = await compressImage(artworkData.file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 2000
      });
      
      const mainRef = ref(storage, `artists/${slug}/images/${Date.now()}_main`);
      await uploadBytes(mainRef, compressedMain);
      const mainUrl = await getDownloadURL(mainRef);

      // Upload detail images
      const detailUrls = await Promise.all(
        artworkData.images.map(async (file, index) => {
          const compressedDetail = await compressImage(file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 2000
          });
          
          const detailRef = ref(storage, `artists/${slug}/images/${Date.now()}_detail_${index}`);
          await uploadBytes(detailRef, compressedDetail);
          return await getDownloadURL(detailRef);
        })
      );

      return { mainUrl, detailUrls };
    } catch (error) {
      console.error("Artwork upload failed:", error);
      throw error;
    }
  };
    
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { name, origin, bio, manifesto, web } = formData;
      if (!name || !origin) throw new Error("Name and origin are required");

      const slug = generateSlug(name);
      
      // Upload profile picture
      const profilePicUrl = await uploadProfilePicture(slug);

      // Upload CV
      let cvUrl = formData.cvUrl;
      if (cvFile) {
        const cvRef = ref(storage, `artists/${slug}/documents/cv`);
        await uploadBytes(cvRef, cvFile);
        cvUrl = await getDownloadURL(cvRef);
      }

      // Upload new artworks
      const newArtworkIds = [];
      if (newArtwork.file) {
        const { mainUrl, detailUrls } = await uploadArtworkImages(slug, newArtwork);
        const artworkRef = await addDoc(collection(firestore, "artworks"), {
          ...newArtwork,
          artistId: selectedArtist,
          mainImage: mainUrl,
          detailImages: detailUrls,
          createdAt: Timestamp.now()
        });
        newArtworkIds.push(artworkRef.id);
      }

      // Update artist document
      const artistData = {
        ...formData,
        slug,
        profilePicture: profilePicUrl,
        cvUrl,
        birthDate: formData.birthDate ? Timestamp.fromDate(formData.birthDate) : null,
        artworks: [...existingArtworks.map(a => a.id), ...newArtworkIds]
      };

      if (selectedArtist) {
        await updateDoc(doc(firestore, "artists", selectedArtist), artistData);
        setSuccess("Artist updated successfully!");
      } else {
        const docRef = await addDoc(collection(firestore, "artists"), artistData);
        setSelectedArtist(docRef.id);
        setSuccess("Artist created successfully!");
      }

      // Cleanup deleted artworks
      if (deletedArtworks.length > 0) {
        await Promise.all(
          deletedArtworks.map(async artwork => {
            // Delete artwork document
            await deleteDoc(doc(firestore, "artworks", artwork.id));
            
            // Delete associated images
            await Promise.all(
              [artwork.mainImage, ...artwork.detailImages].map(async url => {
                const imgRef = ref(storage, url);
                await deleteObject(imgRef);
              })
            );
          })
        );
      }

      resetForm();
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const resetForm = () => {
    setFormData({
      name: "",
      origin: "",
      bio: [],
      manifesto: [],
      web: "",
      slug: "",
      profilePicture: "",
      cvUrl: "",
      birthDate: null,
    });
    setNewArtwork({
      file: null,
      images: [],
      title: "",
      date: "",
      medium: "",
      measurements: "",
      description: "",
      extras: [],
    });
    setExistingArtworks([]);
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setCvFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // handlers
  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prevData) => ({
          ...prevData,
          [name]: value,
      }));
  };

  const handleProfilePictureChange = (e) => setProfilePictureFile(e.target.files[0]);

  const handleBioChange = (e) => {
      setNewBio(e.target.value);
  };
  
  const addBio = () => {
    if (newBio) {
      setFormData((prev) => ({
        ...prev,
        bio: [...prev.bio, newBio],
      }));
      setNewBio("");
    }
  };

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
        <div key={artwork.id || index} className={styles.artworkContainer}>
          {artwork.url && <img src={artwork.url} alt={artwork.title || "Artwork"} width="100" />}
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
      const updatedArtworks = artworksData.filter((_, i) => i !== index);
      setArtworksData(updatedArtworks);
  
      // Update Firebase with the new artworks list
      if (selectedArtist) {
          await updateDoc(doc(firestore, "artists", selectedArtist), { artworks: updatedArtworks });
      }
  };
    
  return (

    <div className={styles.form}>
      <div>
        <select onChange={(e) => handleArtistSelection(e.target.value)} value={selectedArtist || ""}>
          <option value="" disabled>
            Select a Artist to Edit
          </option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>
      </div>

      {/* Profile Picture Field */}
      <label>Profile Picture:</label>
      {formData.profilePicture && (
          <img src={formData.profilePicture} alt="Current Profile" width="100" />
      )}
      <input type="file" name="profilePicture" onChange={handleProfilePictureChange} />
  
      {/* Name, Origin, and Manifesto Fields */}
      <p>Name:</p>
      <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleInputChange}
      />
      <p>Origin:</p>
      <input
          name="origin"
          placeholder="Origin"
          value={formData.origin}
          onChange={handleInputChange}
      />
      <p>Manifesto:</p>
      <textarea
          name="manifesto"
          placeholder="Artist Manifesto"
          value={formData.manifesto || ""}
          onChange={handleInputChange}
      />
      <p>Bio:</p>
        <div>
          <textarea
            placeholder="Add Bio Text"
            value={newBio}
            onChange={handleBioChange}
          />
          <button onClick={addBio}>Add Bio Text</button>
          <ul>
              {formData.bio.map((text, index) => (
              <li key={`${text}-${index}`}>
                <textarea
                  value={text}
                  onChange={(e) => {
                    const updatedTexts = [...formData.Bio];
                    updatedTexts[index] = e.target.value;
                    setFormData((prev) => ({ ...prev, Bio: updatedTexts }));
                  }}
                />
                <button
                  onClick={() => {
                    const updatedTexts = formData.Bio.filter((_, i) => i !== index);
                    setFormData((prev) => ({ ...prev, Bio: updatedTexts }));
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        <DatePicker
          selected={formData.birthDate}
          onChange={(date) => handleDateChange("birthDate", date)}
          placeholderText="Birth Date"
        />
      {/* Render Artworks */}
      <p>Artworks:</p>
      {renderArtworks()}
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        {/* <button
          type="button"
          onClick={selectedArtist ? updateArtist : addNewArtist}
          disabled={loading}
        >
          {loading ? "Processing..." : selectedArtist ? "Update Artist" : "Add Artist"}
        </button> */}
      </div>
    );
}