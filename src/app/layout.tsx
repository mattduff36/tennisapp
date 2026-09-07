import type { Metadata, Viewport } from "next";
import { Archivo_Black, IBM_Plex_Sans } from "next/font/google";
import { headers } from "next/headers";
import { isPhoneUserAgent } from "@/lib/is-phone";
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
    "Touch-friendly tennis pegboard and a shared phone pool for waiting players.",
  applicationName: "Tennis Players",
  appleWebApp: {
    capable: true,
    title: "Tennis Players",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#145a2e",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#145a2e",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userAgent = (await headers()).get("user-agent");
  const device = isPhoneUserAgent(userAgent) ? "phone" : "other";

  return (
    <html
      lang="en"
      className={`${display.variable} ${ui.variable}`}
      data-device={device}
    >
      <body>
        {/*
          THESIS: The board is a working grass tennis court, not cards on wallpaper; Waiting and named courts are court geometry.
          OWN-WORLD: Saturated grass, structural white lines, tennis-ball markers, scoreboard labels, high-contrast touch plates.
          STORY: Helpers add waiters and tap Players ready; phones join the same pool and see the assigned court.
          FIRST VIEWPORT: Header + add player, session status, Waiting column, On Court plates, Players ready dock.
          FORM: Pinned working-tennis-court Operate surface; seed user-pinned.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        {children}
      </body>
    </html>
  );
}
