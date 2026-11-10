"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuMail, LuLock } from "react-icons/lu";
import { loginUser } from "../../../services/users";
import Toast from "../../../components/Toast";
import Logo from "../../../components/Logo";
import { AuthField, AuthSocial, AuthSubmit } from "../../../components/AuthUI";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: "info" | "success" | "error" }>({ show: false, message: "", type: "info" });
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-rs-950 p-4 font-sans">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-lg bg-rs-900 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        {/* Ilustración y logo a la izquierda */}
        <div className="relative hidden w-1/2 flex-col items-center justify-center bg-rs-900 p-8 md:flex">
          <Image
            src="/assets/cat_study.jpg"
            alt="Gato estudiando sobre libros"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover", borderRadius: "1rem" }}
            className="absolute inset-0 z-0"
          />
          <a
            href="/"
            aria-label="RootSearch, inicio"
            className="absolute top-4 left-4 z-10 cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110"
          >
            <Logo size={80} variant="principal" />
          </a>
        </div>
        {/* Formulario a la derecha */}
        <div className="flex w-full flex-col justify-center p-8 md:w-1/2">
          <h2 className="mb-2 text-3xl font-semibold text-white">Sign in</h2>
          <p className="mb-2 text-rs-150">If you don&apos;t have an account register</p>
          <p className="mb-6 text-rs-150">
            You can{" "}
            <a href="/auth/register" className="font-semibold text-rs-lime hover:text-[#dceba0]">
              Register here !
            </a>
          </p>
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
              } catch {
                setToast({ show: true, message: "Error al iniciar sesión", type: "error" });
              }
              setLoading(false);
            }}
          >
            <AuthField
              id="email"
              label="Email"
              icon={LuMail}
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={setEmail}
            />
            <AuthField
              id="password"
              label="Password"
              icon={LuLock}
              placeholder="Enter your Password"
              value={password}
              onChange={setPassword}
              togglePassword
            />
            <div className="flex items-center justify-between text-sm text-rs-150">
              <label className="flex cursor-pointer items-center">
                <input type="checkbox" className="mr-2 accent-rs-700" /> Remember me
              </label>
              <a href="/auth/forgot-password" className="text-rs-300 hover:text-rs-lime">
                Forgot Password?
              </a>
            </div>
            <AuthSubmit loading={loading} label="Login" />
          </form>
          <AuthSocial />
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
