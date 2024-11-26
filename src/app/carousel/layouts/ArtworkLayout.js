import React from "react";
import Link from "next/link";
import styles from "../../styles/page.module.css";

const ArtworkLayout = ({ slide }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Link href={`/artworks/${slide.slug}`}>
        <div className={styles.artist_page_image_container}>
          <img src={slide.url} alt={slide.title} />
        </div>
      </Link>
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <p>{slide.title}</p>
          <p>{slide.date}</p>
        </div>
        <div style={{ color: "gray" }}>
          <p>{slide.medium}</p>
          <p>{slide.measurements}</p>
          {/* <p>{slide.extra}</p>
          <p>{slide.description}</p> */}
        </div>
      </div>
    </div>
  );
};

export default ArtworkLayout;
