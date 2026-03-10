"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

function isLocalPath(s: string): boolean {
  return s.startsWith("/") || s.startsWith("./");
}

export default function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen image"
    >
      {/* Close button - top right, touch-friendly */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 touch-manipulation"
        aria-label="Close"
      >
        <X size={22} className="sm:w-6 sm:h-6" />
      </button>

      {/* Image container - responsive, max size */}
      <div
        className="relative w-full h-[70vh] sm:h-[80vh] md:h-[85vh] max-w-6xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isLocalPath(src) ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Caption - bottom */}
      {alt && (
        <p className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-xl text-center text-white text-sm sm:text-base font-medium drop-shadow-lg">
          {alt}
        </p>
      )}
    </div>
  );
}
