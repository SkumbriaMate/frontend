/**
 * Server-side fetch for website settings.
 * Used in layout to avoid flash of fallback logo on first paint.
 */
export type WebsiteSettings = {
    company_id?: string | null;
    logo_url?: string | null;
    logo_height?: number | null;
    hero_image_url?: string | null;
    name?: string | null;
    description?: string | null;
    about_intro?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    maps_url?: string | null;
    opening_hours?: string | null;
    is_open?: boolean;
};

import { getApiBase } from "./api";

export async function fetchWebsiteSettings(): Promise<WebsiteSettings | null> {
    const base = getApiBase();
    if (!base) return null;
    try {
        const res = await fetch(`${base}/api/public/website-settings`, {
            next: { revalidate: 10 }, // 10s - so is_open toggle updates quickly
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}
