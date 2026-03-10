import { Metadata } from "next";
import NormalAdSlot from "@/components/NormalAdSlot";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "კონტაქტი — Game Portal",
  description: "დაგვიკავშირდით ან გვეწვიეთ.",
};

export default function ContactPage() {
  return (
    <>
      <section className="section-padding">
        <div className="section-container">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="page-title gradient-text">კონტაქტი</h1>
            <p className="page-subtitle mx-auto">
              გაქვთ კითხვები? დაგვიკავშირდით ან გვეწვიეთ ადგილზე.
            </p>
          </div>

          <NormalAdSlot />

          <div className="max-w-xl mx-auto mt-8">
            <ContactContent />
          </div>
        </div>
      </section>
    </>
  );
}
