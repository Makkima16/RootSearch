"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyCode } from "../../../services/users";
import Toast from "../../../components/Toast";
import Logo from "../../../components/Logo";
import { AuthShell, AuthSubmit } from "../../../components/AuthUI";

function VerifyForm() {
  const [code, setCode] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: "info" | "success" | "error" }>({
    show: false,
    message: "",
    type: "info",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (code === "" || isNaN(Number(code))) {
      setToast({ show: true, message: "Por favor, ingrese el código numérico", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await verifyCode({ email, code: Number(code) });

      if (res.error) {
        setToast({ show: true, message: res.error, type: "error" });
      } else {
        // Guardar el token si el backend lo devuelve
        if (res.access_token) {
          localStorage.setItem("access_token", res.access_token);
        }

        setToast({ show: true, message: "Código verificado con éxito", type: "success" });
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      }
    } catch {
      setToast({ show: true, message: "Error al verificar el código", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Logo size={56} variant="principal" className="mb-6" />
      <h2 className="mb-2 text-3xl font-semibold text-white">Verificar Código</h2>
      <p className="mb-6 text-sm text-rs-150">
        Ingresa el código de 6 dígitos que enviamos
        {email ? (
          <>
            {" "}a <span className="font-semibold text-white">{email}</span>
          </>
        ) : (
          " a tu correo"
        )}
        .
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="code" className="sr-only">
          Código de verificación
        </label>
        <input
          id="code"
          type="number"
          inputMode="numeric"
          maxLength={6}
          className="h-14 w-full rounded-md border border-rs-400 bg-transparent text-center text-2xl tracking-[0.3em] text-white placeholder:text-base placeholder:tracking-normal placeholder:text-[#7fa390] focus:border-rs-lime focus:outline-none"
          value={code}
          onChange={(e) => setCode(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Ingrese el código de 6 dígitos"
        />

        <AuthSubmit loading={loading} label="Verificar" loadingLabel="Verificando..." />
      </form>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-rs-950 text-white">Cargando...</div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
