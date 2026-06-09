import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, date, boolean } from "drizzle-orm/mysql-core";

/**
 * YourFin Rider - Sales Team KPI Tracking System
 * Database schema for tracking field sales activities
 */

// ── Users table ─────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  team: varchar("team", { length: 100 }),
  region: varchar("region", { length: 100 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  // Username/password login (accounts created by admin/manager, no OAuth needed)
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin", "sales", "manager"]).default("sales").notNull(),
  targetDailyClose: int("targetDailyClose").default(3).notNull(),
  photoUrl: text("photoUrl"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Stores table ────────────────────────────────────────────
export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: mysqlEnum("brand", ["SAMSUNG", "VIVO", "OPPO", "XIAOMI", "REALME", "APPLE", "OTHER"]).default("OTHER").notNull(),
  province: varchar("province", { length: 100 }),
  district: varchar("district", { length: 100 }),
  address: text("address"),
  lat: float("lat"),
  lng: float("lng"),
  partnerStatus: mysqlEnum("partnerStatus", ["PROSPECT", "ACTIVE", "CLOSED"]).default("PROSPECT").notNull(),
  ownerName: varchar("ownerName", { length: 255 }),
  ownerContact: varchar("ownerContact", { length: 100 }),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

// ── Activities table ────────────────────────────────────────
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: mysqlEnum("eventType", ["CLOCK_IN", "CHECK_IN", "CLOCK_OUT"]).notNull(),
  eventTime: timestamp("eventTime").defaultNow().notNull(),
  workDate: date("workDate").notNull(),
  lat: float("lat").notNull(),
  lng: float("lng").notNull(),
  // CHECK_IN specific fields
  storeId: int("storeId"),
  storeName: varchar("storeName", { length: 255 }),
  brand: mysqlEnum("brand", ["SAMSUNG", "VIVO", "OPPO", "XIAOMI", "REALME", "APPLE", "OTHER"]),
  visitStatus: mysqlEnum("visitStatus", ["SUCCESS", "PENDING", "REJECTED"]),
  photoUrl: text("photoUrl"),
  note: text("note"),
  // Distance calculation fields
  prevLat: float("prevLat"),
  prevLng: float("prevLng"),
  legDistanceKm: float("legDistanceKm").default(0),
  legDurationMin: float("legDurationMin").default(0),
  calcStatus: mysqlEnum("calcStatus", ["PENDING", "DONE", "SKIP", "ERROR"]).default("PENDING").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
