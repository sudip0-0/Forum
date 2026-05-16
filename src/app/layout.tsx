import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/server/auth/config";
import { ClientShell } from "@/components/layout/client-shell";
import { getSiteUrl } from "@/lib/seo";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Forum",
  description: "A focused community forum for questions and discussion.",
  metadataBase: new URL(getSiteUrl()),
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <ClientShell session={session}>{children}</ClientShell>
      </body>
    </html>
  );
}
