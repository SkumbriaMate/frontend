"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2 } from "lucide-react";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

// Strip non-digits for tel: and WhatsApp/Viber links
function cleanPhone(phone: string) {
    return phone.replace(/\D/g, "");
}

// Build Google Maps URL from address
function mapsUrl(address: string, city?: string | null) {
    const q = [city, address].filter(Boolean).join(", ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
    return (
        <svg role="img" viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-label="WhatsApp">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654A11.882 11.882 0 005.683 24h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0017.1 3.587z" />
        </svg>
    );
}

function ViberIcon({ size = 18 }: { size?: number }) {
    return (
        <svg role="img" viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-label="Viber">
            <path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.326 6.812-.416 7.15-.525.776-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546-.596-.55-3.006-2.3-8.375-2.323 0 0-.395-.025-1.037-.017zm.058 1.693c.545-.004.88.017.88.017 4.542.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v.002c-.604 4.878-4.174 5.184-4.832 5.395-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.12.12-.26.167-.352.144-.13-.033-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.292-4.43-8.895.054-2.604.543-4.738 1.996-6.173 1.96-1.773 5.474-2.018 7.11-2.03zm.38 2.602c-.167 0-.303.135-.304.302 0 .167.133.303.3.305 1.624.01 2.946.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334.002.167.14.3.307.3.166-.002.3-.138.3-.304-.014-1.984-.618-3.596-1.816-4.764-1.19-1.16-2.692-1.753-4.447-1.765zm-3.96.695c-.19-.032-.4.005-.616.117l-.01.002c-.43.247-.816.562-1.146.932-.002.004-.006.004-.008.008-.267.323-.42.638-.46.948-.008.046-.01.093-.007.14 0 .136.022.27.065.4l.013.01c.135.48.473 1.276 1.205 2.604.42.768.903 1.5 1.446 2.186.27.344.56.673.87.984l.132.132c.31.308.64.6.984.87.686.543 1.418 1.027 2.186 1.447 1.328.733 2.126 1.07 2.604 1.206l.01.014c.13.042.265.064.402.063.046.002.092 0 .138-.008.31-.036.627-.19.948-.46 0 0 .003-.002.008-.005.37-.33.683-.72.93-1.148l.003-.01c.225-.432.15-.842-.18-1.12-.004 0-.698-.58-1.037-.83-.36-.255-.73-.492-1.113-.71-.51-.285-1.032-.106-1.248.174l-.447.564c-.23.283-.657.246-.657.246-3.12-.796-3.955-3.955-3.955-3.955s-.037-.426.248-.656l.563-.448c.277-.215.456-.737.17-1.248-.217-.383-.454-.756-.71-1.115-.25-.34-.826-1.033-.83-1.035-.137-.165-.31-.265-.502-.297zm4.49.88c-.158.002-.29.124-.3.282-.01.167.115.312.282.324 1.16.085 2.017.466 2.645 1.15.63.688.93 1.524.906 2.57-.002.168.13.306.3.31.166.003.305-.13.31-.297.025-1.175-.334-2.193-1.067-2.994-.74-.81-1.777-1.253-3.05-1.346h-.024zm.463 1.63c-.16.002-.29.127-.3.287-.008.167.12.31.288.32.523.028.875.175 1.113.422.24.245.388.62.416 1.164.01.167.15.295.318.287.167-.008.295-.15.287-.317-.03-.644-.215-1.178-.58-1.557-.367-.378-.893-.574-1.52-.607h-.018z" />
        </svg>
    );
}

const DEFAULT_ABOUT_INTRO = "საქართველოს წამყვანი გეიმინგ სივრცე. PC, PlayStation 5, ბილიარდი და სხვა — ყველაფერი ერთ სივრცეში.";

export default function Footer() {
    const pathname = usePathname();
    const settings = useWebsiteSettings();
    const companyName = settings?.name || "Game Portal";
    const aboutText = settings?.about_intro || DEFAULT_ABOUT_INTRO;

    if (pathname?.startsWith("/admin")) return null;
    return (
        <footer className="border-t border-[#2A3038]/50 bg-[#0F1115]">
            <div className="max-w-7xl mx-auto px-5 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Brand: logo + company name */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-4">
                            {settings?.logo_url ? (
                                <div className="w-auto max-w-[160px] flex items-center shrink-0" style={{ height: `${Math.round((settings?.logo_height ?? 48) * 0.85)}px`, minHeight: 40 }}>
                                    <img src={settings.logo_url} alt="" className="h-full w-auto object-contain" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center shrink-0">
                                    <Gamepad2 size={18} className="text-[#0F1115]" />
                                </div>
                            )}
                            <span className="font-display font-bold text-base tracking-wider text-white">
                                {companyName}
                            </span>
                        </Link>
                        <p className="text-text-muted text-sm leading-6 whitespace-pre-line">
                            {aboutText}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">ნავიგაცია</h4>
                        <ul className="space-y-2.5">
                            {[
                                { name: "მთავარი", path: "/" },
                                { name: "მოწყობილობები", path: "/stations" },
                                { name: "ღონისძიებები", path: "/events" },
                                { name: "ჩვენს შესახებ", path: "/about" },
                                { name: "კონტაქტი", path: "/contact" }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.path}
                                        className="text-text-muted text-sm hover:text-neon-cyan transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">კონტაქტი</h4>
                        <ul className="space-y-2.5 text-text-muted text-sm">
                            {(settings?.address || settings?.city || settings?.maps_url) && (
                                <li>
                                    <a
                                        href={settings?.maps_url || mapsUrl(settings?.address || "", settings?.city)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 hover:text-neon-cyan transition-colors"
                                    >
                                        <span>📍</span>
                                        {[settings.city, settings.address].filter(Boolean).join(", ") || "რუკაზე ნახვა"}
                                    </a>
                                </li>
                            )}
                            {settings?.phone && (
                                <li className="flex flex-wrap items-center gap-2">
                                    <a
                                        href={`tel:${cleanPhone(settings.phone)}`}
                                        className="inline-flex items-center gap-1.5 hover:text-neon-cyan transition-colors"
                                    >
                                        <span>📞</span>
                                        {settings.phone}
                                    </a>
                                    <span className="flex items-center gap-1">
                                        <a
                                            href={`https://wa.me/${cleanPhone(settings.phone)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 rounded hover:bg-white/10 hover:text-[#25D366] transition-colors"
                                            title="WhatsApp"
                                        >
                                            <WhatsAppIcon size={16} />
                                        </a>
                                        <a
                                            href={`viber://chat?number=%2B${cleanPhone(settings.phone)}`}
                                            className="p-1 rounded hover:bg-white/10 hover:text-[#7360F3] transition-colors"
                                            title="Viber"
                                        >
                                            <ViberIcon size={16} />
                                        </a>
                                    </span>
                                </li>
                            )}
                            {settings?.email && (
                                <li>
                                    <a
                                        href={`mailto:${settings.email}`}
                                        className="inline-flex items-center gap-1.5 hover:text-neon-cyan transition-colors"
                                    >
                                        <span>✉️</span>
                                        {settings.email}
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Hours - editable from admin */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">საათები</h4>
                        <ul className="space-y-2.5 text-text-muted text-sm">
                            {(settings?.opening_hours || "ორშ — ხუთ: 10:00 — 00:00\nპარ — შაბ: 10:00 — 02:00\nკვირა: 12:00 — 23:00")
                                .split("\n")
                                .filter(Boolean)
                                .map((line, i) => (
                                    <li key={i}>{line.trim()}</li>
                                ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-text-muted text-xs">
                        © {new Date().getFullYear()} {settings?.name || "Game Portal"}. ყველა უფლება დაცულია.
                    </p>
                    {(settings?.facebook_url || settings?.instagram_url) && (
                        <div className="flex items-center gap-5">
                            {settings?.facebook_url && (
                                <a
                                    href={settings.facebook_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-text-muted text-xs hover:text-neon-cyan transition-colors"
                                >
                                    Facebook
                                </a>
                            )}
                            {settings?.instagram_url && (
                                <a
                                    href={settings.instagram_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-text-muted text-xs hover:text-neon-cyan transition-colors"
                                >
                                    Instagram
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
}