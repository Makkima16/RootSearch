"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../../services/users";
import Toast from "../../../components/Toast";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: "info" | "success" | "error" }>({ show: false, message: "", type: "info" });
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050214] font-sans">
      <div className="flex w-full max-w-4xl bg-[#181828] rounded-lg shadow-lg overflow-hidden">
        {/* Logo a la izquierda */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-[#181828] p-8 relative">
          <Image
            src="/assets/cat_study.jpg"
            alt="Cat Study"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover', borderRadius: '1rem' }}
            className="absolute inset-0 z-0"
          />
          <a
            href="/"
            className="absolute top-4 left-4 transition-transform duration-200 ease-in-out cursor-pointer hover:scale-110 z-10"
          >
            <Image src="/assets/logo.png" alt="Logo" width={80} height={80} />        
          </a>
        </div>
        {/* Formulario a la derecha */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h2 className="text-3xl font-semibold text-white mb-2">Sign in</h2>
          <p className="text-zinc-300 mb-2">If you don't have an account register</p>
          <p className="text-zinc-300 mb-6">You can <a href="/auth/register" className="text-[#6356E5] font-semibold">Register here !</a></p>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const res = await loginUser({ email, password });
                if (res.error) {
                  setToast({ show: true, message: res.error, type: "error" });
                } else {
                  setToast({ show: true, message: "Login exitoso", type: "success" });
                  setTimeout(() => {
                    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
                  }, 800);
                }
              } catch (err) {
                setToast({ show: true, message: "Error al iniciar sesión", type: "error" });
              }
              setLoading(false);
            }}
          >
            <div>
              <label htmlFor="email" className="block text-zinc-300 mb-1">Email</label>
              <div className="flex items-center border-b border-zinc-400 py-2">
                <span className="mr-2 text-zinc-400">📧</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="bg-transparent outline-none text-white w-full"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-zinc-300 mb-1">Password</label>
              <div className="flex items-center border-b border-zinc-400 py-2">
                <span className="mr-2 text-zinc-400">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  className="bg-transparent outline-none text-white w-full"
                  placeholder="Enter your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="ml-2 text-zinc-400 cursor-pointer select-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <img
                    src={showPassword ? "/assets/iconos/ojo_abierto.png" : "/assets/iconos/ojo_cerrado.png"}
                    alt={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="w-5 h-5"
                  />
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" /> Remember me
              </label>
              <a href="/auth/forgot-password" className="text-zinc-400 hover:text-[#5C54E7]">Forgot Password?</a>
            </div>
            <button
              type="submit"
              className="w-full py-3 mt-2 rounded-full bg-[#5C54E7] text-white font-semibold text-lg transition duration-200 cursor-pointer relative overflow-hidden group"
              disabled={loading}
            >
              <span className="relative z-10">{loading ? "Cargando..." : "Login"}</span>
              <span className="absolute inset-0 rounded-full bg-[#6356E5] opacity-0 group-active:opacity-100 group-hover:opacity-80 transition duration-200"></span>
            </button>
          </form>
          <div className="mt-6 text-center text-zinc-300">or continue with</div>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="text-2xl">
            <Image src="/assets/google.png" alt="Google" width={32} height={32} />
            </a>          
            <a href="#" className="text-2xl">
            <Image src="/assets/facebook.png" alt="Facebook" width={32} height={32} />
            </a>
            <a href="#" className="text-2xl">
            <Image src="/assets/apple.png" alt="Apple" width={32} height={32} />
            </a>
          </div>
        </div>
      </div>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}