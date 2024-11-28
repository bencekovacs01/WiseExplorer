import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dotenv from 'dotenv';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

dotenv.config();

export const metadata: Metadata = {
    title: 'ExploreWise',
    description: 'Explore the area!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
