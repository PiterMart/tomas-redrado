"use client";
import { useEffect, useState, useRef } from "react";
import { firestore, storage } from "./firebaseConfig";
import { getDocs, addDoc, collection, doc, updateDoc, Timestamp, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import styles from "../styles/page.module.css";
import imageCompression from 'browser-image-compression';

export default function ArtistUploader() {
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
              if (!artworkDoc.exists()) return null;
              
              const artworkData = artworkDoc.data();
              return {
                id: artworkDoc.id,
                title: artworkData.title,
                date: artworkData.date,
                medium: artworkData.medium,
                measurements: artworkData.measurements,
                description: artworkData.description,
                url: artworkData.url,  // Ensure this matches Firestore field name
                detailImages: artworkData.detailImages || []  // Ensure this matches Firestore field name
              };
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

  const uploadProfilePicture = async (artistSlug) => {
    if (!(profilePictureFile instanceof File)) {
      return formData.profilePicture; // Return existing URL if no new file
    }
  
    try {
      const compressedFile = await imageCompression(profilePictureFile, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 800
      });
      
      const profilePicRef = ref(storage, `artists/${artistSlug}/profilePicture/${artistSlug}_profilePicture`);
      await uploadBytes(profilePicRef, compressedFile);
      return await getDownloadURL(profilePicRef);
    } catch (error) {
      console.error("Profile picture upload failed:", error);
      throw error;
    }
  };

  const uploadArtworkImages = async (artistSlug, artworkSlug, artworkData) => {
    try {
      if (!(artworkData.file instanceof File)) {
        throw new Error("Invalid main artwork file");
      }
  
      // Upload main artwork image
      const compressedMain = await imageCompression(artworkData.file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 2000,
        useWebWorker: true
      });
      
      const mainRef = ref(storage, `artists/${artistSlug}/artworks/${artworkSlug}/${artworkSlug}`);
      await uploadBytes(mainRef, compressedMain);
      const mainUrl = await getDownloadURL(mainRef);
  
      // Upload detail images
      const detailUrls = [];
      for (let imgIndex = 0; imgIndex < artworkData.images.length; imgIndex++) {
        const imageFile = artworkData.images[imgIndex];
        const compressedDetail = await imageCompression(imageFile, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 2000,
          useWebWorker: true
        });
        
        const detailRef = ref(
          storage, 
          `artists/${artistSlug}/artworks/${artworkSlug}/details/${artworkSlug}_detail_${imgIndex + 1}`
        );
        await uploadBytes(detailRef, compressedDetail);
        const detailUrl = await getDownloadURL(detailRef);
        detailUrls.push(detailUrl);
      }
  
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
      const artistId = selectedArtist || doc(collection(firestore, "artists")).id;
  
      // Upload profile picture
      const profilePicUrl = await uploadProfilePicture(slug);
  
      // Upload CV
      let cvUrl = formData.cvUrl || "";
      if (cvFile instanceof File) {
        const cvRef = ref(storage, `artists/${slug}/documents/cv`);
        await uploadBytes(cvRef, cvFile);
        cvUrl = await getDownloadURL(cvRef);
      }
  
      // Process artworks
      const artworkIds = [];
      // Process existing artworks
      for (const artwork of existingArtworks) {
        if (!artwork.id) { // New artwork added in form
          const artworkSlug = `${slug}_${generateSlug(artwork.title)}`;
          const { mainUrl, detailUrls } = await uploadArtworkImages(slug, artworkSlug, artwork);
          
          const artworkDoc = {
            artistId,
            artistSlug: slug,
            artworkSlug,
            title: artwork.title,
            date: artwork.date,
            medium: artwork.medium,
            measurements: artwork.measurements,
            description: artwork.description,
            extras: artwork.extras,
            url: mainUrl,
            images: detailUrls,
            exhibitions: [],
            fairs: [],
            createdAt: Timestamp.now()
          };
  
          const docRef = await addDoc(collection(firestore, "artworks"), artworkDoc);
          artworkIds.push(docRef.id); // Make sure this executes
        } else {
          artworkIds.push(artwork.id); // Push existing ID
        }
      }
  
      // Update/Create artist document
      const artistData = {
        name,
        origin,
        bio,
        manifesto,
        web,
        slug,
        profilePicture: profilePicUrl,
        cvUrl,
        birthDate: formData.birthDate ? Timestamp.fromDate(formData.birthDate) : null,
        artworks: artworkIds
      };
  
      if (selectedArtist) {
        await updateDoc(doc(firestore, "artists", selectedArtist), artistData);
        setSuccess("Artist updated successfully!");
      } else {
        const artistRef = doc(firestore, "artists", artistId);
        await setDoc(artistRef, artistData);
        setSelectedArtist(artistId);
        setSuccess("Artist created successfully!");
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
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };


  const resetForm = () => {
    if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
    if (newArtwork.file) URL.revokeObjectURL(URL.createObjectURL(newArtwork.file));
    newArtwork.images.forEach(file => URL.revokeObjectURL(URL.createObjectURL(file)));

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
  useEffect(() => {
    return () => {
      if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
    };
  }, [profilePicturePreview]);


  const deleteArtwork = async (index) => {
    try {
      const artworkToDelete = existingArtworks[index];
      
      // Add to deleted artworks list
      setDeletedArtworks(prev => [...prev, artworkToDelete]);
      
      // Remove from existing artworks
      setExistingArtworks(prev => prev.filter((_, i) => i !== index));
      
    } catch (error) {
      console.error("Error deleting artwork:", error);
      setError("Failed to delete artwork");
    }
  };

  const handleExistingArtworkChange = (index, field, value) => {
    setExistingArtworks(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleBirthDateChange = (e) => {
    setBirthDate(e.target.value);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file instanceof File) {
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    } else {
      setError("Invalid profile picture file");
    }
  };
  
  const handleNewArtworkFileChange = (e) => {
    const file = e.target.files[0];
    if (file instanceof File) {
      setNewArtwork(prev => ({ ...prev, file }));
    } else {
      setError("Please select a valid main artwork file");
    }
  };
  
  const handleArtworkImagesChange = (e) => {
    const files = Array.from(e.target.files).filter(file => file instanceof File);
    setNewArtwork(prev => ({ ...prev, images: files }));
  };

  const handleNewArtworkChange = (field, value) => {
    setNewArtwork((prevArtwork) => ({
      ...prevArtwork,
      [field]: value,
    }));
  };

  const addArtwork = () => {
    if (!(newArtwork.file instanceof File)) {
      setError("Please select a valid main image file");
      return;
    }
    if (!newArtwork.title.trim() || !newArtwork.medium.trim()) {
      setError("Title and Medium are required fields");
      return;
    }
  
    setExistingArtworks(prev => [...prev, newArtwork]);
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
  };

  const handleBioParagraphChange = (e) => {
    setNewBioParagraph(e.target.value);
  };

  const addBioParagraph = () => {
    if (newBioParagraph.trim()) {
      setFormData((prevData) => ({
        ...prevData,
        bio: [...prevData.bio, newBioParagraph.trim()],
      }));
      setNewBioParagraph("");
    }
  };

  const handleManifestoParagraphChange = (e) => {
    setNewManifestoParagraph(e.target.value);
  };

  const addManifestoParagraph = () => {
    if (newManifestoParagraph.trim()) {
      setFormData((prevData) => ({
        ...prevData,
        manifesto: [...prevData.manifesto, newManifestoParagraph.trim()],
      }));
      setNewManifestoParagraph("");
    }
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    setCvFile(file);
  };

  const addExtra = (index) => {
    if (newExtra.trim()) {
      handleExtraChange(index, newExtra.trim());
      setNewExtra("");
    }
  };

  const uploadCv = async (artistSlug) => {
    if (!cvFile) return null;
    const cvRef = ref(storage, `artists/${artistSlug}/cv/${artistSlug}_CV.pdf`);
    await uploadBytes(cvRef, cvFile);
    return await getDownloadURL(cvRef);
  };

  return (
    <div className={styles.form}>
      <div>
        <label>Select Artist to Edit</label>
        <select
          value={selectedArtist || ""}
          onChange={(e) => handleArtistSelection(e.target.value)}
        >
          <option value="">Create New Artist</option>
          {artists.map(artist => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>
      </div>
      {/* Profile Picture Upload */}
      <div>
        <label>Profile Picture</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setProfilePictureFile(e.target.files[0]);
            setProfilePicturePreview(URL.createObjectURL(e.target.files[0]));
          }}
        />
        {profilePicturePreview && (
          <img src={profilePicturePreview} alt="Profile Preview" className={styles.profilePreview} />
        )}
      </div>

      {/* Name Input */}
      <p className={styles.subtitle}>NAME</p>
      <input
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <p className={styles.subtitle}>ORIGIN</p>

      {/* Origin Input */}
      <input
        name="origin"
        placeholder="Origen"
        value={formData.origin}
        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
      />
      <p className={styles.subtitle}>BIRTH DATEE</p>

      {/* Birth Date Input */}
      <input
        type="date"
        name="birthDate"
        value={formData.birthDate ? formData.birthDate.toISOString().split('T')[0] : ''}
        onChange={(e) => setFormData({ ...formData, birthDate: new Date(e.target.value) })}
      />

      {/* Bio Paragraphs Input */}
      <div>
        <p className={styles.subtitle}>BIO</p>
        <textarea
          placeholder="Add Bio Text"
          value={newBioParagraph}  // Changed from newBio to newBioParagraph
          onChange={handleBioParagraphChange}
        />
        <button type="button" onClick={addBioParagraph}>Add Bio Paragraph</button>
      </div>
      <div>
        {formData.bio.map((paragraph, index) => (
          <div key={index} className={styles.paragraphContainer}>
            <textarea
              value={paragraph}
              onChange={(e) => {
                const updatedBio = [...formData.bio];
                updatedBio[index] = e.target.value;
                setFormData({ ...formData, bio: updatedBio });
              }}
            />
            <button
              onClick={() => {
                const updatedBio = formData.bio.filter((_, i) => i !== index);
                setFormData({ ...formData, bio: updatedBio });
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Manifesto Paragraphs Input */}
      <div>
        <p className={styles.subtitle}>MANIFESTO</p>
        <textarea
          placeholder="Add a paragraph to your manifesto"
          value={newManifestoParagraph}
          onChange={handleManifestoParagraphChange}
        />
        <button type="button" onClick={addManifestoParagraph}>Add Manifesto Paragraph</button>
      </div>
      <div>
        {formData.manifesto.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* Website Input */}
      <p className={styles.subtitle}>WEBSITE</p>
        <input
          name="web"
          placeholder="Website"
          value={formData.web}
          onChange={(e) => setFormData({ ...formData, web: e.target.value })}
        />

      {/* CV File Input */}
      <p className={styles.subtitle}>CV (PDF)</p>
      <input type="file" name="cv" accept=".pdf" onChange={handleCvChange} />

      {/* Gallery Images Input */}
      <p className={styles.subtitle}>Artworks</p>
                {/* Current Artwork Preview */}

      {/* Display Previews for Selected Images */}
      <div className={styles.artworkFormSection}>
        <h3>Add New Artwork</h3>
        
        {/* Artwork Metadata Inputs */}
        <div className={styles.artworkMetadata}>
          <input
            type="text"
            placeholder="Title *"
            value={newArtwork.title}
            onChange={(e) => handleNewArtworkChange('title', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Date *"
            value={newArtwork.date}
            onChange={(e) => handleNewArtworkChange('date', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Medium *"
            value={newArtwork.medium}
            onChange={(e) => handleNewArtworkChange('medium', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Measurements"
            value={newArtwork.measurements}
            onChange={(e) => handleNewArtworkChange('measurements', e.target.value)}
          />
          <textarea
            placeholder="Description *"
            value={newArtwork.description}
            onChange={(e) => handleNewArtworkChange('description', e.target.value)}
            required
          />
        </div>

        {/* Image Upload Sections */}
        <div className={styles.imageUploadSection}>
          <div className={styles.uploadGroup}>
            <label>Main Artwork Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleNewArtworkFileChange}
              required
            />
          </div>

          <div className={styles.uploadGroup}>
            <label>Detail Images (Multiple allowed)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleArtworkImagesChange}
            />
          </div>

          {/* Preview Section */}
          <div className={styles.previews}>
          {newArtwork.file && (
            <div className={styles.mainPreview}>
              <p>Main Image Preview:</p>
              <img
                src={URL.createObjectURL(newArtwork.file)}
                alt="Main artwork preview"
                onLoad={() => URL.revokeObjectURL(URL.createObjectURL(newArtwork.file))}
              />
            </div>
          )}
            
            {newArtwork.images.length > 0 && (
              <div className={styles.detailPreviews}>
                <p>Detail Images Preview:</p>
                <div className={styles.detailImages}>
                  {newArtwork.images.map((file, index) => (
                    <img
                      key={index}
                      src={URL.createObjectURL(file)}
                      alt={`Detail preview ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          type="button" 
          onClick={addArtwork}
          disabled={!newArtwork.file || !newArtwork.title || !newArtwork.medium}
        >
          Add Artwork to Collection
        </button>
      </div>

      {existingArtworks.map((artwork, index) => (
        <div key={index} className={styles.artwork}>
          <p>Artwork {index + 1}</p>
          
          {/* Main Image Preview */}
            <img 
              src={artwork.url} 
              alt="Main Artwork Preview" 
              className={styles.artworkPreviewImage} 
            />

          {/* Detail Images Preview */}
          <div className={styles.detailImagesContainer}>
            {artwork.images?.map((imgUrl, imgIndex) => (
              <img
                key={imgIndex}
                src={imgUrl}
                alt={`Detail ${imgIndex + 1}`}
                className={styles.detailPreviewImage}
              />
            ))}
          </div>

          {/* Editable Fields */}
          <input
            type="text"
            placeholder="Title"
            value={artwork.title}
            onChange={(e) => handleExistingArtworkChange(index, 'title', e.target.value)}
          />
          <input
            type="text"
            placeholder="Date"
            value={artwork.date}
            onChange={(e) => handleExistingArtworkChange(index, 'date', e.target.value)}
          />
          <input
            type="text"
            placeholder="Medium"
            value={artwork.medium}
            onChange={(e) => handleExistingArtworkChange(index, 'medium', e.target.value)}
          />
          <input
            type="text"
            placeholder="Measurements"
            value={artwork.measurements}
            onChange={(e) => handleExistingArtworkChange(index, 'measurements', e.target.value)}
          />
          <textarea
            placeholder="Description"
            value={artwork.description}
            onChange={(e) => handleExistingArtworkChange(index, 'description', e.target.value)}
          />

          <button type="button" onClick={() => deleteArtwork(index)}>
            Delete
          </button>
        </div>
      ))}

      {/* Error Message */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Success Message */}
      {success && <p className={styles.success}>{success}</p>} {/* Optional: Add CSS for success messages */}

      {/* Submit Button */}
      <button type="button" onClick={handleSubmit} disabled={loading}>
        {loading ? "Processing..." : selectedArtist ? "Update Artist" : "Create Artist"}
      </button>
    </div>
  );
}