import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CV Analyze",
  description: "Platform cerdas bertenaga AI untuk analisis CV presisi, optimasi skor ATS, serta rekomendasi pekerjaan impian dengan teknologi mutakhir. Dibuat oleh Indra Suliwa.",
  authors: [{ name: "Indra Suliwa" }],
  creator: "Indra Suliwa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#090a0f] text-[#f1f1f6] selection:bg-[#9d4dfb] selection:text-white">
        {children}
      </body>
    </html>
  );
}
