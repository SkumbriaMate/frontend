"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useWebsiteSettings } from "./WebsiteSettingsContext";

const PATH_TO_PLACEMENT: Record<string, string> = {
  "/": "home",
  "/stations": "stations",
  "/reserve": "reserve",
  "/events": "events",
  "/about": "about",
  "/contact": "contact",
};

export type Ad = {
  id: string;
  title: string;
  image_url: string;
  target_url: string;
  ad_type: "vip" | "normal";
  placement: string;
  priority?: number;
  vip_interval_seconds?: number | null;
};

type AdvertisementsContextValue = {
  vipAds: Ad[];
  normalAds: Ad[];
  getRandomNormalAd: () => Ad | null;
  placement: string;
  trackImpression: (ad: Ad, section?: string) => void;
  trackClick: (ad: Ad, section?: string) => void;
};

const AdvertisementsContext = createContext<AdvertisementsContextValue | null>(null);

export function AdvertisementsProvider({ children }: { children: React.ReactNode }) {
  const settings = useWebsiteSettings();
  const pathname = usePathname();
  const companyId = settings?.company_id ?? null;
  const [ads, setAds] = useState<Ad[]>([]);

  const placement = pathname ? (PATH_TO_PLACEMENT[pathname] || "home") : "home";

  useEffect(() => {
    if (!companyId || pathname?.startsWith("/admin")) {
      setAds([]);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    fetch(`${apiUrl}/api/public/advertisements?company_id=${companyId}&placement=${placement}`)
      .then((r) => (r.ok ? r.json() : { advertisements: [] }))
      .then((d) => {
        const filtered = d.advertisements || [];
        setAds(filtered);
      })
      .catch(() => setAds([]));
  }, [companyId, placement]);

  const vipAds = ads.filter((a) => a.ad_type === "vip");
  const normalAds = ads.filter((a) => a.ad_type === "normal");

  const getRandomNormalAd = useCallback((): Ad | null => {
    if (normalAds.length === 0) return null;
    return normalAds[Math.floor(Math.random() * normalAds.length)] ?? null;
  }, [normalAds]);

  const trackImpression = useCallback(
    async (ad: Ad, section = "content") => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return;
      try {
        await fetch(`${apiUrl}/api/public/advertisements/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            advertisement_id: ad.id,
            event_type: "impression",
            page: pathname || "/",
            section,
          }),
        });
      } catch {
        /* ignore */
      }
    },
    [pathname]
  );

  const trackClick = useCallback(
    async (ad: Ad, section = "content") => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return;
      try {
        await fetch(`${apiUrl}/api/public/advertisements/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            advertisement_id: ad.id,
            event_type: "click",
            page: pathname || "/",
            section,
          }),
        });
      } catch {
        /* ignore */
      }
    },
    [pathname]
  );

  const value: AdvertisementsContextValue = {
    vipAds,
    normalAds,
    getRandomNormalAd,
    placement,
    trackImpression,
    trackClick,
  };

  return (
    <AdvertisementsContext.Provider value={value}>
      {children}
    </AdvertisementsContext.Provider>
  );
}

export function useAdvertisements() {
  return useContext(AdvertisementsContext);
}
