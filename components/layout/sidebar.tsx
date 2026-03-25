"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin/users", label: "Usuarios" },
    { href: "/admin/leagues", label: "Ligas" },
    { href: "/admin/teams", label: "Equipos" },
  ];

  return (
    <aside className="w-64 border-r bg-white p-4">
      <h2 className="mb-6 text-lg font-bold">EAFC League</h2>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm ${
                active
                  ? "bg-black text-white"
                  : "hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}