"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "../../components/auth-context";
import { loginUser, parseApiError, registerUser } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "login") {
        const response = await loginUser({
          mobile: String(formData.get("mobile") || ""),
          password: String(formData.get("password") || "")
        });
        setSession(response.access_token, response.user);
        router.push("/dashboard");
      } else {
        const response = await registerUser({
          full_name: String(formData.get("full_name") || ""),
          mobile: String(formData.get("mobile") || ""),
          password: String(formData.get("password") || ""),
          email: String(formData.get("email") || "") || undefined
        });
        setSession(response.access_token, response.user);
        setMessage("حساب شما با موفقیت ساخته شد. در حال انتقال به داشبورد...");
        setTimeout(() => router.push("/dashboard"), 300);
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container fade-in" style={{ paddingTop: "2rem" }}>
      <section className="card" style={{ maxWidth: 620, margin: "0 auto" }}>
        <h2>{mode === "login" ? "ورود" : "ایجاد حساب کاربری"}</h2>
        <p className="muted">برای مدیریت درخواست‌ها و پرداخت‌ها با شماره موبایل وارد شوید.</p>
        <div className="row">
          <button
            className={`button ${mode === "login" ? "" : "ghost"}`}
            onClick={() => setMode("login")}
            type="button"
          >
            ورود
          </button>
          <button
            className={`button ${mode === "register" ? "" : "ghost"}`}
            onClick={() => setMode("register")}
            type="button"
          >
            ثبت‌نام
          </button>
        </div>
        <form onSubmit={(event) => void onSubmit(event)} style={{ marginTop: "1rem", display: "grid", gap: "0.8rem" }}>
          {mode === "register" ? (
            <label className="field">
              نام و نام خانوادگی
              <input name="full_name" placeholder="نام کامل شما" required />
            </label>
          ) : null}
          {mode === "register" ? (
            <label className="field">
              ایمیل (اختیاری)
              <input className="ltr" name="email" type="email" placeholder="you@example.com" />
            </label>
          ) : null}
          <label className="field">
            شماره موبایل
            <input className="ltr" name="mobile" placeholder="09120000000" required />
          </label>
          <label className="field">
            رمز عبور
            <input className="ltr" name="password" type="password" placeholder="حداقل ۸ کاراکتر" required />
          </label>
          <button className="button" disabled={loading} type="submit">
            {loading ? "لطفا صبر کنید..." : mode === "login" ? "ورود" : "ایجاد حساب"}
          </button>
        </form>
        {message ? <p className="flash">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}
