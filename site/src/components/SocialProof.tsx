interface SocialProofProps {
  line1: string;
  line2: string;
}

export default function SocialProof({ line1, line2 }: SocialProofProps) {
  if (!line1 && !line2) return null;

  return (
    <section className="px-6 py-16 sm:px-10">
      <div className="divider mx-auto mb-16 max-w-4xl" />

      <div className="animate-fade-up delay-3 mx-auto flex max-w-2xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:gap-12">
        {line1 && (
          <p
            className="text-sm tracking-wide"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
          >
            <span style={{ color: "var(--color-text)" }}>{line1.split(" ")[0]}</span>{" "}
            {line1.split(" ").slice(1).join(" ")}
          </p>
        )}

        {line1 && line2 && (
          <div
            className="hidden h-4 w-px sm:block"
            style={{ backgroundColor: "var(--color-text-muted)", opacity: 0.3 }}
          />
        )}

        {line2 && (
          <p
            className="text-sm tracking-wide"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
          >
            <span style={{ color: "var(--color-text)" }}>{line2.split(" ")[0]}</span>{" "}
            {line2.split(" ").slice(1).join(" ")}
          </p>
        )}
      </div>
    </section>
  );
}
