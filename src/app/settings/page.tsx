import type { Metadata } from "next";
import { SettingsApp } from "@/features/session/components/settings-app";

export const metadata: Metadata = {
  title: "Tennis Settings",
  description: "Set courts, singles or doubles, and manage the player pool.",
};

export default function SettingsPage() {
  return <SettingsApp />;
}
