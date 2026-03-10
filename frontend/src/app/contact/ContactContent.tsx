"use client";

import { Mail, MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

function cleanPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("995") ? digits : `995${digits}`;
}

function mapsUrl(address: string, city?: string | null) {
  const q = [city, address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export default function ContactContent() {
  const settings = useWebsiteSettings();

  const addressDisplay = [settings?.city, settings?.address].filter(Boolean).join(", ");
  const addressUrl = settings?.maps_url || (addressDisplay ? mapsUrl(settings?.address || "", settings?.city) : null);

  const items: Array<{ icon: typeof MapPin; label: string; content: React.ReactNode }> = [];

  if (addressUrl || addressDisplay) {
    items.push({
      icon: MapPin,
      label: "მისამართი",
      content: addressUrl ? (
        <a href={addressUrl} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-neon-cyan transition-colors inline-flex items-center gap-1.5">
          {addressDisplay || "რუკაზე ნახვა"}
          <ExternalLink size={12} />
        </a>
      ) : (
        <span className="text-text-secondary">{addressDisplay}</span>
      ),
    });
  }

  if (settings?.phone) {
    const ph = cleanPhone(settings.phone);
    items.push({
      icon: Phone,
      label: "ტელეფონი",
      content: (
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${ph}`} className="text-text-secondary hover:text-neon-cyan transition-colors">
            {settings.phone}
          </a>
          <a href={`https://wa.me/${ph}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 rounded bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 transition-colors">WhatsApp</a>
          <a href={`viber://chat?number=%2B${ph}`} className="text-xs px-2 py-0.5 rounded bg-purple-600/20 border border-purple-600/30 text-purple-400 hover:bg-purple-600/30 transition-colors">Viber</a>
        </div>
      ),
    });
  }

  if (settings?.email) {
    items.push({
      icon: Mail,
      label: "ელ. ფოსტა",
      content: (
        <a href={`mailto:${settings.email}`} className="text-text-secondary hover:text-neon-cyan transition-colors">
          {settings.email}
        </a>
      ),
    });
  }

  if (settings?.opening_hours) {
    items.push({
      icon: Clock,
      label: "სამუშაო საათები",
      content: (
        <pre className="text-text-secondary text-sm font-sans whitespace-pre-wrap m-0">
          {settings.opening_hours}
        </pre>
      ),
    });
  }

  if (settings?.facebook_url || settings?.instagram_url) {
    const links: React.ReactNode[] = [];
    if (settings.facebook_url) links.push(<a key="fb" href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-neon-cyan transition-colors">Facebook</a>);
    if (settings.instagram_url) links.push(<a key="ig" href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-neon-cyan transition-colors">Instagram</a>);
    items.push({
      icon: ExternalLink,
      label: "სოციალური ქსელი",
      content: <div className="flex gap-3">{links}</div>,
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
        <p className="text-text-muted text-sm">
          კონტაქტის ინფორმაცია ადმინ პანელიდან დააყენეთ (კომპანია → კონტაქტი).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">კონტაქტის ინფორმაცია</h3>
      {items.map((item) => (
        <div key={item.label} className="flex gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <item.icon size={16} className="text-neon-cyan" />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{item.label}</div>
            <div className="text-sm">{item.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
