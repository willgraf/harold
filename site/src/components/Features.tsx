interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface FeaturesProps {
  features: Feature[];
}

export default function Features({ features }: FeaturesProps) {
  if (features.length === 0) return null;

  return (
    <section className="relative px-6 py-24 sm:px-10">
      <div className="mx-auto mb-24 h-px max-w-4xl bg-gradient-to-r from-transparent via-muted/20 to-transparent" />

      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className="animate-fade-up group rounded-2xl border border-muted/10 bg-surface p-8 transition-all duration-500 hover:-translate-y-1"
            style={{ animationDelay: `${(i + 2) * 0.1}s` }}
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary">
              {feature.icon}
            </div>

            <h3 className="mb-3 text-xl font-normal text-foreground font-display">
              {feature.title}
            </h3>

            <p className="text-sm leading-relaxed text-muted font-body">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
