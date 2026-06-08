// Shared types between client and server

export type UserRole = "user" | "admin" | "sales" | "manager";

export type EventType = "CLOCK_IN" | "CHECK_IN" | "CLOCK_OUT";

export type Brand = "SAMSUNG" | "VIVO" | "OPPO" | "XIAOMI" | "REALME" | "APPLE" | "OTHER";

export type VisitStatus = "SUCCESS" | "PENDING" | "REJECTED";

export type CalcStatus = "PENDING" | "DONE" | "SKIP" | "ERROR";

export type PartnerStatus = "PROSPECT" | "ACTIVE" | "CLOSED";

// Status colors for map pins
export const VISIT_STATUS_COLORS: Record<VisitStatus, string> = {
  SUCCESS: "#22c55e",   // green
  PENDING: "#9ca3af",   // gray
  REJECTED: "#f97316",  // orange
};

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  SUCCESS: "สำเร็จ",
  PENDING: "รอ",
  REJECTED: "ปฏิเสธ",
};

export const BRAND_LABELS: Record<Brand, string> = {
  SAMSUNG: "Samsung",
  VIVO: "Vivo",
  OPPO: "Oppo",
  XIAOMI: "Xiaomi",
  REALME: "Realme",
  APPLE: "Apple",
  OTHER: "อื่นๆ",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CLOCK_IN: "เข้างาน",
  CHECK_IN: "เช็คอินร้าน",
  CLOCK_OUT: "เลิกงาน",
};
