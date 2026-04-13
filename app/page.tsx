import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import AboutSection from "@/components/home/AboutSection";
import ContactSection from "@/components/home/ContactSection";
import HeroSection from "@/components/home/HeroSection";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <HeroSection />
      <AboutSection />
      <ContactSection />
      <SiteFooter />
    </main>
  );
}