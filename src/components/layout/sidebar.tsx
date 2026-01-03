"use client";

import {
  Home,
  Users,
  Mail,
  Settings,
  Database,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Image from "next/image";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/contatos", label: "Contatos", icon: Mail },
  { href: "/estatisticas", label: "Estatísticas", icon: Database },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
    hidden md:flex flex-col
    w-64
    h-screen
    bg-gradient-to-b from-[#0A2A5F] to-[#1E3A8A]
    text-white shadow-2xl
    sticky top-0
    overflow-y-auto
    scrollbar-thin scrollbar-thumb-[#3B82F6]/40 scrollbar-track-transparent
  "
    >
      <div
        className="flex items-center justify-center mb-10 py-4 
  bg-[#3B82F680]/20 backdrop-blur-lg rounded-xl shadow-lg 
  border border-[#60A5FA]/40 mx-6 mt-6"
      >
        <Image
          src="/images/logo.png"
          alt="Exxacta"
          width={170}
          height={55}
          priority
          className="
      drop-shadow-[0_20px_20px_rgba(29,78,216,0.55)]
      hover:drop-shadow-[0_10px_28px_rgba(29,78,216,0.75)]
      hover:scale-105
      transition-all duration-300
    "
        />
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center justify-between px-6 py-3 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                {label}
              </div>

              <ChevronRight
                size={16}
                className={clsx(
                  "transition-all",
                  active
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2"
                )}
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
