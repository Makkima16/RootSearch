import React, { useState } from "react";
import Link from "next/link";

interface User {
  name: string;
  role: string;
}

interface SideBarProps {
  user?: User; // Hacer que el prop sea opcional
}

export default function SideBar({ user }: SideBarProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  return (
    <>
      {/* Botón de hamburguesa para móvil */}
      <button
        className={`lg:hidden fixed top-4 right-4 z-50 bg-[#867CED] text-white p-2 rounded-md transition-all duration-300 ${
          isMobileMenuOpen ? "top-1/2 transform -translate-y-1/2" : "top-4"
        }`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isMinimized ? "w-16" : "w-48"
        } h-screen bg-[#4040ac] text-white flex flex-col shadow-lg transition-all duration-300 fixed lg:sticky lg:top-0 z-40 lg:z-auto ${
          isMobileMenuOpen ? "block" : "hidden lg:flex"
        }`}
      >
        {/* Logotipo y título */}
        <div
          className={`flex items-center ${
            isMinimized ? "justify-center" : "justify-start px-4"
          } mb-2 pt-4`}
        >
          <img
            src="/assets/black_logo.png"
            alt="RootSearch Logo"
            className={`w-8 h-8 ${
              isMinimized ? "mx-auto" : "mr-2"
            }`}
          />
          {!isMinimized && <h1 className="text-md font-bold">RootSearch</h1>}
        </div>

        <div className="border-t border-white my-4"></div>

        {/* Menú principal - con scroll si es necesario */}
        <nav
          className={`flex flex-col gap-6 w-full transition-all duration-300 overflow-y-auto flex-1 ${
            isMinimized ? "items-center px-0" : "px-4"
          }`}
        >
          <div className="mb-0">
            <h2
              className={`text-l font-bold text-white mb-1 ${
                isMinimized ? "hidden" : "block"
              }`}
            >
              Main Menu
            </h2>
            <a
              href="/dashboard"
              className="flex items-center gap-2 py-1 px-3 rounded-lg hover:bg-[#7165E9] transition"
            >
              <img
                src="/assets/iconos/dashboard.png"
                alt="Dashboard Icon"
                className="w-6 h-6 mb-2"
              />
              {!isMinimized && "Dashboard"}
            </a>
            {user?.role === "administrador" ? (
              <a
                href="/users/list"
                className="flex items-center gap-2 py-1 px-3 rounded-lg hover:bg-[#7165E9] transition"
              >
                <img
                  src="/assets/iconos/students.png"
                  alt="Users Icon"
                  className="w-6 h-6 mb-2"
                />
                {!isMinimized && "Usuarios"}
              </a>
            ) : user?.role === "docente" ? (
              <a
                href="/students/list"
                className="flex items-center gap-2 py-1 px-3 rounded-lg hover:bg-[#7165E9] transition"
              >
                <img
                  src="/assets/iconos/students.png"
                  alt="Students Icon"
                  className="w-6 h-6 mb-2"
                />
                {!isMinimized && "Estudiantes"}
              </a>
            ) : null}
            <a
              href={user?.role === "profesor" || user?.role === "administrador" ? "/courses/list" : "/courses/list"}
              className="flex items-center gap-2 py-1 px-3 rounded-lg hover:bg-[#7165E9] transition"
            >
              <img
                src="/assets/iconos/cursos.png"
                alt="Courses Icon"
                className="w-6 h-6 mb-2"
              />
              {!isMinimized && "Cursos"}
            </a>
          </div>

          <div className={`border-t border-white ${isMinimized ? "my-4" : "my-1"}`}></div>

          {/* General */}
          <div className="mb-0">
            <h2
              className={`text-l font-bold text-white mb-1 ${
                isMinimized ? "hidden" : "block"
              }`}
            >
              General
            </h2>
            {user?.role === "estudiante" ? (
              <a
                href="/communication"
                className="flex items-center gap-2 py-1 px-3 rounded-lg hover:bg-[#7165E9] transition mb-2"
              >
                <img
                  src="/assets/iconos/telephone.png"
                  alt="Communicate Icon"
                  className="w-6 h-6 mb-2"
                />
                {!isMinimized && "Comunicarse"}
              </a>
            ) : (
              <a
                href="/metrics"
                className="flex items-center gap-2 py-1 px-3 rounded-lg hover:bg-[#7165E9] transition mb-2"
              >
                <img
                  src="/assets/iconos/ojo_abierto.png"
                  alt="Metrics Icon"
                  className="w-6 h-6 mb-2"
                />
                {!isMinimized && "Métricas"}
              </a>
            )}
            {user?.role === "estudiante" ? (
              <a
                href="/homework"
                className="flex items-center gap-2 py-1 px-3 rounded-lg hover:bg-[#7165E9] transition"
              >
                <img
                  src="/assets/iconos/homework.png"
                  alt="Homeworks Icon"
                  className="w-6 h-6 mb-2"
                />
                {!isMinimized && "Homeworks"}
              </a>
            ) : (
              <a
                href="/materials"
                className="flex items-center gap-2 py-1 px-3 rounded-lg hover:bg-[#7165E9] transition"
              >
                <img
                  src="/assets/iconos/report.png"
                  alt="Material Icon"
                  className="w-6 h-6 mb-2"
                />
                {!isMinimized && "Materials LLM"}
              </a>
            )}
          </div>

          <div className={`border-t border-white ${isMinimized ? "my-4" : "my-1"}`}></div>

          {/* Cuenta */}
          <div className="mb-4">
            <h2
              className={`text-l font-bold text-white mb-1 ${
                isMinimized ? "hidden" : "block"
              }`}
            >
              Account
            </h2>
            <a
              href="/settings"
              className="flex items-center gap-2 py-1 px-3 rounded-lg hover:bg-[#7165E9] transition mb-2"
            >
              <img
                src="/assets/iconos/setting.png"
                alt="Settings Icon"
                className="w-6 h-6"
              />
              {!isMinimized && "Configuración Usuario"}
            </a>
            <Link
              href="/"
              className="flex items-center gap-2 py-1 px-3 rounded-lg hover:bg-[#7165E9] transition"
              onClick={() => {
                localStorage.removeItem("access_token");
              }}
            >
              <img
                src="/assets/iconos/logout.png"
                alt="Logout Icon"
                className="w-6 h-6 ml-0.5 "
              />
              {!isMinimized && "Logout"}
            </Link>
          </div>
        </nav>

        {/* Información del usuario */}
        <div
          className={`w-full flex items-center gap-4 px-4 py-4 border-t border-white flex-shrink-0 ${
            isMinimized ? "justify-center" : "justify-start"
          }`}
        >
          <img
            src="/assets/avatar.png"
            alt="User Avatar"
            className="w-10 h-9 rounded-full"
          />
          {!isMinimized && (
            <div>
              <p className="text-xs font-bold">{user?.name || "Name User"}</p>
              <p className="text-xs text-grey-200 mt-1">
                {user?.role ? formatRole(user.role) : "Role"}
              </p>
            </div>
          )}
        </div>

        {/* Botón de expandir/contraer */}
        <button
          onClick={() => {
            if (window.innerWidth >= 1024) {
              setIsMinimized(!isMinimized);
            }
          }}
          className={`
            absolute top-1/2 right-[-12px] transform -translate-y-1/2
            flex items-center justify-center
            w-5 h-5 rounded-md
            bg-[#4040ac] text-white
            hover:scale-110 hover:brightness-110 transition-all duration-300
            lg:block hidden
          `}
        >
          <img
            src="/assets/flecha.png"
            alt="toggle sidebar"
            className={`w-5 h-5 transition-transform duration-300 ${
              isMinimized ? "rotate-0" : "rotate-180"
            }`}
          />
        </button>
      </aside>
    </>
  );
}
