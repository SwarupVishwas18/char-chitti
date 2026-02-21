import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Char-Chitti | चार चिठ्ठी",
  description: "A fun multiplayer chit-passing party game from Maharashtra!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
