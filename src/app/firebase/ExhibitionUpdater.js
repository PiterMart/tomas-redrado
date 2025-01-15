"use client"
import { useEffect, useState, useRef } from "react";
import { firestore, storage } from "./firebaseConfig";
import { getDocs, addDoc, collection, doc, updateDoc, Timestamp, arrayUnion, getDoc } from "firebase/firestore"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../styles/page.module.css";

export default function ExhibitionUpdater() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [headquarters, setHeadquarters] = useState([]);
  const [selectedHeadquarters, setSelectedHeadquarters] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    curator: "",
    curatorialTexts: [],
    openingDate: null,
    closingDate: null,
    location: "",
    openingReception: null,
  });
  const [images, setImages] = useState([]);
  const [imageDescriptions, setImageDescriptions] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [artists, setArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedArtworks, setSelectedArtworks] = useState({});


  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  };

  const uploadImages = async (exhibitionSlug) => {
    const galleryData = [];
    for (let i = 0; i < images.length; i++) {
      const imageFile = images[i];
      const description = imageDescriptions[i] || "";
      const imageRef = ref(storage, `exhibitions/${exhibitionSlug}/images/${exhibitionSlug}_image_${i + 1}`);
      await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(imageRef);
      galleryData.push({ url: downloadURL, description });
    }
    return galleryData;
  };


  // Fetch all exhibitions on load
  useEffect(() => {
    const fetchExhibitions = async () => {
      try {
        const exhibitionSnapshot = await getDocs(collection(firestore, "exhibitions"));
        const exhibitionsData = exhibitionSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setExhibitions(exhibitionsData);
      } catch (error) {
        console.error("Error fetching exhibitions:", error);
      }
    };
    fetchExhibitions();
  }, []);

  // Fetch all headquarters and artists for exhibition editing
  useEffect(() => {
    const fetchHeadquartersAndArtists = async () => {
      try {
        const headquartersSnapshot = await getDocs(collection(firestore, "sedes"));
        const headquartersData = headquartersSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setHeadquarters(headquartersData);

        const artistSnapshot = await getDocs(collection(firestore, "artists"));
        const artistsData = artistSnapshot.docs.map((doc) => ({
          ...doc.data(),
          slug: doc.id,
        }));
        setArtists(artistsData);
      } catch (error) {
        console.error("Error fetching headquarters and artists:", error);
      }
    };
    fetchHeadquartersAndArtists();
  }, []);

  // Load selected exhibition data into the form
  const handleExhibitionSelection = async (exhibitionId) => {
    try {
      const exhibitionDoc = await getDoc(doc(firestore, "exhibitions", exhibitionId));
      if (exhibitionDoc.exists()) {
        const exhibitionData = exhibitionDoc.data();
        setSelectedExhibition(exhibitionId);
        setFormData({
          ...exhibitionData,
          openingDate: exhibitionData.openingDate.toDate(),
          closingDate: exhibitionData.closingDate.toDate(),
          openingReception: exhibitionData.openingReception?.toDate(),
        });
        setImageDescriptions(exhibitionData.gallery?.map((img) => img.description) || []);
        setImagePreviews(exhibitionData.gallery?.map((img) => img.url) || []);
        setSelectedArtists(exhibitionData.artists?.map((a) => a.artistSlug) || []);
        const artworksByArtist = {};
        (exhibitionData.artists || []).forEach((artist) => {
          artworksByArtist[artist.artistSlug] = artist.selectedArtworks || [];
        });
        setSelectedArtworks(artworksByArtist);
      }
    } catch (error) {
      console.error("Error fetching exhibition:", error);
    }
  };

  // Step 2: Handle form data updates, curatorial texts, image handling, etc. (same as you did in the fair updater)
  
  // ... [add form field handlers, upload logic, date handling, and image handling similar to the fair updater]
  
  // Step 3: Update or add an exhibition (handling logic for updating or creating exhibitions in Firestore)
  const updateExhibition = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!selectedExhibition) throw new Error("No exhibition selected for updating.");

      const { name, openingDate, closingDate, location, openingReception } = formData;

      if (!name || !openingDate || !closingDate ) {
        throw new Error("Please complete all required fields.");
      }

      const slug = generateSlug(name);

      let galleryData;
      if (images.length > 0) {
        // Only upload images if new ones are added
        galleryData = await uploadImages(slug);
      } else {
        // Fetch current gallery data from Firebase if no new images are provided
        const exhibitionDoc = await getDoc(doc(firestore, "exhibitions", selectedExhibition));
        galleryData = exhibitionDoc.exists() ? exhibitionDoc.data().gallery || [] : [];
      }

      const openingDateTimestamp = Timestamp.fromDate(new Date(openingDate));
      const closingDateTimestamp = Timestamp.fromDate(new Date(closingDate));
      const openingReceptionTimestamp = Timestamp.fromDate(new Date(openingReception));

      const updatedExhibitionData = {
        ...formData,
        slug,
        gallery: galleryData,
        openingDate: openingDateTimestamp,
        closingDate: closingDateTimestamp,
        openingReception: openingReceptionTimestamp,
        artists: selectedArtists.map((artistSlug) => ({
          artistSlug,
          selectedArtworks: selectedArtworks[artistSlug] || [],
        })),
      };

      // Update the exhibition in Firebase
      await updateDoc(doc(firestore, "exhibitions", selectedExhibition), updatedExhibitionData);

      setSuccess("Exhibition updated successfully!");
    } catch (error) {
      console.error("Error updating exhibition:", error);
      setError("Failed to update exhibition. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new exhibition similarly
  const addNewExhibition = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { name, openingDate, closingDate, location, openingReception } = formData;

      if (!name || !openingDate || !closingDate || !location || !openingReception) {
        throw new Error("Please complete all required fields.");
      }

      const slug = generateSlug(name);
      const galleryData = await uploadImages(slug);
      if (!galleryData) throw new Error("Image upload failed.");

      const openingDateTimestamp = Timestamp.fromDate(new Date(openingDate));
      const closingDateTimestamp = Timestamp.fromDate(new Date(closingDate));
      const openingReceptionTimestamp = Timestamp.fromDate(new Date(openingReception));

      const newExhibitionData = {
        ...formData,
        slug,
        gallery: galleryData,
        openingDate: openingDateTimestamp,
        closingDate: closingDateTimestamp,
        openingReception: openingReceptionTimestamp,
        artists: selectedArtists.map((artistSlug) => ({
          artistSlug,
          selectedArtworks: selectedArtworks[artistSlug] || [],
        })),
      };

      const exhibitionRef = await addDoc(collection(firestore, "exhibitions"), newExhibitionData);

      setSuccess("Exhibition added successfully!");
      resetForm();
    } catch (error) {
      console.error("Error adding exhibition:", error);
      setError("Failed to add exhibition. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle general input changes (for text and other simple fields)
const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  
  // Handle date field changes (for openingDate, closingDate, and openingReception)
  const handleDateChange = (field, date) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: date,
    }));
  };
  
  // Handle image description changes
  const handleImageDescriptionChange = (index, value) => {
    setImageDescriptions((prevDescriptions) => {
      const updatedDescriptions = [...prevDescriptions];
      updatedDescriptions[index] = value;
      return updatedDescriptions;
    });
  };
  
  // Handle artist selection (add/remove from selectedArtists)
  const handleArtistSelection = (artist) => {
    setSelectedArtists((prevSelected) => {
      if (prevSelected.includes(artist.slug)) {
        return prevSelected.filter((slug) => slug !== artist.slug);
      } else {
        return [...prevSelected, artist.slug];
      }
    });
  };
  
  // Handle artwork selection for a specific artist
  const handleArtworkSelection = (artistSlug, artworkId) => {
    setSelectedArtworks((prevSelectedArtworks) => {
      const updated = { ...prevSelectedArtworks };
      if (updated[artistSlug]) {
        if (updated[artistSlug].includes(artworkId)) {
          updated[artistSlug] = updated[artistSlug].filter((id) => id !== artworkId);
        } else {
          updated[artistSlug].push(artworkId);
        }
      } else {
        updated[artistSlug] = [artworkId];
      }
      return updated;
    });
  };
  // Handle image file changes (for uploading images)
