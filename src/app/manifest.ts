import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tennis Players",
    short_name: "Tennis",
    description: "Join the club waiting pool and see which court you are on.",
    id: "/",
    start_url: "/play",
    scope: "/",
    display: "standalone",
    display_override: ["standalone"],
    lang: "en",
    categories: ["sports"],
    background_color: "#145a2e",
    theme_color: "#145a2e",
    launch_handler: {
      client_mode: "navigate-existing",
    },
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Board",
        short_name: "Board",
        description: "Live court board",
        url: "/",
      },
      {
        name: "Play",
        short_name: "Play",
        description: "Join the waiting pool",
        url: "/play",
      },
      {
        name: "Settings",
        short_name: "Settings",
        description: "Session settings",
        url: "/settings",
      },
    ],
  };
}
