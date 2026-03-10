import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmModal";
import { WebsiteSettingsProvider } from "@/context/WebsiteSettingsContext";
import { AdvertisementsProvider } from "@/context/AdvertisementsContext";
import { fetchWebsiteSettings } from "@/lib/website-settings";
import ClosedOverlay from "@/components/ClosedOverlay";
import VIPBannerAd from "@/components/VIPBannerAd";

export const metadata: Metadata = {
  title: "Game Portal — Gaming Café & Lounge",
  description:
    "Georgia's premier gaming lounge. Check live availability, reserve stations, and join esports events — PC, PS5, Pool, Ping Pong & more.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSettings = await fetchWebsiteSettings();

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <WebsiteSettingsProvider initialSettings={initialSettings}>
          <AdvertisementsProvider>
          <ToastProvider>
            <ConfirmProvider>
            <ClosedOverlay />
            <VIPBannerAd />
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
            </ConfirmProvider>
          </ToastProvider>
          </AdvertisementsProvider>
        </WebsiteSettingsProvider>
      </body>
    </html>
  );
}
