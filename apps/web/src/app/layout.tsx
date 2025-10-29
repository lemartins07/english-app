import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

import { auth } from "../server/auth";
import { getFeatureFlags } from "../server/feature-flags";
import { FeatureFlagsProvider } from "../shared/feature-flags/context";

import { AuthSessionProvider } from "./providers/session-provider";

export const metadata: Metadata = {
  title: "English AI Tutor",
  description:
    "Acelere o seu inglês para entrevistas técnicas com planos personalizados, aulas APA de 10-20 min e feedback de IA.",
  metadataBase: new URL("https://english-app.example"),
  openGraph: {
    title: "English AI Tutor",
    description:
      "Plano personalizado, Teacher AI e simulador de entrevista para profissionais de TI rumo ao nível C1.",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const featureFlags = getFeatureFlags();
  const session = await auth();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground`}
      >
        <AuthSessionProvider session={session}>
          <FeatureFlagsProvider flags={featureFlags}>{children}</FeatureFlagsProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
