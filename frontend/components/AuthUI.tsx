"use client";

import { useState } from "react";
import Image from "next/image";
import type { IconType } from "react-icons";
import { LuEye, LuEyeOff } from "react-icons/lu";

interface AuthFieldProps {
  id: string;
  label: string;
  icon: IconType;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  /** Muestra el botón para ver u ocultar la contraseña. */
  togglePassword?: boolean;
}

/** Campo con línea inferior usado en las pantallas de autenticación. */
export function AuthField({
  id,
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required = true,
  minLength,
  togglePassword = false,
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputType = togglePassword ? (visible ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-rs-150">
        {label}
      </label>
      <div className="flex items-center border-b border-rs-400 py-2 transition-colors focus-within:border-rs-lime">
        <Icon className="mr-2 size-5 shrink-0 text-rs-400" aria-hidden="true" />
        <input
          type={inputType}
          id={id}
          name={id}
          required={required}
          minLength={minLength}
          className="w-full bg-transparent text-white outline-none placeholder:text-[#7fa390]"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {togglePassword && (
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="ml-2 grid size-8 shrink-0 cursor-pointer place-items-center text-rs-400 hover:text-rs-lime"
          >
            {visible ? (
              <LuEye className="size-5" aria-hidden="true" />
            ) : (
              <LuEyeOff className="size-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface AuthSubmitProps {
  loading: boolean;
  label: string;
  loadingLabel?: string;
}

export function AuthSubmit({ loading, label, loadingLabel = "Cargando..." }: AuthSubmitProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 w-full cursor-pointer rounded-full bg-rs-700 py-3 text-lg font-semibold text-white transition-colors duration-200 hover:bg-rs-600 active:bg-rs-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

/** Botones de acceso con redes sociales (sin funcionalidad en el backend todavía). */
export function AuthSocial() {
  return (
    <>
      <div className="mt-6 text-center text-rs-150">or continue with</div>
      <div className="mt-4 flex justify-center gap-6">
        <a href="#" aria-label="Continuar con Google">
          <Image src="/assets/google.png" alt="Google" width={32} height={32} />
        </a>
        <a href="#" aria-label="Continuar con Facebook">
          <Image src="/assets/facebook.png" alt="Facebook" width={32} height={32} />
        </a>
        <a href="#" aria-label="Continuar con Apple">
          <Image
            src="/assets/apple.png"
            alt="Apple"
            width={32}
            height={32}
            className="brightness-0 invert"
          />
        </a>
      </div>
    </>
  );
}

/** Fondo y tarjeta simple para verificación y recuperación de contraseña. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-rs-950 p-4 font-sans">
      <div className="w-full max-w-md rounded-lg bg-rs-900 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        {children}
      </div>
    </div>
  );
}
