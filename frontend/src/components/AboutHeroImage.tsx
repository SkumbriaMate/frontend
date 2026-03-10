"use client";

import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

export default function AboutHeroImage() {
  const settings = useWebsiteSettings();
  const heroUrl = settings?.hero_image_url;

  if (heroUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={heroUrl}
        alt="Game Portal Gaming Lounge"
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }

  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-[#0c1120] via-[#1a1f35] to-[#0c1120]"
      aria-hidden
    />
  );
}
