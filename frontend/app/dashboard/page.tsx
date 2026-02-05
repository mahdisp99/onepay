"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../components/auth-context";
import { formatDateTime, formatPrice, getMyRequests, parseApiError, translateRequestStatus } from "../../lib/api";
import type { PurchaseRequest } from "../../lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, loading } = useAuth();
  const [items, setItems] = useState<PurchaseRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!token) {
      router.replace("/login");
      return;
    }
    getMyRequests(token)
      .then(setItems)
      .catch((err) => setError(parseApiError(err)));
  }, [token, loading, router]);

  return (
    <main className="container fade-in" style={{ paddingTop: "1.6rem", paddingBottom: "2rem" }}>
      <section className="hero">
        <h1>درخواست‌های خرید من</h1>
        <p>
          شما با نام <b>{user?.full_name || "-"}</b> وارد شده‌اید. وضعیت هر درخواست را از همین
          صفحه پیگیری کنید.
        </p>
      </section>
      {error ? <p className="error">{error}</p> : null}
      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>کد پیگیری</th>
              <th>شناسه پروژه</th>
              <th>واحد</th>
              <th>وضعیت</th>
              <th>قیمت</th>
              <th>تاریخ ثبت</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.tracking_code}</td>
                <td>{item.unit.project_id}</td>
                <td>{item.unit.unit_code}</td>
                <td>{translateRequestStatus(item.status)}</td>
                <td>{formatPrice(item.unit.price)}</td>
                <td>{formatDateTime(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div style={{ marginTop: "1rem" }}>
        <Link className="button ghost" href="/">
          بازگشت به پروژه‌ها
        </Link>
      </div>
    </main>
  );
}
