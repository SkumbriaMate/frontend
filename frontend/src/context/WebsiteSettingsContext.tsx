"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { WebsiteSettings } from "@/lib/website-settings";
import { getApiBase } from "@/lib/api";

const WebsiteSettingsContext = createContext<WebsiteSettings | null>(null);

export function WebsiteSettingsProvider({
    children,
    initialSettings,
}: {
    children: React.ReactNode;
    initialSettings: WebsiteSettings | null;
}) {
    const [settings, setSettings] = useState<WebsiteSettings | null>(initialSettings);

    // Background revalidate only when we have no initial data (avoids flash on refresh)
    useEffect(() => {
        if (initialSettings) return; // Server already provided settings - no refetch to avoid size flash
        const base = getApiBase();
        if (!base) return;
        fetch(`${base}/api/public/website-settings`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d && setSettings(d))
            .catch(() => {});
    }, [initialSettings]);

    const value = useMemo(() => settings, [settings]);

    return (
        <WebsiteSettingsContext.Provider value={value}>
            {children}
        </WebsiteSettingsContext.Provider>
    );
}

export function useWebsiteSettings() {
    return useContext(WebsiteSettingsContext);
}
