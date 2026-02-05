"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatNumber, formatPrice, getProjects, parseApiError, translateProjectStatus } from "../lib/api";
import type { ProjectListItem } from "../lib/types";

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container fade-in">
      <section className="hero">
        <div className="tags">
          <span className="tag">نقشه‌های CAD</span>
          <span className="tag">رزرو واحد</span>
          <span className="tag">پرداخت آنلاین</span>
        </div>
        <h1>پلتفرم فروش پروژه‌های مسکونی وان‌پی</h1>
        <p>
          پروژه‌های فعال را ببینید، نقشه‌ها را بررسی کنید، واحد مناسب انتخاب کنید و درخواست خرید
          خود را با پیگیری مرحله‌به‌مرحله ثبت کنید.
        </p>
      </section>

      {loading ? <p className="muted">در حال بارگذاری پروژه‌ها...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <section className="grid">
        {projects.map((project) => (
          <article className="card" key={project.id}>
            <h3>{project.title}</h3>
            <p className="muted">{project.description}</p>
            <div className="tags">
              <span className="tag">وضعیت: {translateProjectStatus(project.status)}</span>
              <span className="tag">واحدهای آزاد: {formatNumber(project.available_units)}</span>
              <span className="tag">شروع قیمت: {formatPrice(project.min_price)}</span>
            </div>
            <p className="muted">آدرس: {project.address}</p>
            <Link className="button" href={`/projects/${project.id}`}>
              مشاهده واحدها و نقشه‌ها
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
