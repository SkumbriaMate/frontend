"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ImageLightbox from "./ImageLightbox";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

type DeviceImage = {
  resourceId: string;
  resourceName: string;
  imageUrl: string;
  imageIndex?: number;
};

function isLocalPath(src: string): boolean {
  return src.startsWith("/") || src.startsWith("./");
}

export default function AboutDeviceGallery() {
  const settings = useWebsiteSettings();
  const companyId = settings?.company_id ?? null;
  const [devices, setDevices] = useState<DeviceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<DeviceImage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) return;

        const companyImagesUrl = companyId
          ? `${apiUrl}/api/public/company-images?company_id=${companyId}`
          : `${apiUrl}/api/public/company-images`;
        const [resourcesRes, companyImagesRes] = await Promise.all([
          fetch(`${apiUrl}/api/public/resources`),
          fetch(companyImagesUrl),
        ]);

        const items: DeviceImage[] = [];

        if (companyImagesRes.ok) {
          const imgData = await companyImagesRes.json();
          const companyImages = imgData.images || [];
          companyImages.forEach((img: { id: string; image_url: string; title?: string }) => {
            items.push({
              resourceId: img.id,
              resourceName: img.title || "სივრცის ფოტო",
              imageUrl: img.image_url,
              imageIndex: 0,
            });
          });
        }

        if (resourcesRes.ok) {
          const d = await resourcesRes.json();
          const resources = d.resources || [];
          resources.forEach((res: { id: string; name: string; code?: string; images?: string[] }) => {
            const displayName = res.code ? `${res.name || "მოწყობილობა"} #${res.code}` : res.name;
            (res.images || []).forEach((url: string, idx: number) => {
              items.push({
                resourceId: res.id,
                resourceName: displayName,
                imageUrl: url,
                imageIndex: idx,
              });
            });
          });
        }

        setDevices(items);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash && hash.startsWith("#device-")) {
      const id = hash.slice(1);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [devices]);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
      </div>
    );
  }

  if (devices.length === 0) return null;

  return (
    <section className="py-16 px-5" ref={scrollRef}>
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="page-title gradient-text">ჩვენი სივრცე</h2>
          <p className="page-subtitle mx-auto">
            ნახეთ ჩვენი აღჭურვილობისა და სივრცის ფოტოები.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {devices.map((d, i) => (
            <div
              key={`${d.resourceId}-${i}`}
              id={d.imageIndex === 0 ? `device-${d.resourceId}` : `device-${d.resourceId}-${d.imageIndex}`}
              className="glass-card glass-card-hover overflow-hidden rounded-xl group cursor-pointer"
              onClick={() => setLightbox(d)}
            >
              <div className="relative aspect-video bg-black/40">
                {isLocalPath(d.imageUrl) ? (
                  <Image
                    src={d.imageUrl}
                    alt={d.resourceName}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.imageUrl}
                    alt={d.resourceName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-semibold text-sm drop-shadow-lg">{d.resourceName}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lightbox && (
          <ImageLightbox
            src={lightbox.imageUrl}
            alt={lightbox.resourceName}
            isOpen={!!lightbox}
            onClose={() => setLightbox(null)}
          />
        )}
      </div>
    </section>
  );
}
