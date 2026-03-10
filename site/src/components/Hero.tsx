import { ReactNode } from "react";

interface HeroProps {
  brandName: string;
  tagline: string;
  headline: string;
  description: string;
  logoUrl: string | null;
  children?: ReactNode;
}

export default function Hero({ headline, tagline, description, children }: HeroProps) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16 text-center">
      {/* Background gradient mesh — inline style needed for complex radial-gradient + color-mix */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in srgb, var(--color-primary) 15%, transparent), transparent)",
            "radial-gradient(ellipse 60% 40% at 80% 80%, color-mix(in srgb, var(--color-accent, #E8A84C) 8%, transparent), transparent)",
            "radial-gradient(ellipse 50% 50% at 20% 60%, color-mix(in srgb, var(--color-primary) 5%, transparent), transparent)",
          ].join(", "),
        }}
      />

      <div className="relative z-10 w-full max-w-3xl">
        <p
          className="animate-fade-up mb-6 text-xs font-semibold tracking-[0.3em] uppercase text-primary font-body"
          style={{ animationDelay: "0.1s" }}
        >
          {tagline}
        </p>

        <h1
          className="text-gradient animate-fade-up mb-8 text-5xl leading-tight font-normal tracking-tight font-display sm:text-7xl sm:leading-[1.1]"
          style={{ animationDelay: "0.2s" }}
        >
          {headline}
        </h1>

        <p
          className="animate-fade-up mx-auto max-w-xl text-lg leading-relaxed text-muted font-body sm:text-xl"
          style={{ animationDelay: "0.3s" }}
        >
          {description}
        </p>

        {children && (
          <div className="animate-fade-up mt-10" style={{ animationDelay: "0.4s" }}>
            {children}
          </div>
        )}
      </div>

      {/* Scroll hint */}
      <div
        className="animate-fade-in absolute bottom-8 flex flex-col items-center gap-2 text-muted"
        style={{ animationDelay: "0.8s" }}
      >
        <span className="text-[10px] tracking-[0.2em] uppercase font-body">
          Scroll
        </span>
        <div className="h-8 w-px bg-gradient-to-b from-muted to-transparent" />
      </div>
    </section>
  );
}
