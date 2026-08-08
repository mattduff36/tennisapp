import type { Metadata, Viewport } from "next";
import { Archivo_Black, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display-loaded",
});

const ui = IBM_Plex_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ui-loaded",
});

export const metadata: Metadata = {
  title: "Tennis Court Board",
  description:
    "Touch-friendly tennis pegboard for waiting players and three on-court groups.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f7a3d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body>
        {/*
          THESIS: The board is a working grass tennis court, not cards on wallpaper; Waiting and three courts are court geometry.
          OWN-WORLD: Saturated grass, structural white lines, tennis-ball markers, scoreboard labels, high-contrast touch plates.
          STORY: A helper adds players, selects from Waiting, places onto a court, and returns them with one clear tap.
          FIRST VIEWPORT: Header + add player, status strip, Waiting column, On Court with three court panels.
          FORM: Pinned working-tennis-court Operate surface; seed user-pinned.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        {children}
      </body>
    </html>
  );
}
