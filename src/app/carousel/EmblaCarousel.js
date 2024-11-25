import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import ExhibitionLayout from "./layouts/ExhibitionLayout";
import ArtworkLayout from "./layouts/ArtworkLayout";
import styles from "../styles/embla.module.css";
import PictureLayout from "./layouts/PictureLayout"

const layouts = {
  exhibition: ExhibitionLayout,
  artwork: ArtworkLayout,
  picture: PictureLayout,
};

const EmblaCarousel = ({ slides, options = {}, type }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      speed: 5,
      draggable: true,
      ...options,
    },
    [Autoplay({ playOnInit: true, delay: 7000 })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const LayoutComponent = layouts[type];

  return (
    <section className={styles.embla}>
      <div className={styles.embla__viewport} ref={emblaRef}>
        <div className={styles.embla__container}>
          {slides.map((slide, index) => (
            <div className={styles.embla__slide} key={index}>
              {LayoutComponent ? <LayoutComponent slide={slide} /> : null}
            </div>
          ))}
        </div>
      </div>

      <button
        className={styles.embla__button__prev}
        onClick={scrollPrev}
        aria-label="Scroll to previous slide"
      >
        {"<"}
      </button>
      <button
        className={styles.embla__button__next}
        onClick={scrollNext}
        aria-label="Scroll to next slide"
      >
        {">"}
      </button>
    </section>
  );
};

export default EmblaCarousel;