const handleImageChange = (e) => {
    const files = e.target.files;
    const fileArray = Array.from(files);
  
    setImages((prevImages) => [...prevImages, ...fileArray]);
  
    // You can optionally handle any other image-specific processing here,
    // such as updating state with image URLs, validation, or preview.
  };
  
  

  // Step 4: UI components (render form fields, images, date pickers, artists checkboxes, etc.)
  
  return (
    <div className={styles.form}>
      <div>
        <select onChange={(e) => handleExhibitionSelection(e.target.value)} value={selectedExhibition || ""}>
          <option value="" disabled>
            Select an Exhibition to Edit
          </option>
          {exhibitions.map((exhibition) => (
            <option key={exhibition.id} value={exhibition.id}>
              {exhibition.name}
            </option>
          ))}
        </select>
      </div>
      <input
        name="name"
        placeholder="Exhibition Name"
        value={formData.name}
        onChange={handleInputChange}
      />
      <textarea
        name="description"
        placeholder="Exhibition Description"
        value={formData.description}
        onChange={handleInputChange}
      />
      <input
        name="location"
        placeholder="Exhibition Location"
        value={formData.location}
        onChange={handleInputChange}
      />
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
      <DatePicker
        selected={formData.openingReception}
        onChange={(date) => handleDateChange("openingReception", date)}
        placeholderText="Opening Reception Date"
      />
      <div>
        {artists.map((artist) => (
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
        ))}
      </div>
      {/* Image Upload Section */}
      <div>
        <p>Exhibition Images</p>
        {imagePreviews.map((preview, index) => (
          <div key={`current-image-${index}`}>
            <img src={preview} alt={`Current image ${index + 1}`} className={styles.artworkPreviewImage} />
            <textarea
              placeholder="Image description"
              value={imageDescriptions[index]}
              onChange={(e) => handleImageDescriptionChange(index, e.target.value)}
            />
          </div>
        ))}
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ margin: "1rem 0" }}
        />
      </div>

      {/* Submit/Update Buttons */}
      <button onClick={selectedExhibition ? updateExhibition : addNewExhibition} disabled={loading}>
        {loading ? "Saving..." : selectedExhibition ? "Update Exhibition" : "Add Exhibition"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
}
