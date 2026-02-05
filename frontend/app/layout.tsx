import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import { AuthProvider } from "../components/auth-context";
import { SiteHeader } from "../components/site-header";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  title: "وان‌پی | فروش پروژه‌های مسکونی",
  description: "نمایش پروژه‌ها، مشاهده نقشه‌ها، ثبت درخواست خرید واحد و پرداخت آنلاین."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.className}>
        <AuthProvider>
          <SiteHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
