import { Metadata } from "next";
import { fetchWebsiteSettings } from "@/lib/website-settings";
import AboutContent from "./AboutContent";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchWebsiteSettings();
  const name = settings?.name || "Game Portal";
  return {
    title: `ჩვენს შესახებ — ${name}`,
    description: `გაიგეთ მეტი ${name}-ზე, საქართველოს წამყვან გეიმინგ ლაუნჯზე.`,
  };
}

export default function AboutPage() {
  return <AboutContent />;
}
