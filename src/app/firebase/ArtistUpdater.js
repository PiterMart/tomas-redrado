"use client";

import { useEffect, useState, useRef } from "react";
import { firestore, storage } from "./firebaseConfig";
import { getDocs, addDoc, collection, doc, updateDoc, Timestamp, arrayUnion, getDoc } from "firebase/firestore"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DatePicker from "react-datepicker";
import styles from "../styles/page.module.css";

export default function ArtistUpdater() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState({
        bio: [], // Initialize as empty array
        name: "",
        origin: "",
        web: "",
        profilePicture: "",
        artworks: [], // Initialize as empty array
        cvUrl: "",
        manifesto: "",
        slug: "",
    });
    const [artworksData, setArtworksData] = useState([]);
    const [artists, setArtists] = useState([]); // Fetch and store artists here
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [newBio, setNewBio] = useState("");

    useEffect(() => {
        const fetchArtists = async () => {
            try {
                const artistSnapshot = await getDocs(collection(firestore, "artists"));
                const artistsData = artistSnapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }));
                setArtists(artistsData);
            } catch (error) {
                console.error("Error fetching artists:", error);
            }
        };
        fetchArtists();
    }, []);
    

        // Load selected artist data into the form
    const handleArtistSelection = async (artistSlug) => {
        try {
            const artistDoc = await getDoc(doc(firestore, "artists", artistSlug));
            if (artistDoc.exists()) {
                const artistData = artistDoc.data();
                setSelectedArtist(artistSlug);
                setFormData({
                    ...artistData,
                    birthDate: artistData.birthDate.toDate(),
                    bio: artistData.bio || [],
                    name: artistData.name,
                    origin: artistData.origin,
                    web: artistData.web,
                    profilePicture: artistData.profilePicture,
                    artworks: artistData.artworks || [],
                    cvUrl: artistData.cvUrl,
                    manifesto: artistData.manifesto,
                    slug: artistData.slug,
                });

                // Fetch artworks based on IDs
                if (artistData.artworks && artistData.artworks.length > 0) {
                    const fetchedArtworks = await fetchArtworksByIds(artistData.artworks);
                    setArtworksData(fetchedArtworks);
                } else {
                    setArtworksData([]);
                }
            }
        } catch (error) {
            console.error("Error fetching artist:", error);
        }
    };
    
    const updateArtist = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
    
        try {
        if (!selectedArtist) throw new Error("No artist selected for updating.");
    
        const { name, birthDate, biography, nationality } = formData;
    
        if (!name || !birthDate || !biography || !nationality) {
            throw new Error("Please complete all required fields.");
        }
    
        const slug = generateSlug(name);
    
        let artworkData;
        if (images.length > 0) {
            // Only upload images if new ones are added
            artworkData = await uploadImages(slug);
        } else {
            // Fetch current artwork data from Firebase if no new images are provided
            const artistDoc = await getDoc(doc(firestore, "artists", selectedArtist));
            artworkData = artistDoc.exists() ? artistDoc.data().artworks || [] : [];
        }
    
        const birthDateTimestamp = Timestamp.fromDate(new Date(birthDate));
    
        const updatedArtistData = {
            ...formData,
            slug,
            artworks: artworkData,
            birthDate: birthDateTimestamp,
            exhibitions: selectedExhibitions.map((exhibitionSlug) => ({
            exhibitionSlug,
            selectedArtworks: selectedArtworks[exhibitionSlug] || [],
            })),
        };
    
        // Update the artist in Firebase
        await updateDoc(doc(firestore, "artists", selectedArtist), updatedArtistData);
    
        setSuccess("Artist updated successfully!");
        } catch (error) {
        console.error("Error updating artist:", error);
        setError("Failed to update artist. Please try again.");
        } finally {
        setLoading(false);
        }
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