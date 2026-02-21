import type { Metadata } from "next";
import { loadConfig } from "@/lib/config";
import "./globals.css";

const config = loadConfig();

export const metadata: Metadata = {
  title: `${config.brandName} — Coming Soon`,
  description: config.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontDisplay = encodeURIComponent(config.fonts.display);
  const fontBody = encodeURIComponent(config.fonts.body);
  const fontsUrl = `https://fonts.googleapis.com/css2?family=${fontDisplay}:wght@400&family=${fontBody}:wght@400;500;600;700&display=swap`;

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontsUrl} rel="stylesheet" />
      </head>
      <body
        className="bg-background font-body text-foreground antialiased overflow-x-hidden"
        style={
          {
            "--site-primary": config.colors.primary,
            "--site-accent": config.colors.accent,
            "--site-background": config.colors.background,
            "--site-surface": config.colors.surface,
            "--site-text": config.colors.text,
            "--site-text-muted": config.colors.textMuted,
            "--site-font-display": `"${config.fonts.display}", Georgia, serif`,
            "--site-font-body": `"${config.fonts.body}", system-ui, sans-serif`,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
