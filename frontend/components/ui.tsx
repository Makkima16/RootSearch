"use client";

import React, { useEffect } from "react";
import type { IconType } from "react-icons";
import { LuX, LuCheck, LuCircleAlert, LuLoaderCircle, LuShieldAlert } from "react-icons/lu";

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

interface ModalProps {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Contenido entre el encabezado y el cuerpo (por ejemplo, pestañas). */
  toolbar?: React.ReactNode;
  size?: "md" | "lg" | "xl";
  closeDisabled?: boolean;
}

const MODAL_SIZES = { md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };

export function Modal({ title, onClose, children, footer, toolbar, size = "lg", closeDisabled }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !closeDisabled) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, closeDisabled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rs-950/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[90vh] w-full ${MODAL_SIZES[size]} flex-col overflow-hidden rounded-2xl bg-rs-surface shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-4 bg-rs-900 px-6 py-4">
          <h2 className="min-w-0 truncate font-display text-xl font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Cerrar"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[10px] text-rs-150 transition-colors hover:bg-rs-850 hover:text-white disabled:opacity-50"
          >
            <LuX className="size-5" aria-hidden="true" />
          </button>
        </div>
        {toolbar}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rs-line bg-rs-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pestañas                                                            */
/* ------------------------------------------------------------------ */

interface TabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ tabs, value, onChange, className = "" }: TabsProps<T>) {
  return (
    <div role="tablist" className={`flex gap-1 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`min-h-10 cursor-pointer whitespace-nowrap rounded-[10px] px-4 text-sm transition-colors ${
              active ? "bg-rs-700 font-semibold text-white" : "font-medium text-rs-muted hover:bg-rs-100 hover:text-rs-900"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Estado de un material                                               */
/* ------------------------------------------------------------------ */

const ESTADOS: Record<string, { label: string; className: string; icon?: IconType; dot?: string }> = {
  PUBLICADO: { label: "Publicado", className: "bg-rs-ok-bg text-rs-ok", icon: LuCheck },
  PENDIENTE_REVISION: { label: "Pendiente de revisión", className: "bg-rs-warn-bg text-rs-warn", dot: "bg-rs-warn-dot" },
  GENERANDO: { label: "Generando", className: "bg-rs-info-bg text-rs-info", dot: "bg-[#23798c]" },
  ERROR_GENERACION: { label: "Error de generación", className: "bg-rs-error-bg text-rs-error", icon: LuCircleAlert },
};

export function StatusChip({ estado }: { estado?: string }) {
  const config = (estado && ESTADOS[estado]) || {
    label: estado ? estado.replace(/_/g, " ").toLowerCase() : "Desconocido",
    className: "bg-rs-100 text-rs-800",
    dot: "bg-rs-400",
  };
  const Icon = config.icon;

  return (
    <span className={`rs-chip ${config.className}`}>
      {Icon ? (
        <Icon className="size-3.5" strokeWidth={3} aria-hidden="true" />
      ) : (
        <span className={`size-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      )}
      {config.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Encabezado de página                                                */
/* ------------------------------------------------------------------ */

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: IconType;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-rs-700 text-rs-lime">
            <Icon className="size-6" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="rs-title text-2xl sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-rs-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Estados de pantalla completa                                        */
/* ------------------------------------------------------------------ */

export function LoadingScreen({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center bg-rs-50 text-rs-900 lg:min-h-screen">
      <div className="text-center">
        <LuLoaderCircle className="mx-auto mb-4 size-10 animate-spin text-rs-700" aria-hidden="true" />
        <span className="text-lg">{label}</span>
      </div>
    </div>
  );
}

interface MessageScreenProps {
  title: string;
  message: React.ReactNode;
  action?: React.ReactNode;
}

export function MessageScreen({ title, message, action }: MessageScreenProps) {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center bg-rs-50 p-6 lg:min-h-screen">
      <div className="rs-card max-w-md p-8 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-rs-error-bg text-rs-error">
          <LuShieldAlert className="size-7" aria-hidden="true" />
        </span>
        <h1 className="rs-title mb-2 text-2xl">{title}</h1>
        <div className="text-rs-muted">{message}</div>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta de métrica                                                  */
/* ------------------------------------------------------------------ */

const STAT_TONES = {
  deep: { card: "bg-rs-700 text-white", label: "text-rs-150", value: "text-white", icon: "bg-rs-lime text-rs-900" },
  mint: { card: "bg-rs-200", label: "text-rs-800", value: "text-rs-950", icon: "bg-rs-700 text-rs-lime" },
  soft: { card: "bg-rs-100", label: "text-rs-800", value: "text-rs-950", icon: "bg-rs-600 text-white" },
  lime: { card: "bg-rs-lime-soft", label: "text-[#3b4a10]", value: "text-[#26300a]", icon: "bg-rs-900 text-rs-lime" },
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: IconType;
  tone?: keyof typeof STAT_TONES;
}

export function StatCard({ label, value, hint, icon: Icon, tone = "soft" }: StatCardProps) {
  const t = STAT_TONES[tone];
  return (
    <div className={`rounded-2xl p-5 ${t.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-medium ${t.label}`}>{label}</p>
          <p className={`mt-2 font-display text-4xl font-semibold ${t.value}`}>{value}</p>
        </div>
        {Icon && (
          <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${t.icon}`}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
      </div>
      {hint && <p className={`mt-3 text-sm ${t.label}`}>{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Estado vacío                                                        */
/* ------------------------------------------------------------------ */

export function EmptyState({ icon: Icon, children }: { icon?: IconType; children: React.ReactNode }) {
  return (
    <div className="rs-card flex flex-col items-center gap-3 p-8 text-center text-rs-muted">
      {Icon && (
        <span className="grid size-12 place-items-center rounded-xl bg-rs-100 text-rs-700">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <div>{children}</div>
    </div>
  );
}
