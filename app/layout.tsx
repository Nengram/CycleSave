import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-instrument" });

export const metadata: Metadata = {
  title: "CycleSave - Digital Njangi",
  description: "A transparent, mobile-money powered rotating savings platform for Cameroon.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession(); // null when logged out
  return (
    <html lang="en" className={`${inter.variable} ${instrument.variable}`}>
      <body>
        <div className="container">
          <Navbar user={session ? { name: session.name } : null} />
          <main className="page">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
