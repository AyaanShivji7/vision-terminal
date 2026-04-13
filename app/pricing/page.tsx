import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import PricingCards from "@/components/pricing/PricingCards";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <PricingCards />
      <SiteFooter />
    </main>
  );
}