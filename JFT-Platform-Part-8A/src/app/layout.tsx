import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JFT Platform",
  description: "Japanese Language Training Platform — Production Part 8A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
