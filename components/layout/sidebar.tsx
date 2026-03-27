"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavigation, SessionRole } from "@/app/lib/navigation";

type Props = {
  role: SessionRole;
  isAuthenticated: boolean;
};

export function AppSidebar({ role, isAuthenticated }: Props) {
  const pathname = usePathname() || "";
  const navigation = getNavigation(role, isAuthenticated);

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r bg-background md:block">
      <div className="flex h-16 items-center border-b px-5">
        <div>
          <p className="text-lg font-bold tracking-tight">Invictus League</p>
          <p className="text-xs text-muted-foreground">EAFC 26</p>
        </div>
      </div>

      <div className="p-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}