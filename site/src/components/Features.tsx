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
      <div className="divider mx-auto mb-24 max-w-4xl" />

      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className={`animate-fade-up delay-${i + 2} group rounded-2xl border p-8 transition-all duration-500 hover:-translate-y-1`}
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "color-mix(in srgb, var(--color-text-muted) 10%, transparent)",
            }}
          >
            {/* Icon */}
            <div
              className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl text-lg transition-colors duration-500"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                color: "var(--color-primary)",
              }}
            >
              {feature.icon}
            </div>

            {/* Title */}
            <h3
              className="mb-3 text-xl font-normal"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text)",
              }}
            >
              {feature.title}
            </h3>

            {/* Description */}
            <p
              className="text-sm leading-relaxed"
              style={{
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
