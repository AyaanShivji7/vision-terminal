import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Vision Terminal",
  description: "AI-powered investment intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" data-scroll-behavior="smooth">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}