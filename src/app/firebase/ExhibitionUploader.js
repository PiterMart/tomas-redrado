"use client"
import { useEffect, useState, useRef } from "react";
import { firestore, storage } from "./firebaseConfig";
import { getDocs, addDoc, collection, doc, updateDoc, Timestamp, arrayUnion, getDoc } from "firebase/firestore";  
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../styles/page.module.css";

export default function ExhibitionForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState({}); 
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedArtworks, setSelectedArtworks] = useState({});
  const [headquarters, setHeadquarters] = useState([]);
  const [selectedHeadquarters, setSelectedHeadquarters] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    curator: "",
    curatorialTexts: [],
    openingDate: null,
    closingDate: null,
    receptionDate: null,
    receptionTime: "",
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
  
        const artistsWithArtworks = await Promise.all(
          artists.map(async (artist) => {
            const artworksData = artist.artworks || [];
            const artworks = await Promise.all(
              artworksData.map(async (artworkId) => {
                const artworkDoc = await getDoc(doc(firestore, "artworks", artworkId));
                return artworkDoc.exists()
                  ? { id: artworkDoc.id, ...artworkDoc.data() } // Include the id explicitly
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
      } catch (error) {
        console.error("Error fetching artist data:", error);
      }
    };

    const fetchHeadquarters = async () => {
      try {
        const headquartersSnapshot = await getDocs(collection(firestore, "headquarters"));
        setHeadquarters(headquartersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching headquarters data:", error);
      }
    };
  
    fetchArtistData();
    fetchHeadquarters();
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

  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    setBannerImage(file);
    setBannerPreview(file ? URL.createObjectURL(file) : null);
  };

  const uploadBannerImage = async (exhibitionSlug) => {
    if (!bannerImage && images.length === 0) {
      throw new Error("No images provided for the banner fallback.");
    }

    const bannerFile = bannerImage || images[0]; // Use the banner image or fallback to the first gallery image.
    const bannerRef = ref(
      storage,
      `exhibitions/${exhibitionSlug}/images/${exhibitionSlug}_banner`
    );
    await uploadBytes(bannerRef, bannerFile);
    return await getDownloadURL(bannerRef);
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
      const imageRef = ref(storage, `exhibitions/${exhibitionSlug}/images/${exhibitionSlug}_image_${i + 1}`);
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
      fileInputRef.current.value = ""; 
    }
  }

  const addNewExhibition = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
  
    try {
      const { name, openingDate, closingDate, receptionTime } = formData;
  

      if (!name || !openingDate || !closingDate || !selectedHeadquarters) {
        throw new Error("Please complete all required fields.");
      }
  

      const slug = generateSlug(name);

      const galleryData = await uploadImages(slug);
      if (!galleryData) throw new Error("Image upload failed.");

      const bannerUrl = await uploadBannerImage(slug);
  

      const openingDateTimestamp = Timestamp.fromDate(new Date(openingDate));
      const closingDateTimestamp = Timestamp.fromDate(new Date(closingDate));
  

      const newExhibitionData = {
        ...formData,
        slug,
        gallery: galleryData,
        banner: bannerUrl,
        openingDate: openingDateTimestamp,
        closingDate: closingDateTimestamp,
        receptionTime: formData.receptionTime || "",
        headquartersId: selectedHeadquarters,
        artists: selectedArtists.map((artistSlug) => ({
          artistSlug,
          selectedArtworks: selectedArtworks[artistSlug] || [], 
        })),
      };
  

      console.log("Selected Artworks State:", selectedArtworks);
  
      console.log("Exhibition Data:", newExhibitionData);
  

      const exhibitionRef = await addDoc(collection(firestore, "exhibitions"), newExhibitionData);
  

      const headquartersRef = doc(firestore, "headquarters", selectedHeadquarters);
      await updateDoc(headquartersRef, {
        exhibitions: arrayUnion(exhibitionRef.id),
      });
  

      for (const artistSlug of selectedArtists) {
        const artist = artists.find((a) => a.slug === artistSlug);
        if (artist?.slug) {  
          const artistRef = doc(firestore, "artists", artist.slug); 
          await updateDoc(artistRef, {
            exhibitions: arrayUnion(exhibitionRef.id),
          });
        }
      }

      for (const artistSlug of Object.keys(selectedArtworks)) {
        const artworks = selectedArtworks[artistSlug];
        for (const artworkId of artworks) {
          const artworkRef = doc(firestore, "artworks", artworkId);
          await updateDoc(artworkRef, {
            exhibitions: arrayUnion(exhibitionRef.id),
          });
        }
      }
      
      setSuccess("Exhibition added successfully!");
      resetForm();
    } catch (error) {
      console.error("Error adding document:", error);
      setError("Failed to add exhibition. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  
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

      {artists.map((artist) => (
      <div key={artist.slug}>
        <input
          type="checkbox"
          checked={selectedArtists.includes(artist.slug)}
          onChange={() => handleArtistSelection(artist)}
        />
        <label>{artist.name}</label>
        {selectedArtists.includes(artist.slug) && (
          <div>
            <h4>Select Artworks</h4>
            {artist.artworks.map((artwork) => (
            <div key={artwork.id}>
              <input
                type="checkbox"
                checked={selectedArtworks[artist.slug]?.includes(artwork.id) || false} // Use artwork.id
                onChange={() => handleArtworkSelection(artist.slug, artwork.id)} // Pass artwork.id
              />
              <label>{artwork.title}</label> {/* Display artwork title */}
            </div>
          ))}
          </div>
        )}
      </div>
    ))}
    </div>

      <div>
        <p>Exhibition Images</p>
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
      <div>
        <p>Banner Image</p>
        <input type="file" onChange={handleBannerChange} />
        {bannerPreview && (
          <img
            src={bannerPreview}
            alt="Banner Preview"
            className={styles.artworkPreviewImage}
          />
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {success && <p className={styles.success}>{success}</p>} 

      <button type="button" onClick={addNewExhibition} disabled={loading}>
        {loading ? "Uploading..." : "Add Exhibition"}
      </button>
    </div>
  );
}