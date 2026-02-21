import { loadConfig } from "@/lib/config";
import Hero from "@/components/Hero";
import SignupForm from "@/components/SignupForm";
import Footer from "@/components/Footer";

export default function Home() {
  const config = loadConfig();

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <Hero
        brandName={config.brandName}
        tagline={config.tagline}
        logoUrl={config.logoUrl}
      />
      <SignupForm
        ctaText={config.ctaText}
        successMessage={config.successMessage}
        apiUrl={config.apiUrl}
      />
      <Footer brandName={config.brandName} />
    </main>
  );
}
