interface SocialProofProps {
  line1: string;
  line2: string;
}

export default function SocialProof({ line1, line2 }: SocialProofProps) {
  if (!line1 && !line2) return null;

  return (
    <section className="px-6 py-12 sm:px-10">
      <div className="mx-auto mb-10 h-px max-w-4xl bg-gradient-to-r from-transparent via-muted/20 to-transparent" />

      <div
        className="animate-fade-up mx-auto flex max-w-2xl flex-col items-center gap-4 text-center font-body sm:flex-row sm:justify-center sm:gap-12"
        style={{ animationDelay: "0.3s" }}
      >
        {line1 && (
          <p className="text-sm tracking-wide text-muted">
            <span className="text-foreground">{line1.split(" ")[0]}</span>{" "}
            {line1.split(" ").slice(1).join(" ")}
          </p>
        )}

        {line1 && line2 && (
          <div className="hidden h-4 w-px bg-muted/30 sm:block" />
        )}

        {line2 && (
          <p className="text-sm tracking-wide text-muted">
            <span className="text-foreground">{line2.split(" ")[0]}</span>{" "}
            {line2.split(" ").slice(1).join(" ")}
          </p>
        )}
      </div>
    </section>
  );
}
