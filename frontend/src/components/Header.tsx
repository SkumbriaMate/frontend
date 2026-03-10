"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Gamepad2 } from "lucide-react";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

const navLinks = [
    { href: "/", label: "მთავარი" },
    { href: "/stations", label: "მოწყობილობები" },
    { href: "/events", label: "ღონისძიებები" },
    { href: "/about", label: "ჩვენს შესახებ" },
    { href: "/contact", label: "კონტაქტი" },
];

export default function Header() {
    const pathname = usePathname();
    const settings = useWebsiteSettings();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setMobileOpen(false), 0);
        return () => clearTimeout(timer);
    }, [pathname]);

    if (pathname?.startsWith("/admin")) return null;

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? "bg-[#0F1115]/95 backdrop-blur-xl border-b border-[#2A3038]/50 shadow-lg shadow-black/20"
                : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between px-5 h-18 md:h-20">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    {settings?.logo_url ? (
                        <>
                            <div className="w-auto max-w-[200px] flex items-center shrink-0" style={{ height: `${settings?.logo_height ?? 48}px`, minHeight: 48 }}>
                                <img src={settings.logo_url} alt="Logo" className="h-full w-auto object-contain" />
                            </div>
                            <span className="font-display font-bold text-base sm:text-lg tracking-wider text-white truncate max-w-[140px] sm:max-w-none">
                                {settings?.name || "Game Portal"}
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-shadow duration-300">
                                <Gamepad2 size={20} className="text-[#0F1115]" />
                            </div>
                            <span className="font-display font-bold text-lg tracking-wider text-white">
                                {settings?.name || "GAME PORTAL"}
                            </span>
                        </>
                    )}
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                    ? "text-neon-cyan"
                                    : "text-text-secondary hover:text-white"
                                    }`}
                            >
                                {link.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-neon-cyan rounded-full shadow-[0_0_10px_rgba(0,240,255,0.6)]" />
                                )}
                            </Link>
                        );
                    })}
                    <Link
                        href="/reserve"
                        className="btn-primary ml-3 !py-2 !px-5 !text-sm !rounded-lg"
                    >
                        დაჯავშნა
                    </Link>
                </nav>

                {/* Mobile Hamburger */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 text-text-secondary hover:text-white transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 top-[72px] z-40">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Panel - solid background for readability */}
                    <nav
                        className="absolute top-0 right-0 w-72 h-full bg-[#0F1115] border-l border-[#2A3038] p-6 flex flex-col gap-2 shadow-2xl"
                        style={{ animation: "slide-in-right 0.25s ease-out" }}
                    >
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive
                                        ? "text-neon-cyan bg-neon-cyan/10"
                                        : "text-text-secondary hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                        <Link
                            href="/reserve"
                            className="btn-primary mt-4 w-full"
                        >
                            დაჯავშნე ახლავე
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}