import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, Clock, ImageIcon } from "lucide-react";
import Link from "next/link";

interface StationRowProps {
    id: string;
    name: string;
    code?: string;
    type: string;
    status: "available" | "occupied";
    pricePerHour: number;
    pricingMode?: string;
    price1v1?: number;
    price2v2?: number;
    description?: string;
    images?: string[];
    icon: React.ComponentType<{ size?: number; className?: string }> | string;
    isExpanded?: boolean;
    onToggle?: () => void;
    session?: {
        id: string;
        resource_id: string;
        resource_name?: string;
        start_at?: string;
        created_at?: string;
        duration_seconds?: number;
        duration_minutes?: number;
        total_price?: number;
        mode?: string;
    } | null;
    elapsedTime?: number;
}

export default function StationRow({
    id,
    name,
    code,
    type,
    icon: Icon,
    status,
    pricePerHour = 5,
    pricingMode = "hourly",
    price1v1 = 0,
    price2v2 = 0,
    description,
    images = [],
    isExpanded: isExpandedProp = false,
    onToggle,
    session = null,
    elapsedTime = 0,
}: StationRowProps) {
    const [internalExpanded, setInternalExpanded] = useState(false);
    const isExpanded = onToggle ? isExpandedProp : internalExpanded;
    const handleToggle = onToggle ?? (() => setInternalExpanded((p) => !p));
    const [currentElapsed, setCurrentElapsed] = useState(elapsedTime);
    const isAvailable = status === "available";
    const isImagePath = typeof Icon === 'string';
    const hasDeviceImage = images.length > 0;

    // Update timer every second for active sessions
    useEffect(() => {
        if (!session) return;

        const interval = setInterval(() => {
            const timestamp = session.start_at || session.created_at;
            if (!timestamp) return;
            const ts = new Date(timestamp).getTime();
            if (isNaN(ts)) return;
            const elapsed = Math.max(0, Math.floor((Date.now() - ts) / 1000));
            setCurrentElapsed(elapsed);
        }, 1000);

        return () => clearInterval(interval);
    }, [session]);

    // Format time display
    const formatTime = (secs: number) => {
        if (!isFinite(secs) || secs < 0) secs = 0;
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
    };

    // Get timer display info
    const getTimerDisplay = () => {
        if (!session) return null;
        
        const isLiveMode = !session.duration_minutes;
        const remainingTime = session.duration_minutes ? 
            Math.max(0, (session.duration_minutes * 60) - currentElapsed) : 0;
        
        return {
            isLiveMode,
            displayTime: isLiveMode ? formatTime(currentElapsed) : formatTime(remainingTime),
            mode: session.mode || "standard",
            isTimeUp: !isLiveMode && remainingTime <= 0
        };
    };

    return (
        <div
            className={`glass-card glass-card-hover overflow-hidden transition-all duration-300 ${isExpanded ? "ring-1 ring-white/20" : ""}`}
        >
            {/* Compact Header Row (Clickable) */}
            <div
                className="px-3 py-2.5 flex flex-col gap-2 cursor-pointer"
                onClick={handleToggle}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center p-1 flex-shrink-0 ${isAvailable
                                ? "bg-neon-green/10 border border-neon-green/20"
                                : "bg-neon-red/10 border border-neon-red/20"
                                }`}
                        >
                        {isImagePath ? (
                            <Image src={Icon} alt={name} width={32} height={32} className="w-full h-full object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                        ) : (
                            Icon && <Icon
                                size={16}
                                className={isAvailable ? "text-neon-green" : "text-neon-red"}
                            />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-white font-medium text-xs truncate">{code ? `${name} #${code}` : name}</h4>
                        <p className="text-text-muted text-[11px] truncate">
                            {pricingMode === 'ps_mode' ? `${price1v1}–${price2v2} ₾` : `${pricePerHour} ₾/hr`}
                        </p>
                    </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                    {!isAvailable && session ? (
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${
                                getTimerDisplay()?.isLiveMode 
                                    ? "bg-neon-red/10 border-neon-red/30 text-neon-red" 
                                    : "bg-black/40 border-white/10 text-neon-yellow"
                            }`}>
                                <Clock size={10} />
                                {getTimerDisplay()?.displayTime}
                            </div>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-neon-red/20" title={getTimerDisplay()?.isLiveMode ? "LIVE" : getTimerDisplay()?.isTimeUp ? "დასრულდა" : "დაკავებული"}>
                                <span className="w-2 h-2 rounded-full bg-neon-red" />
                            </span>
                        </div>
                    ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full status-available" title={isAvailable ? "თავისუფალი" : "დაკავებული"}>
                            <span className="w-2 h-2 rounded-full bg-neon-green animate-glow-pulse" />
                        </span>
                    )}
                    <ChevronDown size={14} className={`text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
                </div>
            </div>

            {/* Expanded Content - responsive layout */}
            {isExpanded && (
                <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-white/5 animate-fade-in">
                    <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
                        {/* Info & Action - responsive */}
                        <div className="flex flex-col justify-between gap-3 sm:gap-4 min-w-0">
                            <div className="space-y-3">
                                <div>
                                    <h5 className="text-text-muted text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-1.5">Pricing</h5>
                                    {pricingMode === 'ps_mode' ? (
                                        <div className="flex gap-2 sm:gap-3">
                                            <div className="glass-card p-2.5 sm:p-3 flex-1 text-center min-w-0 rounded-lg">
                                                <div className="text-text-muted text-[10px] sm:text-xs">1v1</div>
                                                <div className="text-white font-bold text-sm sm:text-base">{price1v1} ₾</div>
                                            </div>
                                            <div className="glass-card p-2.5 sm:p-3 flex-1 text-center min-w-0 rounded-lg">
                                                <div className="text-text-muted text-[10px] sm:text-xs">2v2</div>
                                                <div className="text-white font-bold text-sm sm:text-base">{price2v2} ₾</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="glass-card p-2.5 sm:p-3 text-center rounded-lg">
                                            <div className="text-white font-bold text-sm sm:text-base">{pricePerHour} ₾/hr</div>
                                        </div>
                                    )}
                                </div>

                                {description && (
                                    <div className="text-xs sm:text-sm text-text-muted leading-relaxed line-clamp-3">
                                        {description}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                                <div className="flex flex-wrap items-center gap-2 order-2 sm:order-1">
                                    <div className="text-[10px] sm:text-xs text-text-muted">
                                        ID: <span className="text-white/60">{id.split('-')[0]}</span>
                                    </div>
                                    {hasDeviceImage && (
                                        <Link
                                            href={`/about#device-${id}`}
                                            className="inline-flex items-center gap-1.5 text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                                        >
                                            <ImageIcon size={14} />
                                            ნახე სურათები
                                        </Link>
                                    )}
                                </div>
                                {isAvailable && (
                                    <Link
                                        href={`/reserve?resourceId=${id}`}
                                        className="btn-primary !py-3 sm:!py-2 !px-5 text-xs sm:text-sm w-full sm:w-auto text-center shadow-lg shadow-neon-cyan/20 min-h-[44px] sm:min-h-0 flex items-center justify-center touch-manipulation"
                                    >
                                        დაჯავშნა
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}