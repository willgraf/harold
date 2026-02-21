interface NavbarProps {
  brandName: string;
  logoUrl: string | null;
}

export default function Navbar({ brandName, logoUrl }: NavbarProps) {
  return (
    <nav className="animate-fade-in fixed top-0 z-50 flex w-full items-center justify-between px-6 py-5 font-body sm:px-10">
      <div className="flex items-center gap-3">
        {logoUrl && (
          <img src={logoUrl} alt={`${brandName} logo`} className="h-7" />
        )}
        <span className="text-sm font-semibold tracking-widest uppercase text-foreground">
          {brandName}
        </span>
      </div>
      <div className="rounded-full border border-muted/30 px-4 py-1.5 text-xs tracking-wide uppercase text-muted">
        Coming Soon
      </div>
    </nav>
  );
}
