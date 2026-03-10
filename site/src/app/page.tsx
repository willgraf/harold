import { loadConfig } from "@/lib/config";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SocialProof from "@/components/SocialProof";
import SignupForm from "@/components/SignupForm";
import Footer from "@/components/Footer";

export default function Home() {
  const config = loadConfig();

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
      <Navbar brandName={config.brandName} logoUrl={config.logoUrl} />
      <Hero
        brandName={config.brandName}
        tagline={config.tagline}
        headline={config.headline}
        description={config.description}
        logoUrl={config.logoUrl}
      >
        <SignupForm
          ctaText={config.ctaText}
          successMessage={config.successMessage}
          verificationPendingMessage={config.verificationPendingMessage}
          verificationSuccessMessage={config.verificationSuccessMessage}
          apiUrl={config.apiUrl}
        />
      </Hero>
      <Features features={config.features} />
      <SocialProof
        line1={config.socialProof.line1}
        line2={config.socialProof.line2}
      />
      <Footer brandName={config.brandName} />
    </main>
  );
}
