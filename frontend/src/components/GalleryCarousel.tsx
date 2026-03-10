"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ImageLightbox from "./ImageLightbox";

interface GalleryCarouselProps {
  images: { src: string; alt: string }[];
  intervalMs?: number;
}

function isLocalPath(src: string): boolean {
  return src.startsWith("/") || src.startsWith("./");
}

export default function GalleryCarousel({ images, intervalMs = 4000 }: GalleryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(goNext, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs, goNext]);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden bg-black/40">
      {/* Slides */}
      <div className="relative w-full h-full">
        {images.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out cursor-pointer ${
              i === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            onClick={() => i === currentIndex && setLightboxOpen(true)}
          >
            {isLocalPath(img.src) ? (
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white text-sm font-medium drop-shadow-lg">
              {img.alt}
            </div>
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <ImageLightbox
          src={images[currentIndex]?.src ?? ""}
          alt={images[currentIndex]?.alt ?? ""}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Nav buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all active:scale-95"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all active:scale-95"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
