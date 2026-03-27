import {
  Home,
  Shield,
  Trophy,
  Users,
  LogIn,
  Building2,
  Swords,
  LayoutDashboard,
} from "lucide-react";

export type SessionRole = "ADMIN" | "USER" | null;

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function getNavigation(role: SessionRole, isAuthenticated: boolean) {
  const publicLinks: NavItem[] = [
    {
      label: "Inicio",
      href: "/",
      icon: Home,
    },
  ];

  const userLinks: NavItem[] = isAuthenticated
    ? [
        {
          label: "Panel",
          href: "/panel",
          icon: LayoutDashboard,
        },
      ]
    : [
        {
          label: "Login",
          href: "/login",
          icon: LogIn,
        },
      ];

  const adminLinks: NavItem[] =
    role === "ADMIN"
      ? [
          {
            label: "Usuarios",
            href: "/admin/users",
            icon: Users,
          },
          {
            label: "Ligas",
            href: "/admin/leagues",
            icon: Building2,
          },
          {
            label: "Equipos",
            href: "/admin/teams",
            icon: Trophy,
          },
          {
            label: "Partidos",
            href: "/admin/matches",
            icon: Swords,
          },
        ]
      : [];

  return [...publicLinks, ...userLinks, ...adminLinks];
}