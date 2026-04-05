import type {Metadata} from 'next';
import { DM_Sans, Space_Mono } from "next/font/google";
import './globals.css'; // Global styles

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: 'IV Infographic Architect',
  description: 'An AI-powered clinical pharmacy tool that extracts IV drug handling data and generates professional medical infographics.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${spaceMono.variable} antialiased bg-cream text-black font-sans`} suppressHydrationWarning>{children}</body>
    </html>
  );
}
