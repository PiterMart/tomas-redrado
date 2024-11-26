import React from "react";
// import styles from "../../styles/embla.module.css"
import styles from "../../styles/page.module.css";

const PictureLayout = ({ slide }) => {

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
    <div className={styles.artist_page_image_container}>
          <img src={slide.image} alt={slide.title} />
        </div>
        </div>
  );
};

export default PictureLayout;
