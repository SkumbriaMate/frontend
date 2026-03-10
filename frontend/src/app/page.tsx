"use client";

import { useState, useEffect, useCallback } from "react";
import { getApiBase } from "@/lib/api";
import Link from "next/link";
import { Monitor, Circle, TableProperties, ArrowRight, Zap } from "lucide-react";
import AvailabilityCard from "@/components/AvailabilityCard";
import EventCard from "@/components/EventCard";
import GalleryCarousel from "@/components/GalleryCarousel";
import NormalAdSlot from "@/components/NormalAdSlot";
import GameBannersCarousel from "@/components/GameBannersCarousel";
import ReviewsSection from "@/components/ReviewsSection";
import { io as makeIo } from "socket.io-client";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

const iconMap = {
  pc: Monitor,
  ps: "/icons/ps4.png",
  pool: Circle,
  driving: "/icons/car-simulation.png",
  pingpong: TableProperties,
};

type Station = {
  id: string;
  name?: string;
  code?: string;
  type_slug: string;
  status: string;
  images?: string[];
};

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  image_url: string;
  category: string;
};

type CompanyImage = { id: string; image_url: string; title?: string };

export default function HomePage() {
  const settings = useWebsiteSettings();
  const [stations, setStations] = useState<Station[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyImages, setCompanyImages] = useState<CompanyImage[]>([]);
  const [, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const base = getApiBase();
    if (!base) {
      setLoading(false);
      return;
    }
    try {
      // Fetch resources and events separately so one failure doesn't break the other
      let resResponse: Response | null = null;
      let eventsResponse: Response | null = null;
      try {
        resResponse = await fetch(`${base}/api/public/resources`);
      } catch (e) {
        console.warn("Resources fetch failed:", e);
      }
      try {
        eventsResponse = await fetch(`${base}/api/public/events`);
      } catch (e) {
        console.warn("Events fetch failed:", e);
      }

      let cid: string | null = null;
      if (resResponse?.ok) {
        try {
          const resData = await resResponse.json();
          const resources = resData.resources || [];
          setStations(resources);
          if (resources.length > 0) {
            cid = (resources[0] as { company_id?: string }).company_id || null;
            setCompanyId(cid);
          }
        } catch (e) {
          console.warn("Resources parse failed:", e);
        }
      }

      if (eventsResponse?.ok) {
        try {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData.events || []);
        } catch (e) {
          console.warn("Events parse failed:", e);
        }
      }

      if (cid) {
        try {
          const imgRes = await fetch(`${base}/api/public/company-images?company_id=${cid}`);
          if (imgRes.ok) {
            const { images } = await imgRes.json();
            setCompanyImages(images || []);
          }
        } catch (e) {
          console.warn("Company images fetch failed:", e);
        }
      } else {
        setCompanyImages([]);
      }
    } catch (err) {
      console.error("Error fetching homepage data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live updates via socket
  useEffect(() => {
    if (!companyId) return;
    const base = getApiBase();
    if (!base) return;
    const socket = makeIo(base, { transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("join_company", companyId);
    });

    socket.on("resource_status_changed", (payload: { companyId: string; resourceId: string; status: string }) => {
      if (payload.companyId !== companyId) return;
      setStations((prev) =>
        prev.map((s) => (s.id === payload.resourceId ? { ...s, status: payload.status } : s))
      );
    });

    socket.on("session_started", () => fetchData());
    socket.on("session_ended", () => fetchData());
    socket.on("reconnect", () => fetchData());

    return () => {
      socket.disconnect();
    };
  }, [companyId, fetchData]);

  const availableCount = (slug: string) =>
    stations.filter((s) => s.type_slug === slug && s.status === "available").length;
  const totalCount = (slug: string) =>
    stations.filter((s) => s.type_slug === slug).length;

  return (
    <>
      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {settings?.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.hero_image_url}
              alt="Game Portal Gaming Lounge"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F1115] via-[#1A1E24] to-[#0F1115]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F1115]/80 via-[#0F1115]/50 to-[#0F1115]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1115]/60 via-transparent to-[#0F1115]/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-5 max-w-4xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-semibold mb-6">
            <Zap size={14} />
            ლაივ ხელმისაწვდომობა · რეალურ დროში
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black text-white leading-normal pb-2 mb-6">
            <span className="gradient-text">{settings?.name || "Game Portal"}</span>
          </h1>

          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            ნახეთ თავისუფალი სივრცე და დაჯავშნეთ თქვენი ადგილი
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/stations" className="btn-primary text-base px-8 py-3.5">
              ნახე თავისუფალი ადგილი
              <ArrowRight size={18} />
            </Link>
            <Link href="/reserve" className="btn-secondary text-base px-8 py-3.5">
              დაჯავშნე ახლავე
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-muted text-xs animate-float">
          <span>ქვემოთ ჩამოსვლა</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 bg-neon-cyan rounded-full animate-glow-pulse" />
          </div>
        </div>
      </section>

      {/* ── Normal ads carousel ─────────────────────── */}
      <NormalAdSlot />

      {/* ── Live Availability ──────────────────────── */}
      <section className="section-padding" id="availability">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="page-title gradient-text">ლაივ სტატუსი</h2>
            <p className="page-subtitle mx-auto">
              ნახეთ რა არის თავისუფალი ახლავე — მონაცემები ახლდება რეალურ დროში.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {totalCount("pc") > 0 && (
              <Link href="/stations?filter=pc" className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-cyan/50">
                <AvailabilityCard
                  icon={iconMap.pc}
                  title="გეიმინგური კომპიუტერები"
                  available={availableCount("pc")}
                  total={totalCount("pc")}
                  color="var(--neon-cyan)"
                />
              </Link>
            )}
            {totalCount("ps") > 0 && (
              <Link href="/stations?filter=ps" className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-magenta/50">
                <AvailabilityCard
                  icon={iconMap.ps}
                  title="პლეისთეიშენი"
                  available={availableCount("ps")}
                  total={totalCount("ps")}
                  color="var(--neon-magenta)"
                />
              </Link>
            )}
            {totalCount("pool") > 0 && (
              <Link href="/stations?filter=pool" className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-green/50">
                <AvailabilityCard
                  icon={iconMap.pool}
                  title="ბილიარდი"
                  available={availableCount("pool")}
                  total={totalCount("pool")}
                  color="var(--neon-green)"
                />
              </Link>
            )}
            {totalCount("driving") > 0 && (
              <Link href="/stations?filter=driving" className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-yellow/50">
                <AvailabilityCard
                  icon={iconMap.driving}
                  title="ავტოსიმულატორი"
                  available={availableCount("driving")}
                  total={totalCount("driving")}
                  color="var(--neon-yellow)"
                />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Play our top games ─────────────────────── */}
      <GameBannersCarousel />

      {/* ── Gallery Carousel ───────────────────────── */}
      <section className="section-padding bg-bg-secondary/50">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="page-title gradient-text">ჩვენი სივრცე</h2>
            <p className="page-subtitle mx-auto">
              პრემიუმ გეიმინგ გარემო, შექმნილი მაქსიმალური კომფორტისთვის.
            </p>
          </div>

          <GalleryCarousel
            images={[
              ...companyImages.map((img) => ({ src: img.image_url, alt: img.title || "სივრცის ფოტო" })),
              ...stations.flatMap((s) =>
                (s.images || []).map((url) => ({ src: url, alt: s.code ? `${s.name || "მოწყობილობა"} #${s.code}` : s.name || "მოწყობილობა" }))
              ),
            ].filter((img, i, arr) => arr.findIndex((x) => x.src === img.src) === i)}
            intervalMs={4000}
          />
        </div>
      </section>

      <ReviewsSection />

      {/* ── Upcoming Events ────────────────────────── */}
      {events.length > 0 && (
        <section className="section-padding">
          <div className="section-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="page-title gradient-text">ღონისძიებები</h2>
                <p className="page-subtitle">
                  ტურნირები, ქომიუნითი შეხვედრები სხვ.
                </p>
              </div>
              <Link
                href="/events"
                className="btn-secondary !py-2 !px-5 !text-sm shrink-0"
              >
                ყველა ღონისძიება
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {events.slice(0, 3).map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  description={event.description}
                  date={new Date(event.date).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric', year: 'numeric' })}
                  time={event.time.slice(0, 5)}
                  image={event.image_url || "https://placehold.co/800x400/0c1120/64748b?text=Game+Portal"}
                  category={event.category}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ─────────────────────────────── */}
      <section className="section-padding">
        <div className="section-container">
          <div className="glass-card neon-border relative overflow-hidden p-10 md:p-16 text-center">
            <div className="absolute inset-0 shimmer-bg" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                მზად ხარ სათამაშოდ?
              </h2>
              <p className="text-text-secondary text-lg mb-8 max-w-lg mx-auto">
                დაჯავშნე შენი ადგილი ახლავე და დაზოგე დრო. მოდი და ითამაშე.
              </p>
              <Link href="/reserve" className="btn-primary text-lg px-10 py-4">
                დაჯავშნე ახლავე
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
