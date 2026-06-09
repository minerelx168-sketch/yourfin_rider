import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, managerProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { sdk } from "./_core/sdk";
import { hashPassword, verifyPassword } from "./_core/password";
import {
  createActivity,
  createStore,
  getLastActivityForUser,
  getUserActivitiesForDate,
  getAllStores,
  getStoreById,
  getDashboardOverview,
  getLeaderboard,
  getDailyTimeseries,
  getActivityFeed,
  getCheckInsForDateRange,
  updateActivityDistance,
  getAllSalesUsers,
  getAllUsers,
  getUserById,
  getUserByUsername,
  createLocalUser,
  updateUserPassword,
  setUserActive,
  touchLastSignedIn,
} from "./db";
import { storagePut } from "./storage";
import { format } from "date-fns";

/** Strip sensitive fields (passwordHash) before returning a user to the client. */
function sanitizeUser<T extends { passwordHash?: string | null }>(user: T): Omit<T, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  return rest;
}

// ── Haversine distance calculation ──────────────────────────
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Helper: get today's date in Bangkok timezone ────────────
function getTodayBangkok(): string {
  const now = new Date();
  const bangkokOffset = 7 * 60; // UTC+7
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const bangkokDate = new Date(utcMs + bangkokOffset * 60000);
  return format(bangkokDate, "yyyy-MM-dd");
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => (opts.ctx.user ? sanitizeUser(opts.ctx.user) : null)),

    // Login with username/password (accounts provisioned by admin/manager — no OAuth)
    loginWithPassword: publicProcedure
      .input(z.object({
        username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
        password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
      }))
      .mutation(async ({ ctx, input }) => {
        const username = input.username.toLowerCase().trim();
        const invalid = new TRPCError({
          code: "UNAUTHORIZED",
          message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        });

        const user = await getUserByUsername(username);
        if (!user) throw invalid;

        const ok = await verifyPassword(input.password, user.passwordHash);
        if (!ok) throw invalid;

        if (!user.active) {
          throw new TRPCError({ code: "FORBIDDEN", message: "บัญชีนี้ถูกระงับการใช้งาน" });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || username,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        await touchLastSignedIn(user.id);
        return sanitizeUser(user);
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── User account management (ADMIN/MANAGER) ─────────────────
  // Admins can manage any role. Managers can manage only "sales" accounts.
  users: router({
    list: managerProcedure.query(async () => {
      const all = await getAllUsers();
      return all.map(sanitizeUser);
    }),

    create: managerProcedure
      .input(z.object({
        username: z.string().min(3, "อย่างน้อย 3 ตัวอักษร").max(64)
          .regex(/^[a-zA-Z0-9_.-]+$/, "ใช้ได้เฉพาะ a-z A-Z 0-9 _ . -"),
        password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร").max(128),
        name: z.string().min(1, "กรุณากรอกชื่อ").max(255),
        role: z.enum(["sales", "manager", "admin"]).default("sales"),
        phone: z.string().max(20).optional(),
        team: z.string().max(100).optional(),
        region: z.string().max(100).optional(),
        targetDailyClose: z.number().int().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && input.role !== "sales") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "ผู้จัดการสร้างได้เฉพาะบัญชีพนักงานขาย (sales) เท่านั้น",
          });
        }

        const username = input.username.toLowerCase().trim();
        const existing = await getUserByUsername(username);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" });
        }

        const passwordHash = await hashPassword(input.password);
        const openId = `local_${nanoid()}`;
        const { id } = await createLocalUser({
          openId,
          username,
          passwordHash,
          name: input.name,
          role: input.role,
          phone: input.phone,
          team: input.team,
          region: input.region,
          targetDailyClose: input.targetDailyClose,
        });

        const created = await getUserById(id);
        return created
          ? sanitizeUser(created)
          : { id, username, name: input.name, role: input.role };
      }),

    resetPassword: managerProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร").max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const target = await getUserById(input.userId);
        if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบผู้ใช้" });
        if (ctx.user.role !== "admin" && target.role !== "sales") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "ผู้จัดการรีเซ็ตรหัสได้เฉพาะบัญชีพนักงานขาย",
          });
        }
        await updateUserPassword(input.userId, await hashPassword(input.newPassword));
        return { success: true } as const;
      }),

    setActive: managerProcedure
      .input(z.object({ userId: z.number(), active: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const target = await getUserById(input.userId);
        if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบผู้ใช้" });
        if (target.id === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่สามารถระงับบัญชีตัวเองได้" });
        }
        if (ctx.user.role !== "admin" && target.role !== "sales") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "ผู้จัดการจัดการได้เฉพาะบัญชีพนักงานขาย",
          });
        }
        await setUserActive(input.userId, input.active);
        return { success: true } as const;
      }),
  }),

  // ── Activity procedures ─────────────────────────────────────
  activity: router({
    clockIn: protectedProcedure
      .input(z.object({ lat: z.number(), lng: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const workDate = getTodayBangkok();
        const activity = await createActivity({
          userId: ctx.user.id,
          eventType: "CLOCK_IN",
          eventTime: new Date(),
          workDate: workDate as any,
          lat: input.lat,
          lng: input.lng,
          calcStatus: "SKIP",
        });
        return { success: true, activityId: activity.id, workDate };
      }),

    clockOut: protectedProcedure
      .input(z.object({ lat: z.number(), lng: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const workDate = getTodayBangkok();
        const lastActivity = await getLastActivityForUser(ctx.user.id, workDate);

        let legDistanceKm = 0;
        let legDurationMin = 0;
        let prevLat: number | undefined;
        let prevLng: number | undefined;
        let calcStatus: "DONE" | "SKIP" = "SKIP";

        if (lastActivity) {
          prevLat = lastActivity.lat;
          prevLng = lastActivity.lng;
          legDistanceKm = haversineDistance(prevLat, prevLng, input.lat, input.lng);
          legDurationMin = legDistanceKm * 2; // rough estimate
          calcStatus = "DONE";
        }

        const activity = await createActivity({
          userId: ctx.user.id,
          eventType: "CLOCK_OUT",
          eventTime: new Date(),
          workDate: workDate as any,
          lat: input.lat,
          lng: input.lng,
          prevLat,
          prevLng,
          legDistanceKm,
          legDurationMin,
          calcStatus,
        });
        return { success: true, activityId: activity.id };
      }),

    checkIn: protectedProcedure
      .input(z.object({
        lat: z.number(),
        lng: z.number(),
        storeName: z.string().min(1),
        brand: z.enum(["SAMSUNG", "VIVO", "OPPO", "XIAOMI", "REALME", "APPLE", "OTHER"]),
        visitStatus: z.enum(["SUCCESS", "PENDING", "REJECTED"]),
        storeId: z.number().optional(),
        photoUrl: z.string().optional(),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const workDate = getTodayBangkok();
        const lastActivity = await getLastActivityForUser(ctx.user.id, workDate);

        let legDistanceKm = 0;
        let legDurationMin = 0;
        let prevLat: number | undefined;
        let prevLng: number | undefined;
        let calcStatus: "DONE" | "SKIP" = "SKIP";

        if (lastActivity) {
          prevLat = lastActivity.lat;
          prevLng = lastActivity.lng;
          legDistanceKm = haversineDistance(prevLat, prevLng, input.lat, input.lng);
          legDurationMin = legDistanceKm * 2;
          calcStatus = "DONE";
        }

        const activity = await createActivity({
          userId: ctx.user.id,
          eventType: "CHECK_IN",
          eventTime: new Date(),
          workDate: workDate as any,
          lat: input.lat,
          lng: input.lng,
          storeId: input.storeId,
          storeName: input.storeName,
          brand: input.brand,
          visitStatus: input.visitStatus,
          photoUrl: input.photoUrl,
          note: input.note,
          prevLat,
          prevLng,
          legDistanceKm,
          legDurationMin,
          calcStatus,
        });
        return { success: true, activityId: activity.id, legDistanceKm };
      }),

    todaySummary: protectedProcedure.query(async ({ ctx }) => {
      const workDate = getTodayBangkok();
      const todayActivities = await getUserActivitiesForDate(ctx.user.id, workDate);

      const checkIns = todayActivities.filter(a => a.eventType === "CHECK_IN");
      const clockIn = todayActivities.find(a => a.eventType === "CLOCK_IN");
      const clockOut = todayActivities.find(a => a.eventType === "CLOCK_OUT");
      const totalDistance = todayActivities.reduce((sum, a) => sum + (a.legDistanceKm ?? 0), 0);
      const successCount = checkIns.filter(a => a.visitStatus === "SUCCESS").length;

      return {
        workDate,
        isClockedIn: !!clockIn && !clockOut,
        clockInTime: clockIn?.eventTime ?? null,
        clockOutTime: clockOut?.eventTime ?? null,
        totalVisits: checkIns.length,
        successVisits: successCount,
        conversionRate: checkIns.length > 0 ? (successCount / checkIns.length) * 100 : 0,
        totalDistanceKm: Math.round(totalDistance * 10) / 10,
        activities: todayActivities,
      };
    }),

    myActivities: protectedProcedure
      .input(z.object({ workDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const workDate = input.workDate || getTodayBangkok();
        return getUserActivitiesForDate(ctx.user.id, workDate);
      }),
  }),

  // ── Store procedures ────────────────────────────────────────
  store: router({
    list: protectedProcedure.query(async () => {
      return getAllStores();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getStoreById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        brand: z.enum(["SAMSUNG", "VIVO", "OPPO", "XIAOMI", "REALME", "APPLE", "OTHER"]),
        province: z.string().optional(),
        district: z.string().optional(),
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        ownerName: z.string().optional(),
        ownerContact: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const store = await createStore({
          ...input,
          createdById: ctx.user.id,
        });
        return { success: true, storeId: store.id };
      }),
  }),

  // ── Upload procedures ───────────────────────────────────────
  upload: router({
    photo: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        base64Data: z.string(),
        contentType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64Data, "base64");
        const key = `photos/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { success: true, url };
      }),
  }),

  // ── Dashboard procedures (MANAGER/ADMIN only) ──────────────
  dashboard: router({
    overview: managerProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        userId: z.number().optional(),
        brand: z.string().optional(),
        region: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getDashboardOverview(input.startDate, input.endDate, input.userId, input.brand, input.region);
      }),

    leaderboard: managerProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        userId: z.number().optional(),
        brand: z.string().optional(),
        region: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const leaderboard = await getLeaderboard(input.startDate, input.endDate);
        const allUsers = await getAllUsers();
        const userMap = new Map(allUsers.map(u => [u.id, u]));

        let filtered = leaderboard.map(entry => ({
          ...entry,
          userName: userMap.get(entry.userId)?.name ?? "Unknown",
          userTeam: userMap.get(entry.userId)?.team ?? "",
          userRegion: userMap.get(entry.userId)?.region ?? "",
          conversionRate: entry.totalVisits > 0
            ? Math.round((entry.successVisits / entry.totalVisits) * 100)
            : 0,
        }));

        if (input.userId) {
          filtered = filtered.filter(e => e.userId === input.userId);
        }
        if (input.region) {
          filtered = filtered.filter(e => e.userRegion === input.region);
        }
        return filtered;
      }),

    timeseries: managerProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        userId: z.number().optional(),
        brand: z.string().optional(),
        region: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getDailyTimeseries(input.startDate, input.endDate);
      }),

    feed: managerProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        limit: z.number().default(50),
        userId: z.number().optional(),
        brand: z.string().optional(),
        region: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const feed = await getActivityFeed(input.startDate, input.endDate, input.limit);
        const allUsers = await getAllUsers();
        const userMap = new Map(allUsers.map(u => [u.id, u]));

        let result = feed.map(entry => ({
          ...entry,
          userName: userMap.get(entry.userId)?.name ?? "Unknown",
          userRegion: userMap.get(entry.userId)?.region ?? "",
        }));

        if (input.userId) {
          result = result.filter(e => e.userId === input.userId);
        }
        if (input.brand) {
          result = result.filter(e => e.brand === input.brand);
        }
        if (input.region) {
          result = result.filter(e => e.userRegion === input.region);
        }
        return result;
      }),

    mapData: managerProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        userId: z.number().optional(),
        brand: z.string().optional(),
        region: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const checkIns = await getCheckInsForDateRange(input.startDate, input.endDate);
        const allUsers = await getAllUsers();
        const userMap = new Map(allUsers.map(u => [u.id, u]));

        let result = checkIns.map(entry => ({
          id: entry.id,
          lat: entry.lat,
          lng: entry.lng,
          storeName: entry.storeName,
          brand: entry.brand,
          visitStatus: entry.visitStatus,
          userName: userMap.get(entry.userId)?.name ?? "Unknown",
          userRegion: userMap.get(entry.userId)?.region ?? "",
          eventTime: entry.eventTime,
          userId: entry.userId,
        }));

        if (input.userId) {
          result = result.filter(e => e.userId === input.userId);
        }
        if (input.brand) {
          result = result.filter(e => e.brand === input.brand);
        }
        if (input.region) {
          result = result.filter(e => e.userRegion === input.region);
        }
        return result;
      }),

    users: managerProcedure.query(async () => {
      const salesUsers = await getAllSalesUsers();
      return salesUsers.map(sanitizeUser);
    }),
  }),
});

export type AppRouter = typeof appRouter;
