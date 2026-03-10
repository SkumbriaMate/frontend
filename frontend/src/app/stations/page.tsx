"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Monitor, Circle, TableProperties } from "lucide-react";
import AvailabilityCard from "@/components/AvailabilityCard";
import StationRow from "@/components/StationRow";
import NormalAdSlot from "@/components/NormalAdSlot";
import { io as makeIo } from "socket.io-client";

const stationTypes = [
    { key: "all", label: "ყველა" },
    { key: "pc", label: "Gaming PC" },
    { key: "ps5", label: "PlayStation 5" },
    { key: "pool", label: "ბილიარდი" },
    { key: "pingpong", label: "მაგიდის ჩოგბურთი" },
];

const iconMap = {
    pc: Monitor,
    ps: "/icons/ps4.png",
    pool: Circle,
    driving: "/icons/car-simulation.png",
    pingpong: TableProperties,
};

type Station = {
    id: string;
    company_id?: string;
    name: string;
    code: string;
    is_vip: boolean;
    status: string;
    pricing_mode: string;
    price_per_hour: number | null;
    price_1v1: number | null;
    price_2v2: number | null;
    type_name: string;
    type_slug: string;
    description: string | null;
    images: string[];
};

type Session = {
    id: string;
    resource_id: string;
    resource_name?: string;
    start_at?: string;
    created_at?: string;
    duration_seconds?: number;
    duration_minutes?: number;
    total_price?: number;
    mode?: string;
};

