interface HeroProps {
  brandName: string;
  tagline: string;
  logoUrl: string | null;
}

export default function Hero({ brandName, tagline, logoUrl }: HeroProps) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {logoUrl && (
        <img src={logoUrl} alt={`${brandName} logo`} className="mb-8 h-16" />
      )}
      <h1 className="mb-4 text-5xl font-bold" style={{ color: "var(--color-text)" }}>
        {brandName}
      </h1>
      <p className="max-w-md text-xl opacity-70" style={{ color: "var(--color-text)" }}>
        {tagline}
      </p>
    </section>
  );
}
