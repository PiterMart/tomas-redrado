import React from "react";
import styles from "../../styles/embla.module.css"

const PictureLayout = ({ slide }) => {

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
  };

  return (
    <div className={styles.embla__slide__inner}>
      <img
          className={styles.embla__slide__img}
          src={slide.image}
          alt={slide.name}
        />
    </div>
  );
};

export default PictureLayout;
