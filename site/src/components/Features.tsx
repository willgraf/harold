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
    <section className="relative px-6 py-14 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        {/* Divider */}
        <div className="h-px w-full max-w-4xl self-center bg-gradient-to-r from-transparent via-muted/20 to-transparent" />

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="animate-fade-up group flex flex-col gap-4 rounded-2xl border border-muted/10 bg-surface p-6 transition-all duration-500 hover:-translate-y-1"
              style={{ animationDelay: `${(i + 2) * 0.1}s` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-base text-primary">
                {feature.icon}
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-normal text-foreground font-display">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted font-body">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
