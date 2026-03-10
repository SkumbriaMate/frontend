"use client";

import AboutDeviceGallery from "@/components/AboutDeviceGallery";
import NormalAdSlot from "@/components/NormalAdSlot";
import ReviewsSection from "@/components/ReviewsSection";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

const DEFAULT_INTRO = "დაარსდა იმისთვის, რომ მოგაწოდოთ საუკეთესო გეიმინგ გამოცდილება საქართველოში — უმაღლესი ხარისხის აღჭურვილობა, კომფორტული გარემო და მეგობრული ატმოსფერო.";

export default function AboutContent() {
  const settings = useWebsiteSettings();
  const companyName = settings?.name || "Game Portal";
  const introText = settings?.about_intro || `${companyName} ${DEFAULT_INTRO}`;

  return (
    <>
      <style>{`
        .ab-hero{
          padding:120px 24px 72px;text-align:center;
          background:var(--bg-secondary);
          border-bottom:1px solid var(--border-color);
        }
        .ab-eyebrow{
          display:inline-block;font-size:11px;font-weight:700;
          letter-spacing:.1em;text-transform:uppercase;
          color:var(--accent-primary);margin-bottom:16px;
        }
        .ab-h1{
          font-family:var(--font-display);
          font-size:clamp(2.2rem,6vw,3.5rem);font-weight:700;
          letter-spacing:-.04em;line-height:1.07;
          background:linear-gradient(135deg,var(--text-primary) 0%,var(--accent-primary) 50%,var(--accent-hover) 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          margin-bottom:20px;padding-bottom:.1em;
        }
        .ab-sub{color:var(--text-secondary);font-size:1.06rem;line-height:1.72;max-width:560px;margin:0 auto;white-space:pre-line}
      `}</style>

      <div>
        <div className="ab-hero">
          <span className="ab-eyebrow">ჩვენს შესახებ</span>
          <h1 className="ab-h1">
            {companyName}
            <br />
            Georgia&apos;s Premier Gaming Lounge
          </h1>
          <p className="ab-sub">{introText}</p>
        </div>

        <NormalAdSlot />

        <AboutDeviceGallery />

        <ReviewsSection />
      </div>
    </>
  );
}
