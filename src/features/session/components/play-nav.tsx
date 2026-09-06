"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PlayNav() {
  const pathname = usePathname();

  return (
    <nav className="play-nav" aria-label="Player app">
      <Link href="/play" aria-current={pathname === "/play" ? "page" : undefined}>
        Play
      </Link>
      <Link
        href="/settings"
        aria-current={pathname === "/settings" ? "page" : undefined}
      >
        Settings
      </Link>
    </nav>
  );
}
