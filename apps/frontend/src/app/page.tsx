"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("copa_token");
      const isRemembered = localStorage.getItem("copa_remember_me") === "true";
      const lastActivity = localStorage.getItem("copa_last_activity");

      let sessionExpired = false;
      if (token && !isRemembered && lastActivity) {
        const elapsed = Date.now() - Number(lastActivity);
        if (elapsed > 30 * 60 * 1000) {
          sessionExpired = true;
          localStorage.removeItem("copa_token");
          localStorage.removeItem("copa_user");
          localStorage.removeItem("copa_last_activity");
          localStorage.removeItem("copa_remember_me");
        }
      }

      if (token && !sessionExpired) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [router]);

  return (
    <div className="copa-auth-bg min-h-screen text-white flex flex-col items-center justify-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#ffd700]" />
      <p className="text-white/60 text-sm font-semibold">Redirecionando...</p>
    </div>
  );
}