function StationsContent() {
    const searchParams = useSearchParams();
    const [filter, setFilter] = useState<string | null>(null);
    const [vipFilter, setVipFilter] = useState<"all" | "vip" | "standard">("all");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [stations, setStations] = useState<Station[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState<string | null>(null);

    const fetchResources = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            
            // Fetch both resources and sessions
            const [resourcesResponse, sessionsResponse] = await Promise.all([
                fetch(`${apiUrl}/api/public/resources`),
                fetch(`${apiUrl}/api/public/sessions`)
            ]);
            
            if (!resourcesResponse.ok) throw new Error("Failed to fetch resources");
            if (!sessionsResponse.ok) throw new Error("Failed to fetch sessions");
            
            const resourcesData = await resourcesResponse.json();
            const sessionsData = await sessionsResponse.json();
            
            setStations(resourcesData.resources || []);
            setSessions(sessionsData.sessions || []);
            
            if (resourcesData.resources && resourcesData.resources.length > 0) {
                setCompanyId(resourcesData.resources[0].company_id || null);
            }
        } catch (err) {
            console.error("Error fetching stations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        const queryFilter = searchParams.get("filter");
        if (queryFilter && ["pc", "ps", "pool", "driving"].includes(queryFilter)) {
            setFilter(queryFilter);
        }
    }, [searchParams]);

    // Reset expanded when filter changes
    useEffect(() => {
        setExpandedId(null);
    }, [filter, vipFilter]);

    const filtered = stations.filter((s) => {
        const matchesCategory = filter === null ? false : s.type_slug === filter;
        const matchesVip = vipFilter === "all"
            ? true
            : vipFilter === "vip" ? s.is_vip : !s.is_vip;
        return matchesCategory && matchesVip;
    });

    const availableCount = (slug: string) =>
        stations.filter((s) => s.type_slug === slug && s.status === "available").length;
    const totalCount = (slug: string) =>
        stations.filter((s) => s.type_slug === slug).length;

    // Get active session for a station
    const getActiveSession = (stationId: string) => {
        return sessions.find(
            (s) => s.resource_id === stationId && s.duration_seconds === 0
        );
    };

    // Calculate elapsed time from session
    const getElapsedTime = (session: Session | undefined) => {
        if (!session) return 0;
        const timestamp = session.start_at || session.created_at;
        if (!timestamp) return 0;
        const ts = new Date(timestamp).getTime();
        if (isNaN(ts)) return 0;
        return Math.max(0, Math.floor((Date.now() - ts) / 1000));
    };

    // socket integration
    useEffect(() => {
        if (!companyId) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const socket = makeIo(apiUrl, { transports: ['websocket'] });

        socket.on('connect', () => {
            socket.emit('join_company', companyId);
        });

        socket.on('resource_status_changed', (payload) => {
            console.log('[socket] resource_status_changed', payload);
            if (payload.companyId !== companyId) return;
            setStations(prev => prev.map(s => s.id === payload.resourceId ? { ...s, status: payload.status } : s));
        });

        socket.on('session_started', (payload) => {
            console.log('[socket] session_started', payload);
            if (payload.companyId !== companyId) return;
            // Refresh sessions when a new session starts
            fetchResources();
        });

        socket.on('session_ended', (payload) => {
            console.log('[socket] session_ended', payload);
            if (payload.companyId !== companyId) return;
            // Refresh sessions when a session ends
            fetchResources();
        });

        socket.on('reconnect', () => {
            fetchResources();
        });

        return () => {
            socket.disconnect();
        };
    }, [companyId]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center pt-24"><div className="w-8 h-8 rounded-full border-b-2 border-neon-cyan animate-spin"></div></div>;
    }

    return (
        <div className="pt-24 pb-16">
            <div className="section-container px-5">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="page-title gradient-text text-4xl md:text-5xl lg:text-6xl mb-4">მოწყობილობები</h1>
                    <p className="page-subtitle mx-auto max-w-2xl text-lg">
                        აირჩიეთ სასურველი კატეგორია და ნახეთ ხელმისაწვდომი ადგილები რეალურ დროში.
                    </p>
                </div>

                {/* Overview Cards (Now act as Filters) */}
                <NormalAdSlot />

                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">აირჩიეთ კატეგორია</h3>
                    <span className="text-xs text-neon-cyan/60 animate-pulse">● Live</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {totalCount("pc") > 0 && (
                        <button onClick={() => setFilter(filter === "pc" ? null : "pc")} className={`text-left transition-all ${filter === "pc" ? "ring-2 ring-neon-cyan ring-offset-4 ring-offset-[#0F1115] rounded-2xl scale-[1.02]" : "hover:scale-[1.02]"}`}>
                            <AvailabilityCard icon={iconMap.pc} title="Gaming PCs" available={availableCount("pc")} total={totalCount("pc")} color="var(--neon-cyan)" />
                        </button>
                    )}
                    {totalCount("ps") > 0 && (
                        <button onClick={() => setFilter(filter === "ps" ? null : "ps")} className={`text-left transition-all ${filter === "ps" ? "ring-2 ring-neon-magenta ring-offset-4 ring-offset-[#0F1115] rounded-2xl scale-[1.02]" : "hover:scale-[1.02]"}`}>
                            <AvailabilityCard icon={iconMap.ps} title="PlayStation" available={availableCount("ps")} total={totalCount("ps")} color="var(--neon-magenta)" />
                        </button>
                    )}
                    {totalCount("pool") > 0 && (
                        <button onClick={() => setFilter(filter === "pool" ? null : "pool")} className={`text-left transition-all ${filter === "pool" ? "ring-2 ring-neon-green ring-offset-4 ring-offset-[#0F1115] rounded-2xl scale-[1.02]" : "hover:scale-[1.02]"}`}>
                            <AvailabilityCard icon={iconMap.pool} title="ბილიარდი" available={availableCount("pool")} total={totalCount("pool")} color="var(--neon-green)" />
                        </button>
                    )}
                    {totalCount("driving") > 0 && (
                        <button onClick={() => setFilter(filter === "driving" ? null : "driving")} className={`text-left transition-all ${filter === "driving" ? "ring-2 ring-neon-yellow ring-offset-4 ring-offset-[#0F1115] rounded-2xl scale-[1.02]" : "hover:scale-[1.02]"}`}>
                            <AvailabilityCard icon={iconMap.driving} title="ავტოსიმულატორი" available={availableCount("driving")} total={totalCount("driving")} color="var(--neon-yellow)" />
                        </button>
                    )}
                </div>

                {filter && (
                    <div className="animate-fade-in">
                        {/* VIP Filters */}
                        <div className="flex flex-wrap items-center gap-3 mb-8 pb-8 border-b border-white/5">
                            <span className="text-sm font-medium text-text-muted mr-2">ფილტრი:</span>
                            <button
                                onClick={() => setVipFilter("all")}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${vipFilter === "all" ? "bg-white text-black" : "bg-white/5 text-text-muted hover:bg-white/10"}`}
                            >
                                ყველა
                            </button>
                            <button
                                onClick={() => setVipFilter("vip")}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${vipFilter === "vip" ? "border-neon-magenta bg-neon-magenta/10 text-neon-magenta shadow-[0_0_15px_rgba(255,0,229,0.3)]" : "border-white/10 text-text-muted hover:border-white/20"}`}
                            >
                                ⭐ VIP
                            </button>
                            <button
                                onClick={() => setVipFilter("standard")}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${vipFilter === "standard" ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]" : "border-white/10 text-text-muted hover:border-white/20"}`}
                            >
                                სტანდარტული
                            </button>
                        </div>

                        {/* Section Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-2xl font-bold font-display text-white whitespace-nowrap">
                                {stationTypes.find(t => t.key === (filter === 'ps' ? 'ps5' : filter))?.label || "მოწყობილობები"}
                            </h2>
                            <div className="h-[2px] grow bg-gradient-to-r from-neon-cyan/50 via-white/10 to-transparent rounded-full"></div>
                        </div>

                        {/* Station List - grid for compact layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
                            {filtered.map((station) => {
                                const activeSession = getActiveSession(station.id);
                                return (
                                    <StationRow
                                        key={station.id}
                                        id={station.id}
                                        name={station.name}
                                        code={station.code}
                                        type={station.type_name}
                                        icon={iconMap[station.type_slug as keyof typeof iconMap] || Monitor}
                                        status={station.status as "available" | "occupied"}
                                        pricePerHour={station.price_per_hour || 0}
                                        pricingMode={station.pricing_mode}
                                        price1v1={station.price_1v1 || 0}
                                        price2v2={station.price_2v2 || 0}
                                        description={station.description || ""}
                                        images={station.images}
                                        session={activeSession}
                                        elapsedTime={getElapsedTime(activeSession)}
                                        isExpanded={expandedId === station.id}
                                        onToggle={() => setExpandedId((prev) => (prev === station.id ? null : station.id))}
                                    />
                                );
                            })}
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-20 glass-card rounded-2xl border-dashed border-2 border-white/5">
                                <p className="text-text-muted text-lg mb-2">ამ კატეგორიაში მოწყობილობები ვერ მოიძებნა.</p>
                                <button onClick={() => setVipFilter("all")} className="text-neon-cyan text-sm hover:underline">ფილტრის გასუფთავება</button>
                            </div>
                        )}
                    </div>
                )}

                {!filter && (
                    <div className="text-center py-32 animate-fade-in">
                        <div className="mb-6 inline-flex p-4 rounded-full bg-white/5 text-text-muted border border-white/10">
                            <Monitor size={32} className="opacity-40" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 font-display uppercase tracking-widest">აირჩიეთ კატეგორია</h3>
                        <p className="text-text-muted max-w-md mx-auto">
                            გთხოვთ აირჩიოთ სასურველი მოწყობილობა ზემოთ მოცემული სიიდან, რომ ნახოთ მისი დეტალები და ხელმისაწვდომობა.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function StationsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-24"><div className="w-8 h-8 rounded-full border-b-2 border-neon-cyan animate-spin"></div></div>}>
            <StationsContent />
        </Suspense>
    );
}
