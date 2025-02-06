"use client"
import { useEffect, useState, useRef } from "react";
import { firestore, storage } from "./firebaseConfig";
import { getDocs, addDoc, collection, doc, updateDoc, Timestamp, arrayUnion, getDoc } from "firebase/firestore";  
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../styles/page.module.css";
import { deleteObject, ref as storageRef } from "firebase/storage";
import imageCompression from 'browser-image-compression';

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
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    curator: "",
    curatorialTexts: [],
    openingDate: null,
    closingDate: null,
    receptionDate: null,
    receptionTime: "",
    slug: "",
  });
  const [newCuratorialText, setNewCuratorialText] = useState("");
  const [existingGallery, setExistingGallery] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imageDescriptions, setImageDescriptions] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [deletedExistingImages, setDeletedExistingImages] = useState([]);
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Compression options reference
  const compressionOptions = {
    maxSizeMB: 1.5,       // Maximum file size in MB
    maxWidthOrHeight: 2000, // Maximum dimension (width/height)
    useWebWorker: true,   // Use web worker for better performance
    fileType: 'image/webp', // Optional: convert to webp
    initialQuality: 0.8,  // Optional: initial quality (0-1)
  };

  /*  FETCHING STUFF */
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

    const fetchExhibitions = async () => {
      try {
        const exhibitionsSnapshot = await getDocs(collection(firestore, "exhibitions"));
        const exhibitionsList = exhibitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExhibitions(exhibitionsList);
      } catch (error) {
        console.error("Error fetching exhibitions:", error);
      }
    };

    fetchArtistData();
    fetchHeadquarters();
    fetchExhibitions();
  }, []);
  

  /* HANDLERS */

  const deleteImageFromStorage = async (imageUrl) => {
    try {
      const imageRef = refFromURL(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  };

  const handleExhibitionSelection = async (exhibitionId) => {
    setSelectedExhibition(exhibitionId);
    if (!exhibitionId) {
      resetForm();
      return;
    }
  
    try {
      const exhibitionDoc = await getDoc(doc(firestore, "exhibitions", exhibitionId));
      if (exhibitionDoc.exists()) {
        const data = exhibitionDoc.data();
        
        // Combine all form data into a single setFormData call
        setFormData({
          name: data.name,
          description: data.description || "",
          curator: data.curator || "",
          curatorialTexts: data.curatorialTexts || [],
          openingDate: data.openingDate?.toDate() || null,
          closingDate: data.closingDate?.toDate() || null,
          receptionDate: data.receptionDate ? 
            (data.receptionDate.toDate ? data.receptionDate.toDate() : new Date(data.receptionDate)) : 
            null,
          receptionTime: data.receptionTime || "",
          slug: data.slug || generateSlug(data.name),
        });
  
        // Keep the rest of the state updates
        setSelectedHeadquarters(data.headquartersId || "");
        setSelectedArtists(data.artists?.map(a => a.artistSlug) || []);
        
        const artworksSelection = {};
        data.artists?.forEach(artist => {
          artworksSelection[artist.artistSlug] = artist.selectedArtworks || [];
        });
        setSelectedArtworks(artworksSelection);
        
        const existingGalleryData = data.gallery || [];
        setExistingGallery(existingGalleryData);
        setImagePreviews(existingGalleryData.map(img => img.url));
        setImageDescriptions(existingGalleryData.map(img => img.description || ''));
        setBannerPreview(data.banner || null);
      }
    } catch (error) {
      console.error("Error loading exhibition data:", error);
      setError("Failed to load exhibition data.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { name, openingDate, closingDate } = formData;
      if (!name || !openingDate || !closingDate || !selectedHeadquarters) {
        throw new Error("Please complete all required fields.");
      }

      let slug;
      if (selectedExhibition) {
        slug = formData.slug;
      } else {
        slug = generateSlug(name);
      }

      let bannerUrl;
      try {
        bannerUrl = await uploadBannerImage(slug);
      } catch (error) {
        throw new Error("Banner image processing failed: " + error.message);
      }
  
      let galleryData = [];
      try {
        if (newImages.length > 0 || deletedExistingImages.length > 0) {
          galleryData = await uploadImages(slug);
        } else if (selectedExhibition) {
          galleryData = existingGallery;
        }
      } catch (error) {
        throw new Error("Gallery image processing failed: " + error.message);
      }

      const exhibitionData = {
        ...formData,
        slug,
        banner: bannerUrl,
        gallery: galleryData,
        openingDate: Timestamp.fromDate(new Date(openingDate)),
        closingDate: Timestamp.fromDate(new Date(closingDate)),
        receptionDate: formData.receptionDate ? Timestamp.fromDate(formData.receptionDate) : null,
        headquartersId: selectedHeadquarters,
        artists: selectedArtists.map(artistSlug => ({
          artistSlug,
          selectedArtworks: selectedArtworks[artistSlug] || [],
        })),
      };

      if (selectedExhibition) {
        await updateDoc(doc(firestore, "exhibitions", selectedExhibition), exhibitionData);
        if (deletedExistingImages.length > 0) {
          await Promise.all(
            deletedExistingImages.map(url => 
              deleteImageFromStorage(url).catch(error => {
                console.error("Failed to delete image:", url, error);
              })
            )
          );
        }
        setSuccess("Exhibition updated successfully!");
      } else {
        const exhibitionRef = await addDoc(collection(firestore, "exhibitions"), exhibitionData);
        const headquartersRef = doc(firestore, "headquarters", selectedHeadquarters);
        await updateDoc(headquartersRef, { exhibitions: arrayUnion(exhibitionRef.id) });

        for (const artistSlug of selectedArtists) {
          const artist = artists.find(a => a.slug === artistSlug);
          if (artist?.slug) {
            const artistRef = doc(firestore, "artists", artist.slug);
            await updateDoc(artistRef, { exhibitions: arrayUnion(exhibitionRef.id) });
          }
        }

        for (const artistSlug of Object.keys(selectedArtworks)) {
          const artworks = selectedArtworks[artistSlug];
          for (const artworkId of artworks) {
            const artworkRef = doc(firestore, "artworks", artworkId);
            await updateDoc(artworkRef, { exhibitions: arrayUnion(exhibitionRef.id) });
          }
        }
        setSuccess("Exhibition added successfully!");
      }

      resetForm();
      setDeletedExistingImages([]);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Failed to save exhibition.");
    } finally {
      setLoading(false);
    }
  };

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
    setNewImages(prev => [...prev, ...files]);
    
    // Create previews for new images only
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    // Initialize descriptions for new images
    setImageDescriptions(prev => [...prev, ...Array(files.length).fill('')]);
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


  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    setBannerImage(file);
    setBannerPreview(file ? URL.createObjectURL(file) : null);
  };

  const uploadBannerImage = async (slug) => {
    if (!bannerImage) return bannerPreview;
  
    try {
      const compressedFile = await imageCompression(bannerImage, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
      });
  
      const bannerRef = ref(storage, `exhibitions/${slug}/images/${slug}_banner`);
      await uploadBytes(bannerRef, compressedFile);
      return await getDownloadURL(bannerRef);
    } catch (error) {
      console.error("Error compressing banner image:", error);
      throw new Error("Banner image upload failed");
    }
  };

  const handleImageDescriptionChange = (index, value) => {
    const updatedDescriptions = [...imageDescriptions];
    updatedDescriptions[index] = value || "";
    setImageDescriptions(updatedDescriptions);
  };

  const handleDeleteImage = (index) => {
    // Check if it's an existing image (from Firestore)
    const isExistingImage = index < existingGallery.length;
  
    if (isExistingImage) {
      // Add to deleted images list
      setDeletedExistingImages(prev => [...prev, existingGallery[index].url]);
    } else {
      // Remove from new images list
      const newIndex = index - existingGallery.length;
      setNewImages(prev => prev.filter((_, i) => i !== newIndex));
    }
  
    // Remove from previews and descriptions
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageDescriptions(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleDescriptionChange = (index, value) => {
    const updatedDescriptions = [...imageDescriptions];
    updatedDescriptions[index] = value;
    setImageDescriptions(updatedDescriptions);
  };


// Modified uploadImages with compression
const uploadImages = async (slug) => {
  // Filter out deleted existing images
  const remainingExisting = existingGallery.filter(
    img => !deletedExistingImages.includes(img.url)
  );

  // Upload and compress new images
  const newGalleryEntries = await Promise.all(
    newImages.map(async (file, index) => {
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 2000,
          useWebWorker: true,
        });

        const imageRef = ref(storage, `exhibitions/${slug}/images/${slug}_gallery_${Date.now()}_${index}`);
        await uploadBytes(imageRef, compressedFile);
        const url = await getDownloadURL(imageRef);
        
        return {
          url,
          description: imageDescriptions[existingGallery.length + index] || ''
        };
      } catch (error) {
        console.error("Error compressing image:", error);
        throw new Error(`Failed to upload image ${index + 1}`);
      }
    })
  );

  // Update descriptions for remaining existing images
  const updatedExisting = remainingExisting.map((img, index) => ({
    ...img,
    description: imageDescriptions[index] || img.description
  }));

  return [...updatedExisting, ...newGalleryEntries];
};
  
  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      curator: "",
      curatorialTexts: [],
      openingDate: null,
      closingDate: null,
      receptionDate: null,
      receptionTime: "",
      slug: "",
    });
    setSelectedArtists([]);
    setSelectedArtworks({});
    setImages([]);
    setImageDescriptions([]);
    setImagePreviews([]);
    setNewCuratorialText("");
    setSelectedHeadquarters("");
    setSelectedExhibition(null);
    setBannerImage(null);
    setBannerPreview(null);
    setExistingGallery([]);
    setNewImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
            <div>
        <label>Select Exhibition to Edit</label>
        <select
          value={selectedExhibition || ""}
          onChange={(e) => handleExhibitionSelection(e.target.value)}
        >
          <option value="">Create New Exhibition</option>
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
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <textarea
        name="description"
        placeholder="Exhibition Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <input
        name="curator"
        placeholder="Curator Name"
        value={formData.curator}
        onChange={(e) => setFormData({ ...formData, curator: e.target.value })}
      />
      <div>
        <textarea
          placeholder="Add Curatorial Text"
          value={newCuratorialText}
          onChange={handleCuratorialTextChange}
        />
        <button onClick={addCuratorialText}>Add Curatorial Text</button>
        <ul>
          {formData.curatorialTexts?.map((text, index) => (
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
        {
          imagePreviews.map((preview, index) => (
            <div key={`image-${index}`} className={styles.imageContainer} style={{ display: 'flex', flexDirection: 'column', marginBottom: '3rem', borderBottom: '2px solid black', maxWidth: '900px'}}>
              <img 
                src={preview} 
                alt={`Preview ${index}`} 
                className={styles.previewImage}
                style={{width: '100%', height: "auto", margin: 'auto'}}
              />
              <textarea
                value={imageDescriptions[index] || ''}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                className={styles.imageDescription}
                placeholder="Image description..."
              />
                            <button
                type="button"
                style={{color: "red"}}
                onClick={() => handleDeleteImage(index)}
              >
                DELETE
              </button>
            </div>
          ))
        }
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
      <div style={{ margin: 'auto'}}>
      <p className={styles.subtitle}> ALL READY? </p>
      <button type="button" onClick={handleSubmit} disabled={loading}>
        {loading ? (selectedExhibition ? "Updating..." : "Uploading...") : (selectedExhibition ? "UPDATE EXHIBITION" : "ADD EXHIBITION")}
      </button>


      </div>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </div>
  );
}