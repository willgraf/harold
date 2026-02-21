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
  return (
    <html lang="en">
      <body
        style={
          {
            "--color-primary": config.colors.primary,
            "--color-background": config.colors.background,
            "--color-text": config.colors.text,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
