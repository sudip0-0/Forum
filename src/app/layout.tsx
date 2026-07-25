import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import { auth } from "@/server/auth/config";
import { ClientShell } from "@/components/layout/client-shell";
import { getCurrentAccountState } from "@/server/auth/account-state";
import { getSiteUrl } from "@/lib/seo";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Forum",
  description: "A focused community forum for questions and discussion.",
  metadataBase: new URL(getSiteUrl()),
};

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const accountState = await getCurrentAccountState(session);

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${spaceGrotesk.variable} ${sourceSans.variable} font-sans`} suppressHydrationWarning>
        <ClientShell session={session} accountState={accountState}>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
