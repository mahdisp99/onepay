import type {
  PaymentInitResponse,
  ProjectDetail,
  ProjectListItem,
  PurchaseRequest,
  User
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";

const projectStatusMap: Record<string, string> = {
  pre_sale: "پیش‌فروش",
  active: "فعال",
  completed: "تکمیل‌شده"
};

const unitStatusMap: Record<string, string> = {
  available: "آزاد",
  reserved: "رزرو شده",
  sold: "فروخته شده"
};

const requestStatusMap: Record<string, string> = {
  draft: "پیش‌نویس",
  submitted: "ثبت شده",
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت شده",
  rejected: "رد شده",
  cancelled: "لغو شده"
};

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function registerUser(payload: {
  full_name: string;
  mobile: string;
  password: string;
  email?: string;
}): Promise<{ access_token: string; user: User }> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function loginUser(payload: {
  mobile: string;
  password: string;
}): Promise<{ access_token: string; user: User }> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getMe(token: string): Promise<User> {
  return apiFetch("/auth/me", {}, token);
}

export async function getProjects(): Promise<ProjectListItem[]> {
  return apiFetch("/projects");
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  return apiFetch(`/projects/${projectId}`);
}

export async function createRequest(
  token: string,
  payload: { unit_id: number; note?: string }
): Promise<PurchaseRequest> {
  return apiFetch("/requests", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function submitRequest(token: string, requestId: number): Promise<PurchaseRequest> {
  return apiFetch(`/requests/${requestId}/submit`, { method: "POST" }, token);
}

export async function getMyRequests(token: string): Promise<PurchaseRequest[]> {
  return apiFetch("/requests/my", {}, token);
}

export async function initiatePayment(
  token: string,
  payload: { request_id: number; gateway?: string }
): Promise<PaymentInitResponse> {
  return apiFetch("/payments/initiate", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function formatPrice(value: number | null | undefined): string {
  if (value == null) {
    return "نامشخص";
  }
  return `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function translateProjectStatus(value: string): string {
  return projectStatusMap[value] || value;
}

export function translateUnitStatus(value: string): string {
  return unitStatusMap[value] || value;
}

export function translateRequestStatus(value: string): string {
  return requestStatusMap[value] || value;
}

export function parseApiError(error: unknown): string {
  const raw = String(error || "");
  if (raw.includes("Failed to fetch")) {
    return "ارتباط با سرور برقرار نشد. لطفا اتصال شبکه یا وضعیت API را بررسی کنید.";
  }
  if (raw.includes("Invalid mobile or password")) {
    return "شماره موبایل یا رمز عبور اشتباه است.";
  }
  if (raw.includes("Mobile already registered")) {
    return "این شماره موبایل قبلا ثبت شده است.";
  }
  if (raw.includes("Email already registered")) {
    return "این ایمیل قبلا ثبت شده است.";
  }
  if (raw.includes("Unit already")) {
    return "این واحد در حال حاضر قابل رزرو نیست.";
  }
  return raw.replace(/^Error:\s*/i, "");
}
