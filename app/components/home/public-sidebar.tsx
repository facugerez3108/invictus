"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, Trophy, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isAuthenticated: boolean;
  isAdmin: boolean;
};

const publicLinks = [
  {
    label: "Inicio",
    href: "/",
    icon: Home,
  },
  {
    label: "Tabla general",
    href: "/",
    icon: Trophy,
  },
];

export function PublicSidebar({ isAuthenticated, isAdmin }: Props) {
  const pathname = usePathname();

  const adminLinks = isAdmin
    ? [
        {
          label: "Admin dashboard",
          href: "/admin/users",
          icon: Shield,
        },
      ]
    : [];

  const links = [...publicLinks, ...adminLinks];

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
      <div className="flex h-16 items-center border-b px-5">
        <div>
          <p className="text-lg font-bold">Invictus League</p>
          <p className="text-xs text-muted-foreground">EAFC 26</p>
        </div>
      </div>

      <div className="p-4">
        <nav className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}

          {!isAuthenticated && (
            <Link
              href="/login"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </nav>
      </div>
    </aside>
  );
}