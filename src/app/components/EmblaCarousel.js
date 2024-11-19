import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import styles from "../styles/embla.module.css";
import React, { useCallback } from "react";
import Link from 'next/link';


const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return ""; // Handle invalid timestamp
  const date = new Date(timestamp.seconds * 1000); // Convert Firebase timestamp to JavaScript Date
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // Format: "29 Nov 2024"
};

const EmblaCarousel = (props) => {
  const { slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      speed: 5,
      draggable: true,
    },
    [Autoplay({ playOnInit: true, delay: 7000 })] // Plugins are passed as the second argument
  );

  // Functions to handle navigation
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className={styles.embla}>
      <div className={styles.embla__viewport} ref={emblaRef}>
        <div className={styles.embla__container}>
          {slides.map((slide, index) => (
            <div className={styles.embla__slide} key={index}>
              <div className={styles.embla__slide__inner}>
              <div className={styles.embla__slide__text}>
                <p style={{fontSize: '2rem', fontWeight: '600'}}>{slide.name}</p>
                <p style={{fontSize: '1.25rem', fontWeight: '400'}}>TRA - {slide.sedeSlug}</p>
                <p style={{fontSize: '1.25rem', fontWeight: '400'}}>{formatDate(slide.openingDate)} - {formatDate(slide.closingDate)}</p>
              </div>
              <Link href={`/exhibiciones/${slide.sedeSlug}/${slide.slug}`} style={{margin: '0px', padding: '0px', width: '100%'}}>
                <img
                  className={styles.embla__slide__img}
                  src={slide.image}
                  alt={slide.name}
                />
                </Link>
              </div>
            </div>
          ))}
        </div>
        {/* Navigation buttons */}
        <button className={styles.embla__button__prev} onClick={scrollPrev}>
          <img src="iconmonstr-arrow-left-circle-thin.svg" />
        </button>
        <button className={styles.embla__button__next} onClick={scrollNext}>
          <img src="iconmonstr-arrow-right-circle-thin.svg" />
        </button>
      </div>  
    </section>
  )
}

export default EmblaCarousel
