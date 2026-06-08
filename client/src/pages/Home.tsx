import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, BarChart3, Users } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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
          <CardContent className="pt-6 space-y-4">
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

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              เข้าสู่ระบบ
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
