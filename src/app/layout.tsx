import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

// Matches openlane.com's brand typeface.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://localhost:3000"),
  title: {
    default: `OPENLANE | Wholesale Vehicle Auctions`,
    template: `%s | OPENLANE`,
  },
  description:
    "Browse live, upcoming, and ended wholesale vehicle auctions. Bid in real time, track countdowns, and buy select vehicles instantly at a fixed price.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        {children}
        <Footer />
      </body>
    </html>
  );
}
