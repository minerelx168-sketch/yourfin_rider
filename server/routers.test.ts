import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(role: "sales" | "manager" | "admin" = "sales"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-001",
      email: "test@yourfin.co",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("appRouter structure", () => {
  it("has all expected router keys", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    // Check top-level routers exist
    expect(routerKeys).toContain("auth.me");
    expect(routerKeys).toContain("auth.logout");
    expect(routerKeys).toContain("activity.clockIn");
    expect(routerKeys).toContain("activity.clockOut");
    expect(routerKeys).toContain("activity.checkIn");
    expect(routerKeys).toContain("activity.todaySummary");
    expect(routerKeys).toContain("activity.myActivities");
    expect(routerKeys).toContain("store.list");
    expect(routerKeys).toContain("store.getById");
    expect(routerKeys).toContain("store.create");
    expect(routerKeys).toContain("upload.photo");
    expect(routerKeys).toContain("dashboard.overview");
    expect(routerKeys).toContain("dashboard.leaderboard");
    expect(routerKeys).toContain("dashboard.timeseries");
    expect(routerKeys).toContain("dashboard.feed");
    expect(routerKeys).toContain("dashboard.mapData");
    expect(routerKeys).toContain("dashboard.users");
    // Username/password auth + account management
    expect(routerKeys).toContain("auth.loginWithPassword");
    expect(routerKeys).toContain("users.list");
    expect(routerKeys).toContain("users.create");
    expect(routerKeys).toContain("users.resetPassword");
    expect(routerKeys).toContain("users.setActive");
  });
});

describe("user management procedures", () => {
  it("users.list rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.users.list()).rejects.toThrow();
  });

  it("users.list rejects sales role", async () => {
    const caller = appRouter.createCaller(createAuthContext("sales"));
    await expect(caller.users.list()).rejects.toThrow();
  });

  it("users.create rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.users.create({ username: "newuser", password: "secret123", name: "New" })
    ).rejects.toThrow();
  });

  it("users.create forbids a manager from creating an admin", async () => {
    const caller = appRouter.createCaller(createAuthContext("manager"));
    await expect(
      caller.users.create({ username: "newadmin", password: "secret123", name: "X", role: "admin" })
    ).rejects.toThrow(/พนักงานขาย/);
  });
});

describe("auth.loginWithPassword", () => {
  it("validates that username and password are provided", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.auth.loginWithPassword({ username: "", password: "" })
    ).rejects.toThrow();
  });
});

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.openId).toBe("test-user-001");
    expect(result?.role).toBe("sales");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("protected procedures", () => {
  it("activity.clockIn rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activity.clockIn({ lat: 13.75, lng: 100.50 })
    ).rejects.toThrow();
  });

  it("activity.checkIn rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activity.checkIn({
        lat: 13.75,
        lng: 100.50,
        storeName: "Test Store",
        brand: "SAMSUNG",
        visitStatus: "SUCCESS",
      })
    ).rejects.toThrow();
  });

  it("dashboard.overview rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.dashboard.overview({ startDate: "2026-01-01", endDate: "2026-01-07" })
    ).rejects.toThrow();
  });
});

describe("input validation", () => {
  it("activity.checkIn validates brand enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activity.checkIn({
        lat: 13.75,
        lng: 100.50,
        storeName: "Test",
        brand: "INVALID_BRAND" as any,
        visitStatus: "SUCCESS",
      })
    ).rejects.toThrow();
  });

  it("activity.checkIn validates visitStatus enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activity.checkIn({
        lat: 13.75,
        lng: 100.50,
        storeName: "Test",
        brand: "SAMSUNG",
        visitStatus: "INVALID" as any,
      })
    ).rejects.toThrow();
  });
});
