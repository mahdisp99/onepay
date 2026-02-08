"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "../../../components/auth-context";
import {
  createRequest,
  formatNumber,
  formatPrice,
  getProject,
  initiatePayment,
  parseApiError,
  submitRequest,
  translateProjectStatus,
  translateUnitStatus
} from "../../../lib/api";
import type { ProjectDetail } from "../../../lib/types";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<ProjectDetail["plans"][number] | null>(null);

  useEffect(() => {
    getProject(params.projectId)
      .then(setProject)
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [params.projectId]);

  async function reserveUnit(unitId: number) {
    setError(null);
    setActionMessage(null);

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const req = await createRequest(token, { unit_id: unitId });
      const submitted = req.status === "submitted" ? req : await submitRequest(token, req.id);
      const payment = await initiatePayment(token, { request_id: submitted.id, gateway: "mock" });
      setActionMessage("درخواست شما ثبت شد. در حال انتقال به درگاه پرداخت...");
      window.location.href = payment.payment_url;
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  return (
    <main className="container fade-in" style={{ paddingTop: "1.4rem", paddingBottom: "2rem" }}>
      {loading ? <p className="muted">در حال بارگذاری پروژه...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {actionMessage ? <p className="flash">{actionMessage}</p> : null}

      {project ? (
        <>
          <section className="hero">
            <div className="tags">
              <span className="tag">{translateProjectStatus(project.status)}</span>
              <span className="tag">پروژه شماره {formatNumber(project.id)}</span>
            </div>
            <h1>{project.title}</h1>
            <p>{project.description}</p>
            <p className="muted">آدرس: {project.address}</p>
          </section>

          <section className="split">
            <article className="card">
              <h3>نقشه‌ها (آماده نمایش CAD)</h3>
              <p className="muted">
                هر نقشه پس از تبدیل DWG به فرمت وب، قابل اتصال به Autodesk APS Viewer خواهد بود.
              </p>
              <div className="grid">
                {project.plans.map((plan) => (
                  <div className="card" key={plan.id}>
                    <h4>{plan.title}</h4>
                    <p className="muted">
                      طبقه/سطح: {plan.level} | فرمت: {plan.file_format.toUpperCase()}
                    </p>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => setActivePlan(plan)}
                    >
                      مشاهده نقشه
                    </button>
                  </div>
                ))}
              </div>
            </article>
            <article className="card">
              <h3>فرایند رزرو واحد</h3>
              <ol className="muted">
                <li>یک واحد آزاد انتخاب کنید.</li>
                <li>سیستم درخواست شما را با کد پیگیری ثبت می‌کند.</li>
                <li>پرداخت آنلاین امن را انجام دهید.</li>
                <li>وضعیت از داشبورد شما قابل پیگیری است.</li>
              </ol>
              <Link href="/dashboard" className="button warn">
                رفتن به داشبورد من
              </Link>
            </article>
          </section>

          {activePlan ? (
            <div
              className="modal-overlay"
              role="presentation"
              onClick={() => setActivePlan(null)}
            >
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <header className="modal-header">
                  <div>
                    <h3>{activePlan.title}</h3>
                    <p className="muted">
                      طبقه/سطح: {activePlan.level} | فرمت: {activePlan.file_format.toUpperCase()}
                    </p>
                  </div>
                  <button
                    className="button ghost modal-close"
                    type="button"
                    onClick={() => setActivePlan(null)}
                  >
                    بستن
                  </button>
                </header>
                <div className="modal-body">
                  <iframe
                    className="modal-frame"
                    title={activePlan.title}
                    src={activePlan.viewer_url || activePlan.source_url}
                  />
                  <div className="row" style={{ marginTop: "0.8rem" }}>
                    <a
                      className="button ghost"
                      href={activePlan.viewer_url || activePlan.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      باز کردن در تب جدید
                    </a>
                  </div>
                  <p className="muted" style={{ marginTop: "0.6rem" }}>
                    اگر فایل داخل مرورگر نمایش داده نشد، از لینک بالا برای دانلود یا مشاهده استفاده کنید.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <section style={{ marginTop: "1rem" }} className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>واحد</th>
                  <th>طبقه</th>
                  <th>متراژ</th>
                  <th>تعداد خواب</th>
                  <th>قیمت</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {project.units.map((unit) => (
                  <tr key={unit.id}>
                    <td>{unit.unit_code}</td>
                    <td>{formatNumber(unit.floor)}</td>
                    <td>{formatNumber(unit.area_m2)} متر</td>
                    <td>{formatNumber(unit.bedrooms)}</td>
                    <td>{formatPrice(unit.price)}</td>
                    <td>{translateUnitStatus(unit.status)}</td>
                    <td>
                      <button
                        className="button"
                        disabled={unit.status !== "available"}
                        onClick={() => {
                          void reserveUnit(unit.id);
                        }}
                        type="button"
                      >
                        رزرو و پرداخت
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </main>
  );
}
