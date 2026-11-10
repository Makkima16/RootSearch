"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  LuHouse,
  LuBookOpen,
  LuUsers,
  LuChartColumn,
  LuSparkles,
  LuMessageCircle,
  LuClipboardList,
  LuSettings,
  LuLogOut,
  LuMenu,
  LuX,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import Logo from "./Logo";

interface User {
  name: string;
  role: string;
}

interface SideBarProps {
  user?: User; // Opcional: algunas páginas lo renderizan antes de cargar el usuario
}

interface NavItem {
  href: string;
  label: string;
  icon: IconType;
}

/** Enlaces del menú según el rol del usuario (misma lógica que la versión anterior). */
function getNavItems(role?: string): NavItem[] {
  const items: NavItem[] = [{ href: "/dashboard", label: "Inicio", icon: LuHouse }];

  if (role === "administrador") {
    items.push({ href: "/users/list", label: "Usuarios", icon: LuUsers });
  } else if (role === "docente") {
    items.push({ href: "/students/list", label: "Estudiantes", icon: LuUsers });
  }

  items.push({ href: "/courses/list", label: "Cursos", icon: LuBookOpen });

  if (role === "estudiante") {
    items.push({ href: "/communication", label: "Comunicarse", icon: LuMessageCircle });
    items.push({ href: "/homework", label: "Tareas", icon: LuClipboardList });
  } else {
    items.push({ href: "/metrics", label: "Métricas", icon: LuChartColumn });
    items.push({ href: "/materials", label: "Materiales IA", icon: LuSparkles });
  }

  items.push({ href: "/settings", label: "Configuración", icon: LuSettings });
  return items;
}

function getInitials(name?: string) {
  if (!name) return "RS";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export default function SideBar({ user }: SideBarProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const items = getNavItems(user?.role);

  const isActive = (href: string) => {
    const section = href.split("/")[1];
    return pathname === href || (section !== "" && pathname?.startsWith(`/${section}`));
  };

  const logout = () => {
    localStorage.removeItem("access_token");
  };

  const navContent = (compact: boolean) => (
    <>
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={compact ? label : undefined}
              aria-current={active ? "page" : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors ${
                compact ? "justify-center" : ""
              } ${
                active
                  ? "bg-rs-lime font-semibold text-rs-950"
                  : "font-medium text-rs-150 hover:bg-rs-850 hover:text-white"
              }`}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {!compact && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={`mt-4 flex items-center gap-3 rounded-xl bg-rs-950 p-3 ${
          compact ? "flex-col" : ""
        }`}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rs-600 text-sm font-semibold text-white">
          {getInitials(user?.name)}
        </span>
        {!compact && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name || "Usuario"}</p>
            <p className="text-[13px] text-rs-300">{user?.role ? formatRole(user.role) : "Rol"}</p>
          </div>
        )}
        <Link
          href="/"
          onClick={logout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="grid size-11 shrink-0 place-items-center rounded-[10px] text-rs-300 transition-colors hover:bg-rs-850 hover:text-white"
        >
          <LuLogOut className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Barra superior en móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-rs-900 px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo size={32} variant="lima" />
          <span className="font-display text-lg font-bold text-white">RootSearch</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={isMobileMenuOpen}
          className="grid size-11 cursor-pointer place-items-center rounded-[10px] text-rs-150 hover:bg-rs-850"
        >
          <LuMenu className="size-6" aria-hidden="true" />
        </button>
      </header>

      {/* Menú lateral en móvil */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 cursor-default bg-rs-950/60"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-rs-900 p-4">
            <div className="mb-6 flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <Logo size={32} variant="lima" />
                <span className="font-display text-lg font-bold text-white">RootSearch</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Cerrar menú"
                className="grid size-11 cursor-pointer place-items-center rounded-[10px] text-rs-150 hover:bg-rs-850"
              >
                <LuX className="size-6" aria-hidden="true" />
              </button>
            </div>
            {navContent(false)}
          </aside>
        </div>
      )}

      {/* Barra lateral en escritorio */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-rs-900 px-3 py-6 transition-[width] duration-300 lg:flex ${
          isMinimized ? "w-20" : "w-64"
        }`}
      >
        <Link
          href="/dashboard"
          className={`mb-8 flex items-center gap-2.5 ${isMinimized ? "justify-center" : "px-2"}`}
        >
          <Logo size={36} variant="lima" />
          {!isMinimized && <span className="font-display text-lg font-bold text-white">RootSearch</span>}
        </Link>

        {navContent(isMinimized)}

        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          aria-label={isMinimized ? "Expandir menú" : "Contraer menú"}
          className="absolute top-1/2 -right-3 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-rs-400 bg-rs-100 text-rs-900 shadow transition-transform hover:scale-110"
        >
          {isMinimized ? (
            <LuChevronRight className="size-4" aria-hidden="true" />
          ) : (
            <LuChevronLeft className="size-4" aria-hidden="true" />
          )}
        </button>
      </aside>
    </>
  );
}
