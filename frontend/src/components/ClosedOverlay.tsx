"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

export default function ClosedOverlay() {
  const settings = useWebsiteSettings();
  const pathname = usePathname();
  const [isOpenFromApi, setIsOpenFromApi] = useState<boolean | null>(null);

  // Client-side fetch to bypass Next.js cache and get fresh is_open status
  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    fetch(`${apiUrl}/api/public/website-settings`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setIsOpenFromApi(d.is_open ?? true))
      .catch(() => setIsOpenFromApi(true));
  }, [pathname]);

  const isClosed = (isOpenFromApi ?? settings?.is_open ?? true) === false;
  const isAdmin = pathname?.startsWith("/admin");

  if (!isClosed || isAdmin) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0F1115]/98 backdrop-blur-sm px-6">
      <div className="text-center max-w-lg animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
          <span className="text-4xl">🚫</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          ჩვენ დახურულები ვართ
        </h1>
        <p className="text-text-secondary text-lg mb-2">
          მალე გავხსნით — დარჩით ხაზზე!
        </p>
        <p className="text-text-muted text-sm">
          Stay tuned! 😊
        </p>
      </div>
    </div>
  );
}
