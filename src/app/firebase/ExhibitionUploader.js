"use client";
import { useEffect, useState, useRef } from "react";
import { firestore, storage } from "./firebaseConfig";
import { getDocs, addDoc, collection, doc, updateDoc, Timestamp, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../styles/page.module.css";

export default function ExhibitionForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Added for success feedback

  const [artists, setArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedArtworks, setSelectedArtworks] = useState({});
  const [headquarters, setHeadquarters] = useState([]);
  const [selectedHeadquarters, setSelectedHeadquarters] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    curator: "",
    curatorialTexts: [],
    openingDate: "",
    closingDate: "",
    receptionDate: "",
    receptionTime: "",
  });
  const [newCuratorialText, setNewCuratorialText] = useState("");
  const [images, setImages] = useState([]);
  const [imageDescriptions, setImageDescriptions] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchArtists = async () => {
      const artistSnapshot = await getDocs(collection(firestore, "artists"));
      setArtists(artistSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchHeadquarters = async () => {
      const headquartersSnapshot = await getDocs(collection(firestore, "sedes"));
      setHeadquarters(headquartersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchArtists();
    fetchHeadquarters();
  }, []);

  const handleArtistSelection = (artist) => {
    const isSelected = selectedArtists.includes(artist.slug); // Check with slug
    const updatedArtists = isSelected
      ? selectedArtists.filter((a) => a !== artist.slug)
      : [...selectedArtists, artist.slug];
  
    setSelectedArtists(updatedArtists);
  
    // Initialize artwork selection when an artist is selected
    if (!isSelected) {
      setSelectedArtworks((prev) => ({
        ...prev,
        [artist.slug]: [], // Use artist.slug
      }));
    }
  };
  
  
  
  
// Make sure that when setting selected artworks, it looks like this:
const handleArtworkSelection = (artistSlug, artworkSlug) => {
  const artistArtworks = selectedArtworks[artistSlug] || [];
  const isSelected = artistArtworks.includes(artworkSlug);

  const updatedArtworks = isSelected
    ? artistArtworks.filter((slug) => slug !== artworkSlug)
    : [...artistArtworks, artworkSlug];

  setSelectedArtworks((prev) => ({
    ...prev,
    [artistSlug]: updatedArtworks, // Store artworks by artist's slug
  }));
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
      [name]: value,  // Store as a string
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

  const uploadImages = async (exhibitionSlug) => {
    const galleryData = [];
    for (let i = 0; i < images.length; i++) {
      const imageFile = images[i];
      const description = imageDescriptions[i] || "";
      const imageRef = ref(storage, `exhibitions/${exhibitionSlug}/images/image_${i + 1}`);
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
      receptionDate: "",
      receptionTime: "",
    });
    setSelectedArtists([]);
    setSelectedArtworks({});
    setImages([]);
    setImageDescriptions([]);
    setImagePreviews([]);
    setNewCuratorialText("");
    setSelectedHeadquarters("");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
  }

  async function addNewExhibition() {
    setLoading(true);
    setError(null);
    setSuccess(null);
  
    try {
      const { name, openingDate, closingDate, receptionTime } = formData;
  
      // Validation for required fields
      if (!name || !openingDate || !closingDate || !selectedHeadquarters) {
        throw new Error("Please complete all required fields.");
      }
  
      // Generate slug for the exhibition and upload images
      const slug = generateSlug(name);
      const galleryData = await uploadImages(slug);
      if (!galleryData) throw new Error("Image upload failed.");
  
      // Convert dates to Firestore Timestamps
      const openingDateTimestamp = Timestamp.fromDate(new Date(openingDate));
      const closingDateTimestamp = Timestamp.fromDate(new Date(closingDate));
  
      // Reception time remains a string
      const receptionTimeString = receptionTime || "";  // Just store the string value
  
      // Construct the new exhibition data
      const newExhibitionData = {
        ...formData,
        slug,
        gallery: galleryData || [],
        openingDate: openingDateTimestamp || null,
        closingDate: closingDateTimestamp || null,
        receptionTime: receptionTimeString || "",
        headquartersId: selectedHeadquarters || null,
        artists: selectedArtists.map((artistSlug) => {
          const artist = artists.find((a) => a.slug === artistSlug);  // Get the artist object
      
          return {
            artistId: artist?.id || null,  // Ensure we have the artist ID
            name: artist?.name || "",      // Ensure we have the artist's name
            slug: artist?.slug || "",      // Ensure we have the artist's slug
            selectedArtworks: selectedArtworks[artistSlug] || [],  // Ensure artworks are selected
          };
        }),
      };
      
      console.log("Exhibition Data to Add:", newExhibitionData);  // Log the final data
      
      // Add the document to Firestore
      const exhibitionRef = await addDoc(collection(firestore, "exhibitions"), newExhibitionData);
      
  
      // Update the `exhibitions` field in the selected headquarters document
      const headquartersRef = doc(firestore, "sedes", selectedHeadquarters);
      await updateDoc(headquartersRef, {
        exhibitions: arrayUnion(exhibitionRef.id),
      });
  
      // Set success message
      setSuccess("Exhibition added successfully!");
  
      // Clear form fields after submission
      resetForm();
    } catch (error) {
      console.error("Error adding document:", error);
      setError("Failed to add exhibition. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  
  

  return (
    <div className={styles.form}>
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
            <li key={index}>{text}</li>
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
      <DatePicker
        selected={formData.receptionDate}
        onChange={(date) => handleDateChange("receptionDate", date)}
        placeholderText="Reception Date"
      />
      <input
        type="time"
        name="receptionTime"
        placeholder="Reception Time (e.g., 6:00 PM)"
        value={formData.receptionTime || ""}
        onChange={handleInputChange}
      />


      <div>
        <label>Headquarters</label>
        <select
          value={selectedHeadquarters}
          onChange={(e) => setSelectedHeadquarters(e.target.value)}
        >
          <option value="">Select Headquarters</option>
          {headquarters.map((hq) => (
            <option key={hq.id} value={hq.id}>
              {hq.name}
            </option>
          ))}
        </select>
      </div>

      <div>
  <p>Artists</p>
  {artists.map((artist) => (
    <div key={artist.slug}>
      <label>
        <input
          type="checkbox"
          checked={selectedArtists.includes(artist.slug)}
          onChange={() => handleArtistSelection(artist)} // Pass artist object
        />
        {artist.name}
      </label>
      {selectedArtists.includes(artist.slug) && (
        <div>
          <p>Select Artworks</p>
          {artist.artworks.map((artwork) => (
            <label key={artwork.slug}>
              <input
                type="checkbox"
                checked={
                  selectedArtworks[artist.slug]?.includes(artwork.slug) || false
                }
                onChange={() =>
                  handleArtworkSelection(artist.slug, artwork.slug) // Pass slugs
                }
              />
              {artwork.title}
            </label>
          ))}
        </div>
      )}
    </div>
  ))}
</div>




      <div>
        <p>Exhibition Images</p>
        <input type="file" multiple onChange={handleFileChange} ref={fileInputRef}/>
        {images.map((_, index) => (
          <div key={index}>
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

      {/* Error Message */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Success Message */}
      {success && <p className={styles.success}>{success}</p>} {/* Optional: Add CSS for success messages */}

      {/* Submit Button */}
      <button type="button" onClick={addNewExhibition} disabled={loading}>
        {loading ? "Uploading..." : "Add Exhibition"}
      </button>
    </div>
  );
}