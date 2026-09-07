"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Board" },
  { href: "/play", label: "Play" },
  { href: "/settings", label: "Settings" },
] as const;

export function PlayNav() {
  const pathname = usePathname();

  return (
    <nav className="play-top-nav" aria-label="Club app">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={link.href === "/" ? "play-nav-board" : undefined}
          aria-current={pathname === link.href ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
