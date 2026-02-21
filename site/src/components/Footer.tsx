interface FooterProps {
  brandName: string;
}

export default function Footer({ brandName }: FooterProps) {
  return (
    <footer className="px-6 py-12 sm:px-10">
      <div className="divider mx-auto mb-12 max-w-4xl" />

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
        >
          {brandName}
        </span>

        <p
          className="text-xs"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)", opacity: 0.5 }}
        >
          &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
