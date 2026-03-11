const steps = [
  {
    number: "01",
    title: "Configure",
    description:
      "Edit site/config.yaml with your brand — name, headline, colors, fonts. Edit infra/config.yaml to choose your storage backend.",
  },
  {
    number: "02",
    title: "Build",
    description:
      "Compile the static site. Next.js exports pure HTML — no server required, no runtime costs.",
  },
  {
    number: "03",
    title: "Deploy",
    description:
      "One CDK command provisions the full stack: CloudFront CDN, Lambda API, API Gateway, and DynamoDB. Done.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative px-6 py-14 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        {/* Divider */}
        <div className="h-px w-full max-w-4xl self-center bg-gradient-to-r from-transparent via-muted/20 to-transparent" />

        {/* Header + grid */}
        <div className="flex flex-col gap-10">
          {/* Section label + heading */}
          <div className="flex flex-col gap-3">
            <p className="animate-fade-up text-xs font-semibold tracking-[0.3em] uppercase text-primary font-body">
              How it works
            </p>
            <h2
              className="animate-fade-up text-3xl font-normal text-foreground font-display sm:text-4xl"
              style={{ animationDelay: "0.1s" }}
            >
              From zero to deployed in three steps.
            </h2>
          </div>

          {/* Steps + Terminal */}
          <div className="grid gap-12 md:grid-cols-2 md:gap-16 md:items-start">
            {/* Steps */}
            <div className="flex flex-col">
              {steps.map((step, i) => (
                <div
                  key={step.number}
                  className="animate-fade-up relative border-l border-muted/15 pl-8 pb-10 last:pb-0"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <span className="absolute -left-px top-0 h-full w-px" />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs tracking-[0.2em] uppercase text-primary/60 font-body">
                      {step.number}
                    </p>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl font-normal text-foreground font-display">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted font-body">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Terminal */}
            <div
              className="animate-fade-up rounded-2xl border border-muted/10 bg-surface overflow-hidden"
              style={{ animationDelay: "0.2s" }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-muted/10 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-primary/50" />
                <span className="h-3 w-3 rounded-full bg-accent/50" />
                <span className="h-3 w-3 rounded-full bg-muted/30" />
                <span className="ml-auto text-xs text-muted/40 font-mono">harold</span>
              </div>

              {/* Code content */}
              <div className="p-6 font-mono text-xs leading-relaxed">
                <div>
                  <span className="text-muted/40"># site/config.yaml</span>
                </div>
                <div className="mt-1">
                  <span className="text-primary">brandName</span>
                  <span className="text-muted">: </span>
                  <span className="text-foreground">&quot;My Startup&quot;</span>
                </div>
                <div>
                  <span className="text-primary">headline</span>
                  <span className="text-muted">: </span>
                  <span className="text-foreground">&quot;Launching soon.&quot;</span>
                </div>
                <div>
                  <span className="text-primary">colors</span>
                  <span className="text-muted">:</span>
                </div>
                <div className="pl-4">
                  <span className="text-primary">primary</span>
                  <span className="text-muted">: </span>
                  <span className="text-foreground">&quot;#your-color&quot;</span>
                </div>

                <div className="mt-5">
                  <span className="text-accent">$</span>
                  <span className="text-muted"> npm -w site run build</span>
                </div>
                <div className="mt-1 pl-2 text-muted/50">
                  ✓ compiled successfully
                </div>

                <div className="mt-4">
                  <span className="text-accent">$</span>
                  <span className="text-muted"> cd infra &amp;&amp; npx cdk deploy --all</span>
                </div>
                <div className="mt-1 pl-2">
                  <span className="text-accent">✓</span>
                  <span className="text-muted/50"> HaroldSite </span>
                  <span className="text-muted/40">https://d1k29j.cloudfront.net</span>
                </div>
                <div className="pl-2">
                  <span className="text-accent">✓</span>
                  <span className="text-muted/50"> HaroldApi  </span>
                  <span className="text-muted/40">ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
