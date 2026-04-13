import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SurgeonValue | Find the CPT Codes You Qualify For But Don't Bill",
  description:
    "9 AI agents scan your panel, a physician attests, and you get paid. SurgeonValue finds the revenue your practice is leaving on the table.",
  openGraph: {
    title: "SurgeonValue | Your Practice Is Leaving $240,000 on the Table",
    description:
      "9 AI agents scan your panel, a physician attests, and you get paid. $299/month.",
    url: "https://surgeonvalue.com",
    siteName: "SurgeonValue",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#1B2A4A" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
          }
        `}</Script>
        <Script src="https://solvinghealth.com/footer.js" data-brand="surgeonvalue" data-theme="dark" strategy="lazyOnload" />
      </body>
    </html>
  );
}
