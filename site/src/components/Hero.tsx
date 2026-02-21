interface HeroProps {
  brandName: string;
  tagline: string;
  headline: string;
  description: string;
  logoUrl: string | null;
}

export default function Hero({ headline, tagline, description }: HeroProps) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16 text-center">
      {/* Background gradient mesh */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in srgb, var(--color-primary) 15%, transparent), transparent),
            radial-gradient(ellipse 60% 40% at 80% 80%, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent),
            radial-gradient(ellipse 50% 50% at 20% 60%, color-mix(in srgb, var(--color-primary) 5%, transparent), transparent)
          `,
        }}
      />

      <div className="relative z-10 max-w-3xl">
        {/* Eyebrow */}
        <p
          className="animate-fade-up delay-1 mb-6 text-xs font-semibold tracking-[0.3em] uppercase"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-body)" }}
        >
          {tagline}
        </p>

        {/* Headline */}
        <h1
          className="text-gradient animate-fade-up delay-2 mb-8 text-5xl leading-tight font-normal tracking-tight sm:text-7xl sm:leading-[1.1]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {headline}
        </h1>

        {/* Description */}
        <p
          className="animate-fade-up delay-3 mx-auto max-w-xl text-lg leading-relaxed sm:text-xl"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
        >
          {description}
        </p>
      </div>

      {/* Scroll hint */}
      <div
        className="animate-fade-in delay-8 absolute bottom-8 flex flex-col items-center gap-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-body)" }}>
          Scroll
        </span>
        <div
          className="h-8 w-px"
          style={{ background: "linear-gradient(to bottom, var(--color-text-muted), transparent)" }}
        />
      </div>
    </section>
  );
}
