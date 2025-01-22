import React from "react";
import Link from "next/link";
import styles from "../../styles/embla.module.css"
import Image from "next/image"


const ExhibitionLayout = ({ slide }) => {
  const formatDate = (date) => {
    // Check if the date is a Firestore Timestamp or a JavaScript Date object
    if (date instanceof Date && !isNaN(date)) {
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    }
  
    // If it's a Firestore Timestamp, convert it to a Date object
    if (date && date.seconds) {
      const timestampDate = new Date(date.seconds * 1000);
      return timestampDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    }
  
    // If it's neither, return an empty string
    return "";
  };

  return (
    <div className={styles.embla__slide__inner}>
      <div className={styles.embla__slide__text}>
        <p style={{ fontSize: "1.25rem", fontWeight: "600" }}>{slide.name}</p>
        <p style={{ fontSize: "1rem", fontWeight: "400" }}>Tomas Redrado Art - {slide.headquarterSlug}</p>
          {formatDate(slide.openingDate)} - {formatDate(slide.closingDate)}
          <p style={{fontSize: '1rem', fontWeight: '100', bottom: '0', position: 'absolute', alignSelf: 'end', paddingBottom: '1rem'}}>[exhibition]</p>
      </div>
      <Link href={`/headquarters/${slide.headquarterSlug}/${slide.slug}`} style={{margin: '0px', padding: '0px', width: '100vw'}}>
        <Image
          className={styles.embla__slide__img}
          src={slide.banner}
          alt= "image of the exhibition"
          width={0}
          height={0}
          sizes="100vw"
          placeholder="empty"
          loading="lazy"
          quality={75} 
        />
      </Link>
    </div>
  );
};

export default ExhibitionLayout;
