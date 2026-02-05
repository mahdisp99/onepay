"use client";

import Link from "next/link";
import { useAuth } from "./auth-context";

export function SiteHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="container row between center">
        <Link href="/" className="brand">
          وان‌پی
          <span>مسکونی</span>
        </Link>
        <nav className="row center nav-links">
          <Link href="/">پروژه‌ها</Link>
          {user ? <Link href="/dashboard">درخواست‌های من</Link> : null}
          {!user ? <Link href="/login">ورود</Link> : null}
          {user ? (
            <button type="button" className="button ghost" onClick={logout}>
              خروج
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
