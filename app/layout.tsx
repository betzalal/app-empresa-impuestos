import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sawalife Tax App",
  description: "Tax management application",
  icons: {
    icon: '/favicon.ico',
  },
};

import { ThemeProvider } from '@/app/components/ThemeProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
