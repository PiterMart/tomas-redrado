"use client";
import { useEffect, useState, useRef } from "react";
import { firestore, storage } from "./firebaseConfig";
import { getDocs, addDoc, collection, doc, updateDoc, Timestamp, arrayUnion, getDoc } from "firebase/firestore"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../styles/page.module.css";

export default function FairUploader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [artists, setArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedArtworks, setSelectedArtworks] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    curator: "",
    curatorialTexts: [],
    openingDate: null,
    closingDate: null,
    location: "", // New field for location
    direction: "", // New field for direction
  });
  const [newCuratorialText, setNewCuratorialText] = useState("");
  const [images, setImages] = useState([]);
  const [imageDescriptions, setImageDescriptions] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const artistSnapshot = await getDocs(collection(firestore, "artists"));
        const artists = artistSnapshot.docs.map((doc) => ({
          ...doc.data(),
          slug: doc.id,
        }));
  
        if (artists.length === 0) {
          console.warn("No artists found!");
          return;
        }
  
        const artistsWithArtworks = await Promise.all(
          artists.map(async (artist) => {
            const artworksData = artist.artworks || [];
            const artworks = await Promise.all(
              artworksData.map(async (artworkId) => {
                const artworkDoc = await getDoc(doc(firestore, "artworks", artworkId));
                return artworkDoc.exists()
                  ? { id: artworkDoc.id, ...artworkDoc.data() }
                  : null;
              })
            );
            return {
              ...artist,
              artworks: artworks.filter((artwork) => artwork !== null),
            };
          })
        );
  
        setArtists(artistsWithArtworks);
        console.log("Fetched Artists with Artworks:", artistsWithArtworks);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      }
    };
  
    fetchArtistData();
  }, []);
  

  const handleArtistSelection = (artist) => {
    const isSelected = selectedArtists.includes(artist.slug);
    const updatedArtists = isSelected
      ? selectedArtists.filter((a) => a !== artist.slug)
      : [...selectedArtists, artist.slug];
  
    setSelectedArtists(updatedArtists);
  

    if (!isSelected) {
      setSelectedArtworks((prev) => ({
        ...prev,
        [artist.slug]: [], 
      }));
    }
  };
  
  const handleArtworkSelection = (artistSlug, artworkId) => {
    if (!artworkId) {
      console.error("Invalid artwork ID:", artworkId);
      return;
    }
  
    setSelectedArtworks((prevSelectedArtworks) => {
      const artistArtworks = prevSelectedArtworks[artistSlug] || [];
      const isSelected = artistArtworks.includes(artworkId);
  
      const updatedArtworks = isSelected
        ? artistArtworks.filter((id) => id !== artworkId) // Remove if already selected
        : [...artistArtworks, artworkId]; // Add if not selected
  
      return {
        ...prevSelectedArtworks,
        [artistSlug]: updatedArtworks,
      };
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const previewURLs = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previewURLs);
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date || "" }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCuratorialTextChange = (e) => {
    setNewCuratorialText(e.target.value);
  };

  const addCuratorialText = () => {
    if (newCuratorialText) {
      setFormData((prev) => ({
        ...prev,
        curatorialTexts: [...prev.curatorialTexts, newCuratorialText],
      }));
      setNewCuratorialText("");
    }
  };

  const handleImageDescriptionChange = (index, value) => {
    const updatedDescriptions = [...imageDescriptions];
    updatedDescriptions[index] = value || "";
    setImageDescriptions(updatedDescriptions);
  };

  const uploadImages = async (fairSlug) => {
    const galleryData = [];
    for (let i = 0; i < images.length; i++) {
      const imageFile = images[i];
      const description = imageDescriptions[i] || "";
      const imageRef = ref(storage, `fairs/${fairSlug}/images/${fairSlug}_image_${i + 1}`);
      await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(imageRef);
      galleryData.push({ url: downloadURL, description });
    }
    return galleryData;
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  };

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      curator: "",
      curatorialTexts: [],
      openingDate: "",
      closingDate: "",
      location: "",
      direction: "",
    });
    setSelectedArtists([]);
    setSelectedArtworks({});
    setImages([]);
    setImageDescriptions([]);
    setImagePreviews([]);
    setNewCuratorialText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const addNewFair = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { name, openingDate, closingDate, location, direction } = formData;

      if (!name || !openingDate || !closingDate || !location || !direction) {
        throw new Error("Please complete all required fields.");
      }

      const slug = generateSlug(name);
      const galleryData = await uploadImages(slug);
      if (!galleryData) throw new Error("Image upload failed.");

      const openingDateTimestamp = Timestamp.fromDate(new Date(openingDate));
      const closingDateTimestamp = Timestamp.fromDate(new Date(closingDate));

      const newFairData = {
        ...formData,
        slug,
        gallery: galleryData,
        openingDate: openingDateTimestamp,
        closingDate: closingDateTimestamp,
        artists: selectedArtists.map((artistSlug) => ({
          artistSlug,
          selectedArtworks: selectedArtworks[artistSlug] || [],
        })),
      };

      const fairRef = await addDoc(collection(firestore, "fairs"), newFairData);

      for (const artistSlug of selectedArtists) {
        const artistRef = doc(firestore, "artists", artistSlug);
        await updateDoc(artistRef, {
          fairs: arrayUnion(fairRef.id),
        });
      }

      for (const artistSlug of Object.keys(selectedArtworks)) {
        const artworks = selectedArtworks[artistSlug];
        for (const artworkId of artworks) {
          const artworkRef = doc(firestore, "artworks", artworkId);
          await updateDoc(artworkRef, {
            fairs: arrayUnion(fairRef.id),
          });
        }
      }

      setSuccess("Fair added successfully!");
      resetForm();
    } catch (error) {
      console.error("Error adding fair:", error);
      setError("Failed to add fair. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.form}>
      <input
        name="name"
        placeholder="Fair Name"
        value={formData.name}
        onChange={handleInputChange}
      />
      <textarea
        name="description"
        placeholder="Fair Description"
        value={formData.description}
        onChange={handleInputChange}
      />
      <input
        name="location"
        placeholder="Fair Location"
        value={formData.location}
        onChange={handleInputChange}
      />
      <input
        name="direction"
        placeholder="Fair Direction"
        value={formData.direction}
        onChange={handleInputChange}
      />
      <input
        name="curator"
        placeholder="Curator Name"
        value={formData.curator}
        onChange={handleInputChange}
      />
      <div>
        <textarea
          placeholder="Add Curatorial Text"
          value={newCuratorialText}
          onChange={handleCuratorialTextChange}
        />
        <button onClick={addCuratorialText}>Add Curatorial Text</button>
        <ul>
          {formData.curatorialTexts.map((text, index) => (
            <li key={`${text}-${index}`}>{text}</li>
          ))}
        </ul>
      </div>
      <DatePicker
        selected={formData.openingDate}
        onChange={(date) => handleDateChange("openingDate", date)}
        placeholderText="Opening Date"
      />
      <DatePicker
        selected={formData.closingDate}
        onChange={(date) => handleDateChange("closingDate", date)}
        placeholderText="Closing Date"
      />
      <div>
        {artists.length > 0 ? (
          artists.map((artist) => (
            <div key={artist.slug}>
              <input
                type="checkbox"
                checked={selectedArtists.includes(artist.slug)}
                onChange={() => handleArtistSelection(artist)}
              />
              <label>{artist.name}</label>
              {selectedArtists.includes(artist.slug) && artist.artworks.length > 0 && (
                <div>
                  <h4>Select Artworks</h4>
                  {artist.artworks.map((artwork) => (
                    <div key={artwork.id}>
                      <input
                        type="checkbox"
                        checked={selectedArtworks[artist.slug]?.includes(artwork.id) || false}
                        onChange={() => handleArtworkSelection(artist.slug, artwork.id)}
                      />
                      <label>{artwork.title}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Loading artists...</p>
        )}
      </div>

      <div>
        <p>Fair Images</p>
        <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} />
        {images.map((_, index) => (
          <div key={`image-${index}`}>
            <textarea
              placeholder="Image Description"
              value={imageDescriptions[index] || ""}
              onChange={(e) => handleImageDescriptionChange(index, e.target.value)}
            />
            {imagePreviews[index] && (
              <img
                src={imagePreviews[index]}
                alt={`Preview ${index + 1}`}
                className={styles.artworkPreviewImage}
              />
            )}
          </div>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
      <button type="button" onClick={addNewFair} disabled={loading}>
        {loading ? "Uploading..." : "Add Fair"}
      </button>
    </div>
  );
}
