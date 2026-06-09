import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, MapPin, BarChart3, Users, Lock } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: async () => {
      setError(null);
      await utils.auth.me.invalidate();
    },
    onError: err => {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const role = user.role;
      if (role === "admin" || role === "manager") {
        setLocation("/dashboard");
      } else {
        setLocation("/m");
      }
    }
  }, [loading, isAuthenticated, user, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">กำลังเปลี่ยนหน้า...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">YourFin Rider</h1>
          <p className="text-muted-foreground text-sm">
            ระบบติดตาม KPI ทีมเซลล์ไรเดอร์
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <div className="w-10 h-10 mx-auto rounded-lg bg-green-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">GPS Tracking</p>
              </div>
              <div className="space-y-1">
                <div className="w-10 h-10 mx-auto rounded-lg bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground">KPI Dashboard</p>
              </div>
              <div className="space-y-1">
                <div className="w-10 h-10 mx-auto rounded-lg bg-purple-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs text-muted-foreground">Team Mgmt</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">ชื่อผู้ใช้</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="กรอกชื่อผู้ใช้"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loginMutation.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive text-center">{error}</p>
              ) : null}

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    เข้าสู่ระบบ
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">หรือ</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              เข้าสู่ระบบด้วย Manus
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          YourFin &copy; 2026 — ระบบบริหารทีมขายภาคสนาม
        </p>
      </div>
    </div>
  );
}
