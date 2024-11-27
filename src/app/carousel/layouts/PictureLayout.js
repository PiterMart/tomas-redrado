import React, { useState } from "react";
import Lightbox from "react-image-lightbox"; // Import Lightbox
import "react-image-lightbox/style.css"; // Import Lightbox styles
import styles from "../../styles/page.module.css";

const PictureLayout = ({ slide }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false); // Lightbox state
  const [photoIndex, setPhotoIndex] = useState(0); // Photo index for lightbox

  // Function to open lightbox
  const handleImageClick = () => {
    setPhotoIndex(0); // Reset to first image
    setIsLightboxOpen(true); // Open the lightbox
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className={styles.artist_page_image_container}>
        <img
          src={slide.image}
          alt={slide.title}
          style={{ width: "100%", cursor: "pointer" }} // Make image clickable
          onClick={handleImageClick} // Open lightbox on click
        />
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <Lightbox
          mainSrc={slide.image} // Use the current slide image
          onCloseRequest={() => setIsLightboxOpen(false)} // Close lightbox on request
        />
      )}
    </div>
  );
};

export default PictureLayout;
