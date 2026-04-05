import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
