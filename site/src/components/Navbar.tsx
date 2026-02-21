interface NavbarProps {
  brandName: string;
  logoUrl: string | null;
}

export default function Navbar({ brandName, logoUrl }: NavbarProps) {
  return (
    <nav className="animate-fade-in fixed top-0 z-50 flex w-full items-center justify-between px-6 py-5 sm:px-10">
      <div className="flex items-center gap-3">
        {logoUrl && (
          <img src={logoUrl} alt={`${brandName} logo`} className="h-7" />
        )}
        <span
          className="text-sm font-semibold tracking-widest uppercase"
          style={{ color: "var(--color-text)", fontFamily: "var(--font-body)" }}
        >
          {brandName}
        </span>
      </div>
      <div
        className="rounded-full border px-4 py-1.5 text-xs tracking-wide uppercase"
        style={{
          borderColor: "color-mix(in srgb, var(--color-text-muted) 30%, transparent)",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-body)",
        }}
      >
        Coming Soon
      </div>
    </nav>
  );
}
