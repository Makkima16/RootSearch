"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyCode } from "../../../services/users";
import Toast from "../../../components/Toast";

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
    // ✅ Guardar token si existe
    if (res.access_token) {
      localStorage.setItem("access_token", res.access_token);
    }

    setToast({ show: true, message: "Código verificado con éxito", type: "success" });
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  }
} catch (err) {
  setToast({ show: true, message: "Error al verificar el código", type: "error" });
} finally {
  setLoading(false);
}


};

return ( <div className="min-h-screen flex items-center justify-center bg-[#050214] font-sans"> <div className="w-full max-w-md bg-[#181828] p-8 rounded-lg shadow-lg"> <h2 className="text-3xl font-semibold text-white mb-6">Verificar Código</h2>


    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="number"
          inputMode="numeric"
          maxLength={6}
          className="w-full h-12 text-center text-2xl bg-transparent border border-zinc-400 text-white rounded-md focus:outline-none"
          value={code}
          onChange={(e) => setCode(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Ingrese el código de 6 dígitos"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 mt-4 rounded-full bg-[#5C54E7] text-white font-semibold text-lg transition duration-200 cursor-pointer relative overflow-hidden group"
        disabled={loading}
      >
        <span className="relative z-10">{loading ? "Verificando..." : "Verificar"}</span>
        <span className="absolute inset-0 rounded-full bg-[#6356E5] opacity-0 group-active:opacity-100 group-hover:opacity-80 transition duration-200"></span>
      </button>
    </form>

    {toast.show && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    )}
  </div>
</div>


);
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050214] text-white">
          Cargando...
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
