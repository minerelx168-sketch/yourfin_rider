import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin, Route, TrendingUp, Clock, LogIn, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState, useCallback } from "react";
import { toast } from "sonner";

export default function MobileHome() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [gpsLoading, setGpsLoading] = useState(false);

  const { data: summary, isLoading: summaryLoading, refetch } = trpc.activity.todaySummary.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const clockInMutation = trpc.activity.clockIn.useMutation({
    onSuccess: () => {
      toast.success("Clock-in สำเร็จ!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const clockOutMutation = trpc.activity.clockOut.useMutation({
    onSuccess: () => {
      toast.success("Clock-out สำเร็จ!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const getGPSAndAction = useCallback((action: "clockIn" | "clockOut") => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (action === "clockIn") {
          clockInMutation.mutate({ lat, lng });
        } else {
          clockOutMutation.mutate({ lat, lng });
        }
        setGpsLoading(false);
      },
      (err) => {
        toast.error("ไม่สามารถจับพิกัด GPS ได้: " + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [clockInMutation, clockOutMutation]);

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <MobileLayout title="YourFin Rider">
      <div className="p-4 space-y-4">
        {/* Greeting */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            สวัสดี, {user?.name || "พนักงาน"} 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Clock In/Out Button */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-primary to-primary/80">
          <CardContent className="p-4">
            {summaryLoading ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary-foreground" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-primary-foreground">
                  <p className="text-sm opacity-90">
                    {summary?.isClockedIn ? "กำลังทำงาน" : "ยังไม่ได้เข้างาน"}
                  </p>
                  {summary?.clockInTime && (
                    <p className="text-xs opacity-75">
                      เข้างาน: {new Date(summary.clockInTime).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
                {!summary?.isClockedIn && !summary?.clockOutTime ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    className="font-semibold"
                    onClick={() => getGPSAndAction("clockIn")}
                    disabled={gpsLoading || clockInMutation.isPending}
                  >
                    {(gpsLoading || clockInMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <LogIn className="w-4 h-4 mr-2" />
                    )}
                    Clock In
                  </Button>
                ) : summary?.isClockedIn ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    className="font-semibold"
                    onClick={() => getGPSAndAction("clockOut")}
                    disabled={gpsLoading || clockOutMutation.isPending}
                  >
                    {(gpsLoading || clockOutMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <LogOut className="w-4 h-4 mr-2" />
                    )}
                    Clock Out
                  </Button>
                ) : (
                  <div className="text-primary-foreground text-sm opacity-75">
                    เลิกงานแล้ว ✓
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{summary?.totalVisits ?? 0}</p>
              <p className="text-xs text-muted-foreground">เข้าพบร้าน</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                <Route className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{summary?.totalDistanceKm ?? 0}</p>
              <p className="text-xs text-muted-foreground">กม. วันนี้</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{summary?.conversionRate?.toFixed(0) ?? 0}%</p>
              <p className="text-xs text-muted-foreground">Conversion</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{summary?.successVisits ?? 0}</p>
              <p className="text-xs text-muted-foreground">ปิดดีลสำเร็จ</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        {summary?.activities && summary.activities.length > 0 && (
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 text-foreground">กิจกรรมวันนี้</h3>
              <div className="space-y-3">
                {summary.activities.slice(-5).reverse().map((act) => (
                  <div key={act.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      act.eventType === "CLOCK_IN" ? "bg-green-500" :
                      act.eventType === "CLOCK_OUT" ? "bg-red-500" :
                      act.visitStatus === "SUCCESS" ? "bg-green-500" :
                      act.visitStatus === "PENDING" ? "bg-gray-400" : "bg-orange-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {act.eventType === "CLOCK_IN" ? "เข้างาน" :
                         act.eventType === "CLOCK_OUT" ? "เลิกงาน" :
                         act.storeName || "เช็คอินร้าน"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(act.eventTime).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        {act.legDistanceKm ? ` · ${act.legDistanceKm.toFixed(1)} กม.` : ""}
                      </p>
                    </div>
                    {act.visitStatus && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        act.visitStatus === "SUCCESS" ? "bg-green-100 text-green-700" :
                        act.visitStatus === "PENDING" ? "bg-gray-100 text-gray-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {act.visitStatus === "SUCCESS" ? "สำเร็จ" :
                         act.visitStatus === "PENDING" ? "รอ" : "ปฏิเสธ"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
