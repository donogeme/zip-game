import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zip - Connect the Dots Puzzle",
  description: "Connect numbered dots while filling the entire grid in one continuous path",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
