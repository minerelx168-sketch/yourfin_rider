import { eq, and, gte, lte, desc, asc, sql, count, sum, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, stores, activities, InsertStore, InsertActivity } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── User helpers ─────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "phone", "team", "region"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSalesUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "sales"));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

// ── Username/password account helpers ────────────────────────

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Create a local account (username/password) provisioned by an admin/manager. */
export async function createLocalUser(data: {
  openId: string;
  username: string;
  passwordHash: string;
  name: string;
  role: "sales" | "manager" | "admin";
  phone?: string | null;
  team?: string | null;
  region?: string | null;
  targetDailyClose?: number;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    openId: data.openId,
    username: data.username,
    passwordHash: data.passwordHash,
    name: data.name,
    role: data.role,
    phone: data.phone ?? null,
    team: data.team ?? null,
    region: data.region ?? null,
    loginMethod: "password",
    ...(data.targetDailyClose !== undefined ? { targetDailyClose: data.targetDailyClose } : {}),
  });
  return { id: result[0].insertId };
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function setUserActive(userId: number, active: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ active }).where(eq(users.id, userId));
}

export async function touchLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// ── Store helpers ────────────────────────────────────────────

export async function createStore(store: InsertStore) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stores).values(store);
  return { id: result[0].insertId };
}

export async function getStoreById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllStores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stores);
}

// ── Activity helpers ─────────────────────────────────────────

export async function createActivity(activity: InsertActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(activities).values(activity);
  return { id: result[0].insertId };
}

export async function getLastActivityForUser(userId: number, workDate: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(activities)
    .where(and(eq(activities.userId, userId), sql`${activities.workDate} = ${workDate}`))
    .orderBy(desc(activities.eventTime))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserActivitiesForDate(userId: number, workDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activities)
    .where(and(eq(activities.userId, userId), sql`${activities.workDate} = ${workDate}`))
    .orderBy(asc(activities.eventTime));
}

export async function getActivitiesByDateRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activities)
    .where(sql`${activities.workDate} >= ${startDate} AND ${activities.workDate} <= ${endDate}`)
    .orderBy(desc(activities.eventTime));
}

export async function getCheckInsForDateRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activities)
    .where(and(
      eq(activities.eventType, "CHECK_IN"),
      sql`${activities.workDate} >= ${startDate} AND ${activities.workDate} <= ${endDate}`
    ))
    .orderBy(desc(activities.eventTime));
}

export async function getDashboardOverview(startDate: string, endDate: string, userId?: number, brand?: string, region?: string) {
  const db = await getDb();
  if (!db) return { totalVisits: 0, successVisits: 0, totalDistanceKm: 0, activeRiders: 0 };

  const conditions = [
    eq(activities.eventType, "CHECK_IN"),
    sql`${activities.workDate} >= ${startDate} AND ${activities.workDate} <= ${endDate}`,
  ];
  if (userId) conditions.push(eq(activities.userId, userId));
  if (brand) conditions.push(sql`${activities.brand} = ${brand}`);

  const checkIns = await db.select({
    totalVisits: count(),
    successVisits: sql<number>`SUM(CASE WHEN visitStatus = 'SUCCESS' THEN 1 ELSE 0 END)`,
    totalDistanceKm: sql<number>`COALESCE(SUM(legDistanceKm), 0)`,
  }).from(activities)
    .where(and(...conditions));

  const riders = await db.select({
    count: sql<number>`COUNT(DISTINCT userId)`,
  }).from(activities)
    .where(sql`${activities.workDate} >= ${startDate} AND ${activities.workDate} <= ${endDate}`);

  return {
    totalVisits: checkIns[0]?.totalVisits ?? 0,
    successVisits: checkIns[0]?.successVisits ?? 0,
    totalDistanceKm: checkIns[0]?.totalDistanceKm ?? 0,
    activeRiders: riders[0]?.count ?? 0,
  };
}

export async function getLeaderboard(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    userId: activities.userId,
    totalVisits: count(),
    successVisits: sql<number>`SUM(CASE WHEN visitStatus = 'SUCCESS' THEN 1 ELSE 0 END)`,
    totalDistanceKm: sql<number>`COALESCE(SUM(legDistanceKm), 0)`,
  }).from(activities)
    .where(and(
      eq(activities.eventType, "CHECK_IN"),
      sql`${activities.workDate} >= ${startDate} AND ${activities.workDate} <= ${endDate}`
    ))
    .groupBy(activities.userId)
    .orderBy(desc(sql`SUM(CASE WHEN visitStatus = 'SUCCESS' THEN 1 ELSE 0 END)`));

  return result;
}

export async function getDailyTimeseries(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    date: activities.workDate,
    totalVisits: count(),
    successVisits: sql<number>`SUM(CASE WHEN visitStatus = 'SUCCESS' THEN 1 ELSE 0 END)`,
    totalDistanceKm: sql<number>`COALESCE(SUM(legDistanceKm), 0)`,
  }).from(activities)
    .where(and(
      eq(activities.eventType, "CHECK_IN"),
      sql`${activities.workDate} >= ${startDate} AND ${activities.workDate} <= ${endDate}`
    ))
    .groupBy(activities.workDate)
    .orderBy(asc(activities.workDate));
}

export async function getActivityFeed(startDate: string, endDate: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(activities)
    .where(sql`${activities.workDate} >= ${startDate} AND ${activities.workDate} <= ${endDate}`)
    .orderBy(desc(activities.eventTime))
    .limit(limit);
}

export async function updateActivityDistance(activityId: number, data: {
  prevLat: number;
  prevLng: number;
  legDistanceKm: number;
  legDurationMin: number;
  calcStatus: "DONE" | "ERROR";
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(activities).set({
    ...data,
    processedAt: new Date(),
  }).where(eq(activities.id, activityId));
}
