import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'IV Infographic Architect',
  description: 'An AI-powered clinical pharmacy tool that extracts IV drug handling data and generates professional medical infographics.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
