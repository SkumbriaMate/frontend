"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { useAdvertisements } from "@/context/AdvertisementsContext";
import type { Ad } from "@/context/AdvertisementsContext";

const CARD_WIDTH = 320;
const CARD_GAP = 16;
const PX_PER_SEC = 50;

export default function NormalAdSlot() {
  const ctx = useAdvertisements();
  const trackedRef = useRef<Set<string>>(new Set());

  const normalAds = ctx?.normalAds ?? [];
  const sortedAds = [...normalAds].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  useEffect(() => {
    if (!ctx || sortedAds.length === 0) return;
    sortedAds.forEach((ad) => {
      if (!trackedRef.current.has(ad.id)) {
        trackedRef.current.add(ad.id);
        ctx.trackImpression(ad, "normal-slot");
      }
    });
  }, [ctx, sortedAds]);

  const setWidth =
    sortedAds.length * CARD_WIDTH + Math.max(0, sortedAds.length - 1) * CARD_GAP;
  const durationSec = setWidth / PX_PER_SEC;

  if (!ctx || sortedAds.length === 0) return null;

  const handleClick = (ad: Ad) => {
    ctx.trackClick(ad, "normal-slot");
    window.open(ad.target_url, "_blank", "noopener,noreferrer");
  };

  const AdCard = ({ ad }: { ad: Ad }) => (
    <a
      href={ad.target_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        handleClick(ad);
      }}
      className="flex-shrink-0 block rounded-xl overflow-hidden border border-white/10 bg-bg-secondary/50 hover:border-neon-cyan/30 transition-colors focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
      style={{ width: CARD_WIDTH }}
    >
      <img
        src={ad.image_url}
        alt={ad.title}
        loading="eager"
        className="w-full h-40 object-cover"
      />
    </a>
  );

  if (sortedAds.length === 1) {
    return (
      <section className="section-padding">
        <div className="section-container">
          <AdCard ad={sortedAds[0]!} />
        </div>
      </section>
    );
  }

  const setCount = 4;
  const duplicatedAds = Array.from({ length: setCount }, () => [...sortedAds]).flat();

  return (
    <section className="section-padding overflow-hidden">
      <style>{`
        @keyframes normal-ad-carousel {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-1 * var(--set-width))); }
        }
      `}</style>
      <div className="section-container">
        <div className="relative w-full overflow-hidden rounded-2xl">
          <div
            className="flex gap-4 will-change-transform"
            style={
              {
                "--set-width": `${setWidth}px`,
                width: "max-content",
                gap: CARD_GAP,
                animation: `normal-ad-carousel ${durationSec}s linear infinite`,
              } as React.CSSProperties
            }
          >
            {duplicatedAds.map((ad, i) => (
              <AdCard key={`${ad.id}-${i}`} ad={ad} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
