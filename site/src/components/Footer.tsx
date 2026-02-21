interface FooterProps {
  brandName: string;
}

export default function Footer({ brandName }: FooterProps) {
  return (
    <footer className="py-8 text-center text-sm opacity-50" style={{ color: "var(--color-text)" }}>
      &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
    </footer>
  );
}
