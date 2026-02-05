export type User = {
  id: number;
  full_name: string;
  mobile: string;
  email?: string | null;
  created_at: string;
};

export type Unit = {
  id: number;
  project_id: number;
  unit_code: string;
  floor: number;
  area_m2: number;
  bedrooms: number;
  price: number;
  status: string;
};

export type FloorPlan = {
  id: number;
  title: string;
  level: string;
  file_format: string;
  source_url: string;
  viewer_url?: string | null;
  viewer_urn?: string | null;
};

export type ProjectListItem = {
  id: number;
  title: string;
  slug: string;
  description: string;
  address: string;
  status: string;
  cover_image?: string | null;
  available_units: number;
  min_price?: number | null;
};

export type ProjectDetail = {
  id: number;
  title: string;
  slug: string;
  description: string;
  address: string;
  status: string;
  cover_image?: string | null;
  plans: FloorPlan[];
  units: Unit[];
};

export type PurchaseRequest = {
  id: number;
  unit_id: number;
  user_id: number;
  status: string;
  tracking_code: string;
  note: string;
  created_at: string;
  updated_at: string;
  unit: Unit;
};

export type PaymentInitResponse = {
  payment: {
    id: number;
    request_id: number;
    amount: number;
    gateway: string;
    authority: string;
    status: string;
    ref_id?: string | null;
    created_at: string;
    verified_at?: string | null;
  };
  payment_url: string;
};
