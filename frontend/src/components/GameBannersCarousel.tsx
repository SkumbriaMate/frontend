"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

type GameBanner = {
  id: string;
  image_url: string;
  title?: string | null;
  sort_order: number;
};

const CARD_GAP = 12;
const PX_PER_SEC = 45;

export default function GameBannersCarousel() {
  const settings = useWebsiteSettings();
  const companyId = settings?.company_id ?? null;
  const [banners, setBanners] = useState<GameBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [setWidth, setSetWidth] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setLoading(false);
      return;
    }
    const url = companyId
      ? `${apiUrl}/api/public/game-banners?company_id=${companyId}`
      : `${apiUrl}/api/public/game-banners`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : { banners: [] }))
      .then((d) => setBanners(d.banners || []))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || banners.length <= 1) return;

    const measureSetWidth = () => {
      let w = 0;
      const n = Math.min(banners.length, track.children.length);
      for (let i = 0; i < n; i++) {
        w += (track.children[i] as HTMLElement).offsetWidth;
      }
      w += (n - 1) * CARD_GAP;
      setSetWidth(w);
    };

    measureSetWidth();
    const ro = new ResizeObserver(measureSetWidth);
    ro.observe(track);
    return () => ro.disconnect();
  }, [banners.length]);

  if (loading || banners.length === 0) return null;

  const setCount = 4;
  const duplicatedBanners = Array.from({ length: setCount }, () => [...banners]).flat();

  if (banners.length === 1) {
    return (
      <section className="section-padding bg-bg-secondary/50">
        <div className="section-container">
          <div className="text-center mb-6">
            <h2 className="page-title gradient-text">ითამაშე ჩვენი ტოპ თამაშები</h2>
            <p className="page-subtitle mx-auto text-sm">
              პოპულარული თამაშები ხელმისაწვდომია მთელ გეიმინგ კაფეში
            </p>
          </div>
          <div className="flex justify-center">
            <div className="w-[140px] h-[80px] sm:w-[180px] sm:h-[102px] lg:w-[220px] lg:h-[124px] rounded-xl overflow-hidden border border-white/10 bg-bg-card flex-shrink-0">
              <img
                src={banners[0]!.image_url}
                alt={banners[0]!.title || "Game banner"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const trackStyle = {
    "--set-width": `${setWidth}px`,
    width: "max-content",
    gap: CARD_GAP,
  } as React.CSSProperties;

  return (
    <section className="section-padding bg-bg-secondary/50 overflow-hidden">
      <style>{`
        @keyframes game-banner-carousel {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-1 * var(--set-width))); }
        }
        .game-banner-fullbleed {
          width: 100vw;
          margin-left: calc(-50vw + 50%);
          margin-right: calc(-50vw + 50%);
        }
        .game-banner-track::before,
        .game-banner-track::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 64px;
          pointer-events: none;
          z-index: 2;
        }
        .game-banner-track::before {
          left: 0;
          background: linear-gradient(to right, var(--bg-primary, #0F1115) 0%, transparent 100%);
        }
        .game-banner-track::after {
          right: 0;
          background: linear-gradient(to left, var(--bg-primary, #0F1115) 0%, transparent 100%);
        }
      `}</style>
      <div className="section-container">
        <div className="text-center mb-6">
          <h2 className="page-title gradient-text">ითამაშე ჩვენი ტოპ თამაშები</h2>
          <p className="page-subtitle mx-auto text-sm">
            პოპულარული თამაშები ხელმისაწვდომია მთელ გეიმინგ კაფეში
          </p>
        </div>
      </div>
      <div className="game-banner-fullbleed game-banner-track relative overflow-hidden">
        <div
          ref={trackRef}
          className="flex will-change-transform"
          style={
            setWidth > 0
              ? {
                  ...trackStyle,
                  animation: `game-banner-carousel ${setWidth / PX_PER_SEC}s linear infinite`,
                } as React.CSSProperties
              : trackStyle
          }
        >
          {duplicatedBanners.map((banner, i) => (
            <div
              key={`${banner.id}-${i}`}
              className="w-[140px] h-[80px] sm:w-[180px] sm:h-[102px] lg:w-[220px] lg:h-[124px] flex-shrink-0 rounded-xl overflow-hidden border border-white/10 bg-bg-card hover:border-neon-cyan/30 transition-colors"
            >
              <img
                src={banner.image_url}
                alt={banner.title || "Game banner"}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
