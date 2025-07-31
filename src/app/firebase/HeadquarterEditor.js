"use client"
import { useEffect, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection, doc, updateDoc, getDoc } from "firebase/firestore";
import styles from "../styles/page.module.css";

// Initial empty state for the residency schedule item
const initialScheduleItem = { month: { en: "", es: "" }, artists: [{ name: "", artistId: "" }] };

export default function HeadquarterEditor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [headquartersList, setHeadquartersList] = useState([]);
  const [selectedHeadquarterId, setSelectedHeadquarterId] = useState("");
  const [formData, setFormData] = useState(null);

  // Fetch all headquarters for the dropdown selector
  useEffect(() => {
    const fetchHeadquarters = async () => {
      try {
        const headquartersSnapshot = await getDocs(collection(firestore, "headquarters"));
        const hqList = headquartersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setHeadquartersList(hqList);
      } catch (error) {
        console.error("Error fetching headquarters list:", error);
        setError("Failed to fetch headquarters list.");
      }
    };
    fetchHeadquarters();
  }, []);

  const handleHeadquarterSelection = async (id) => {
    setSelectedHeadquarterId(id);
    if (!id) {
      setFormData(null);
      return;
    }
    setLoading(true);
    try {
      const hqDoc = await getDoc(doc(firestore, "headquarters", id));
      if (hqDoc.exists()) {
        const data = hqDoc.data();
        setFormData({
          name: data.name || "",
          location: data.location || "",
          phone: data.phone || "",
          type: data.type || "",
          arthouse: data.arthouse || "",
          arthouseimage: data.arthouseimage || "",
          about: {
            en: data.aboutEng || [],
            es: data.about || []
          },
          galleryProgram: {
            en: data.galleryProgram?.en || "",
            es: data.gallery || ""
          },
          residencyProgram: data.residencyProgram || {
            description: { en: [], es: [] },
            schedule: {},
          },
        });
      }
    } catch (err) {
      setError("Failed to load headquarter data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (field, lang, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));
  };
  
  const handleResidencyDescriptionChange = (lang, value) => {
    setFormData(prev => ({
      ...prev,
      residencyProgram: {
        ...prev.residencyProgram,
        description: {
          ...prev.residencyProgram.description,
          [lang]: value,
        },
      },
    }));
  };

  // --- FIXED STATE UPDATE LOGIC FOR RESIDENCY ---

  const handleResidencyChange = (year, monthIndex, artistIndex, field, value) => {
    setFormData(prev => {
      const newSchedule = {
        ...prev.residencyProgram.schedule,
        [year]: prev.residencyProgram.schedule[year].map((month, mIndex) => {
          if (mIndex !== monthIndex) return month;
          
          if (field === 'month.en' || field === 'month.es') {
            const lang = field.split('.')[1];
            return { ...month, month: { ...month.month, [lang]: value } };
          } else {
            return {
              ...month,
              artists: month.artists.map((artist, aIndex) => {
                if (aIndex !== artistIndex) return artist;
                return { ...artist, [field]: value };
              })
            };
          }
        })
      };
      return { ...prev, residencyProgram: { ...prev.residencyProgram, schedule: newSchedule }};
    });
  };

  const addArtistToMonth = (year, monthIndex) => {
    setFormData(prev => ({
      ...prev,
      residencyProgram: {
        ...prev.residencyProgram,
        schedule: {
          ...prev.residencyProgram.schedule,
          [year]: prev.residencyProgram.schedule[year].map((month, index) => 
            index === monthIndex
              ? { ...month, artists: [...month.artists, { name: "", artistId: "" }] }
              : month
          )
        }
      }
    }));
  };

  const removeArtistFromMonth = (year, monthIndex, artistIndex) => {
    setFormData(prev => ({
      ...prev,
      residencyProgram: {
        ...prev.residencyProgram,
        schedule: {
          ...prev.residencyProgram.schedule,
          [year]: prev.residencyProgram.schedule[year].map((month, index) =>
            index === monthIndex
              ? { ...month, artists: month.artists.filter((_, aIndex) => aIndex !== artistIndex) }
              : month
          )
        }
      }
    }));
  };

  const addMonthToSchedule = (year) => {
    setFormData(prev => {
      const currentYearSchedule = prev.residencyProgram.schedule[year] || [];
      return {
        ...prev,
        residencyProgram: {
          ...prev.residencyProgram,
          schedule: {
            ...prev.residencyProgram.schedule,
            [year]: [...currentYearSchedule, { ...initialScheduleItem }]
          }
        }
      };
    });
  };

  const removeMonthFromSchedule = (year, monthIndex) => {
    setFormData(prev => ({
      ...prev,
      residencyProgram: {
        ...prev.residencyProgram,
        schedule: {
          ...prev.residencyProgram.schedule,
          [year]: prev.residencyProgram.schedule[year].filter((_, index) => index !== monthIndex)
        }
      }
    }));
  };

  // --- END OF FIXED LOGIC ---

  const handleSubmit = async () => {
    if (!selectedHeadquarterId) {
      setError("Please select a headquarter to update.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const dataToUpdate = {
        name: formData.name,
        location: formData.location,
        phone: formData.phone,
        type: formData.type,
        arthouse: formData.arthouse,
        arthouseimage: formData.arthouseimage,
        about: formData.about.es,
        aboutEng: formData.about.en,
        gallery: formData.galleryProgram.es,
        residencyProgram: formData.residencyProgram,
      };

      const hqRef = doc(firestore, "headquarters", selectedHeadquarterId);
      await updateDoc(hqRef, dataToUpdate);
      setSuccess("Headquarter updated successfully!");
    } catch (err) {
      setError("Failed to update headquarter.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // JSX remains the same as the previous correct version...
  return (
    <div className={styles.form}>
      <h2>Headquarter Editor</h2>
      
      <label>Select Headquarter to Edit</label>
      <select value={selectedHeadquarterId} onChange={(e) => handleHeadquarterSelection(e.target.value)}>
        <option value="">-- Select a Headquarter --</option>
        {headquartersList.map((hq) => (
          <option key={hq.id} value={hq.id}>{hq.name}</option>
        ))}
      </select>

      {formData && (
        <>
          <input name="name" placeholder="Headquarter Name" value={formData.name} onChange={handleInputChange} />
          <input name="type" placeholder="Type (e.g. gallery + art residency)" value={formData.type} onChange={handleInputChange} />
          <input name="location" placeholder="Location" value={formData.location} onChange={handleInputChange} />
          <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleInputChange} />
          <hr />
          
          <label>About (English)</label>
          <textarea placeholder="About in English (one paragraph per line)" value={(formData.about.en || []).join('\n')} onChange={(e) => handleNestedInputChange('about', 'en', e.target.value.split('\n'))} />
          <label>About (Español)</label>
          <textarea placeholder="About in Spanish (one paragraph per line)" value={(formData.about.es || []).join('\n')} onChange={(e) => handleNestedInputChange('about', 'es', e.target.value.split('\n'))} />
          
          <label>Gallery Program Description (Español)</label>
          <textarea placeholder="Gallery Program Description" value={formData.galleryProgram.es} onChange={(e) => handleNestedInputChange('galleryProgram', 'es', e.target.value)} />
          <hr />
          
          <h3>Residency Program</h3>
          <label>Description (English)</label>
          <textarea placeholder="Residency Description (English)" value={(formData.residencyProgram.description.en || []).join('\n')} onChange={(e) => handleResidencyDescriptionChange('en', e.target.value.split('\n'))} />
          <label>Description (Español)</label>
          <textarea placeholder="Residency Description (Español)" value={(formData.residencyProgram.description.es || []).join('\n')} onChange={(e) => handleResidencyDescriptionChange('es', e.target.value.split('\n'))} />
          
          <h4>Residency Schedule</h4>
          {Object.keys(formData.residencyProgram.schedule).sort().map(year => (
            <div key={year} className={styles.yearSection}>
              <h4>{year}</h4>
              {formData.residencyProgram.schedule[year].map((monthData, monthIndex) => (
                <div key={monthIndex} className={styles.monthSection}>
                  <input placeholder="Month (EN)" value={monthData.month.en} onChange={(e) => handleResidencyChange(year, monthIndex, null, 'month.en', e.target.value)} />
                  <input placeholder="Month (ES)" value={monthData.month.es} onChange={(e) => handleResidencyChange(year, monthIndex, null, 'month.es', e.target.value)} />
                  {monthData.artists.map((artist, artistIndex) => (
                    <div key={artistIndex} className={styles.artistSection}>
                      <input placeholder="Artist Name" value={artist.name} onChange={(e) => handleResidencyChange(year, monthIndex, artistIndex, 'name', e.target.value)} />
                      <input placeholder="Artist ID (optional)" value={artist.artistId || ''} onChange={(e) => handleResidencyChange(year, monthIndex, artistIndex, 'artistId', e.target.value)} />
                      <button type="button" onClick={() => removeArtistFromMonth(year, monthIndex, artistIndex)}>Remove Artist</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArtistToMonth(year, monthIndex)}>Add Artist</button>
                  <button type="button" style={{color: 'red'}} onClick={() => removeMonthFromSchedule(year, monthIndex)}>Remove Month</button>
                </div>
              ))}
              <button type="button" onClick={() => addMonthToSchedule(year)}>Add Month to {year}</button>
            </div>
          ))}
          <button type="button" onClick={() => addMonthToSchedule(new Date().getFullYear() + 1)}>Add Slot to Next Year</button>

          <div style={{ margin: 'auto' }}>
            <p className={styles.subtitle}> ALL READY? </p>
            <button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? "Updating..." : "UPDATE HEADQUARTER"}
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
        </>
      )}
    </div>
  );
}