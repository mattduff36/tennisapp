import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tennis Players",
    short_name: "Tennis",
    description: "Join the club waiting pool and see which court you are on.",
    start_url: "/play",
    display: "standalone",
    background_color: "#145a2e",
    theme_color: "#1f7a3d",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
