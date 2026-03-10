"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAdvertisements } from "@/context/AdvertisementsContext";

const DEFAULT_VIP_INTERVAL_SEC = 60;

export default function VIPBannerAd() {
  const pathname = usePathname();
  const { vipAds, trackImpression, trackClick } = useAdvertisements() ?? { vipAds: [], trackImpression: async () => {}, trackClick: async () => {} };
  const [visible, setVisible] = useState(false);
  const [currentAd, setCurrentAd] = useState<(typeof vipAds)[0] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (vipAds.length === 0) return;

    const showBanner = () => {
      const ad = vipAds[Math.floor(Math.random() * vipAds.length)];
      if (ad) {
        setCurrentAd(ad);
        setVisible(true);
        trackImpression(ad, "vip-banner");
      }
    };

    showBanner();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [vipAds, trackImpression, pathname]);

  const scheduleNext = (ad: (typeof vipAds)[0]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const sec = ad?.vip_interval_seconds ?? DEFAULT_VIP_INTERVAL_SEC;
    const ms = Math.min(3600, Math.max(10, sec)) * 1000;
    timerRef.current = setTimeout(() => {
      const next = vipAds[Math.floor(Math.random() * vipAds.length)];
      if (next) {
        setCurrentAd(next);
        setVisible(true);
        trackImpression(next, "vip-banner");
      }
      timerRef.current = null;
    }, ms);
  };

  const handleClose = () => {
    setVisible(false);
    if (currentAd) scheduleNext(currentAd);
  };

  const handleClick = () => {
    if (currentAd) {
      trackClick(currentAd, "vip-banner");
      window.open(currentAd.target_url, "_blank", "noopener,noreferrer");
      setVisible(false);
      scheduleNext(currentAd);
    }
  };

  if (!visible || !currentAd) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden bg-[#16161a] border border-white/10 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="დახურვა"
        >
          <X size={20} />
        </button>
        <button
          onClick={handleClick}
          className="block w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
        >
          <img
            src={currentAd.image_url}
            alt={currentAd.title || "რეკლამა"}
            className="w-full h-auto max-h-[85vh] object-contain"
          />
        </button>
      </div>
    </div>
  );
}
