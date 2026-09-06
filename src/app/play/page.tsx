import type { Metadata } from "next";
import { PlayApp } from "@/features/session/components/play-app";

export const metadata: Metadata = {
  title: "Tennis Players",
  description: "Join the club waiting pool and see which court you are on.",
};

export default function PlayPage() {
  return <PlayApp />;
}
