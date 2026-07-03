"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Add" },
  { href: "/timeline", label: "Timeline" },
];

export function Nav() {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    links.findIndex((link) => link.href === pathname),
  );

  return (
    <nav className="relative inline-flex rounded-full bg-rose-50 p-1">
      {/* Sliding indicator that animates between the two segments. */}
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-24 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative z-10 w-24 cursor-pointer rounded-full py-1.5 text-center text-sm font-medium transition-colors ${
              isActive ? "text-rose-600" : "text-stone-500 hover:text-rose-500"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
