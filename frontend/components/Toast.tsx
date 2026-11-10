"use client";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "info" | "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "info", onClose }: ToastProps) {
  const [toastClosing, setToastClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setToastClosing(true);
      setTimeout(onClose, 500); // Match this duration with the CSS animation duration
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const color =
    type === "error"
      ? "bg-rs-error"
      : type === "success"
      ? "bg-rs-700"
      : "bg-rs-info";

  return (
    <div
      role="status"
      className={`fixed top-6 right-6 z-[60] max-w-[calc(100vw-3rem)] px-6 py-3 rounded-xl text-white font-medium shadow-lg ${color} animate-slide-in-right`}
      style={{ animation: toastClosing ? "slide-out-right 0.5s forwards" : undefined }}
    >
      {message}
    </div>
  );
}
