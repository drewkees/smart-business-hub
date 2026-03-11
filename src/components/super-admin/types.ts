export type ActivationStatus = "pending" | "active" | "suspended";

export type SuperTab =
  | "overview"
  | "businesses"
  | "users"
  | "billing"
  | "systemmenu"
  | "menuuserauth"
  | "businesstype"
  | "settings"
  | "audit"
  | "integrations"
  | "notifications";

export type BusinessRow = {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  activation_status: ActivationStatus;
  created_at: string;
};

export type UserRow = {
  id: string;
  email: string;
  role: string;
  business: string;
  orders: number;
  total_spent: number;
  tier: "Silver" | "Gold" | "Regular";
};

export type RealUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  business_name: string;
  business_id: string | null;
  created_at: string | null;
  status: "active" | "pending" | "suspended";
};

export type OverviewStats = {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  totalUsers: number;
};
