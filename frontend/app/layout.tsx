import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { Navbar, Footer } from "@/components/layout";

export const metadata: Metadata = {
  title: "On-Chain Bug Bounty Platform",
  description: "Web3-native bug bounty platform with on-chain escrowed funds and decentralized governance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-gray-900 text-gray-100">
        <Web3Provider>
          <Navbar />
          <main className="min-h-[calc(100vh-200px)]">{children}</main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
