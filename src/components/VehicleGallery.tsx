"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import styles from "./VehicleGallery.module.css";

type Props = {
  images: string[];
  alt: string;
};

export function VehicleGallery({ images, alt }: Props) {
  const [mainSlider, setMainSlider] = useState<Slider | null>(null);
  const [thumbSlider, setThumbSlider] = useState<Slider | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbsContainerRef = useRef<HTMLDivElement>(null);

  const thumbsToShow = Math.min(images.length, 5);

  // react-slick marks off-screen thumbnail slides aria-hidden but doesn't
  // remove their contents from the tab order, which fails the "aria-hidden
  // elements must not contain focusable descendants" a11y rule — it manages
  // that attribute itself with no prop to hook into, so a MutationObserver
  // is the only way to keep our buttons' tabIndex in sync with it.
  useEffect(() => {
    const container = thumbsContainerRef.current;
    if (!container) return;

    function syncTabIndex() {
      const slides = container!.querySelectorAll<HTMLElement>(".slick-slide");
      slides.forEach((slide) => {
        const button = slide.querySelector<HTMLButtonElement>("button");
        if (!button) return;
        button.tabIndex = slide.getAttribute("aria-hidden") === "true" ? -1 : 0;
      });
    }

    syncTabIndex();
    const observer = new MutationObserver(syncTabIndex);
    observer.observe(container, { attributes: true, attributeFilter: ["aria-hidden"], subtree: true });
    return () => observer.disconnect();
  }, [images.length]);

  return (
    <div className={styles.gallery}>
      <Slider
        asNavFor={thumbSlider ?? undefined}
        ref={setMainSlider}
        arrows={false}
        dots={false}
        afterChange={setActiveIndex}
      >
        {images.map((src, index) => (
          <div key={src}>
            <Image
              src={src}
              alt={`${alt} photo ${index + 1}`}
              width={800}
              height={600}
              unoptimized
              priority={index === 0}
              className={styles.mainImage}
            />
          </div>
        ))}
      </Slider>

      <div ref={thumbsContainerRef}>
        <Slider
          asNavFor={mainSlider ?? undefined}
          ref={setThumbSlider}
          slidesToShow={thumbsToShow}
          slidesToScroll={1}
          swipeToSlide
          focusOnSelect
          infinite={false}
          className={styles.thumbs}
          responsive={[
            { breakpoint: 800, settings: { slidesToShow: Math.min(images.length, 3) } },
          ]}
        >
          {images.map((src, index) => (
            <div key={src} className={styles.thumbSlide}>
              <button
                type="button"
                className={styles.thumbButton}
                aria-label={`View photo ${index + 1} of ${images.length}`}
                aria-current={activeIndex === index}
                onClick={() => mainSlider?.slickGoTo(index)}
              >
                <Image
                  src={src}
                  alt=""
                  width={160}
                  height={120}
                  unoptimized
                  className={styles.thumbImage}
                />
              </button>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}
