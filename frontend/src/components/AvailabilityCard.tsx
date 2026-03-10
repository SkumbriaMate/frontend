import type { LucideIcon } from "lucide-react";
import Image from "next/image";

interface AvailabilityCardProps {
    icon: LucideIcon | string;
    title: string;
    available: number;
    total: number;
    color?: string;
}

export default function AvailabilityCard({
    icon,
    title,
    available,
    total,
    color = "var(--neon-cyan)",
}: AvailabilityCardProps) {
    const occupied = total - available;
    const occupancyPercentage = total > 0 ? (occupied / total) * 100 : 0;
    const isAvailable = available > 0;

    // Helper to determine if icon is a string (path) or a component (Lucide)
    const isImagePath = typeof icon === 'string';
    const IconComponent = !isImagePath ? icon : null;

    return (
        <div className="glass-card glass-card-hover p-6 flex flex-col gap-4 h-full w-full relative">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden p-2"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                >
                    {isImagePath ? (
                        <Image src={icon} alt={title} width={88} height={88} className="w-full h-full object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                    ) : (
                        IconComponent && <IconComponent size={22} style={{ color }} />
                    )}
                </div>
                <div>
                    <h3 className="text-white font-semibold text-base">{title}</h3>
                    <p className="text-text-muted text-xs mt-0.5">
                        {occupied} of {total} taken
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                        width: `${Math.max(occupancyPercentage, occupied > 0 ? 4 : 0)}%`,
                        background: occupied > 0
                            ? `linear-gradient(90deg, #e63946, #ff4466)`
                            : `linear-gradient(90deg, ${color}, ${color}aa)`,
                        boxShadow: occupied > 0 ? `0 0 10px rgba(230, 57, 70, 0.4)` : `0 0 10px ${color}40`,
                    }}
                />
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between">
                <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isAvailable ? "status-available" : "status-occupied"
                        }`}
                >
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-neon-green animate-glow-pulse" : "bg-neon-red"
                            }`}
                    />
                    {isAvailable ? "თავისუფალია" : "დაკავებულია"}
                </span>
                <span className="text-2xl font-bold text-white font-display">
                    {available}
                </span>
            </div>
        </div>
    );
}
