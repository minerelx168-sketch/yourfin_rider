import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Clock, LogIn, LogOut, RefreshCw } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BRANDS = ["ALL", "SAMSUNG", "VIVO", "OPPO", "XIAOMI", "REALME", "APPLE", "OTHER"] as const;

export default function DashboardFeed() {
  const { loading, isAuthenticated } = useAuth();
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedUser, setSelectedUser] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");

  const { data: salesUsers } = trpc.dashboard.users.useQuery(undefined, { enabled: isAuthenticated });

  const regions = useMemo(() => {
    if (!salesUsers) return [];
    const regionSet = new Set(salesUsers.map(u => u.region).filter(Boolean));
    return Array.from(regionSet) as string[];
  }, [salesUsers]);

  const queryInput = useMemo(() => ({
    startDate,
    endDate,
    limit: 100,
    ...(selectedUser !== "ALL" ? { userId: Number(selectedUser) } : {}),
    ...(selectedBrand !== "ALL" ? { brand: selectedBrand } : {}),
    ...(selectedRegion !== "ALL" ? { region: selectedRegion } : {}),
  }), [startDate, endDate, selectedUser, selectedBrand, selectedRegion]);

  const { data: feed, isLoading, dataUpdatedAt } = trpc.dashboard.feed.useQuery(
    queryInput,
    {
      enabled: isAuthenticated,
      refetchInterval: 60000, // Auto-refresh every 60 seconds
    }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "CLOCK_IN": return <LogIn className="w-4 h-4 text-green-600" />;
      case "CLOCK_OUT": return <LogOut className="w-4 h-4 text-red-600" />;
      case "CHECK_IN": return <MapPin className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case "CLOCK_IN": return "เข้างาน";
      case "CLOCK_OUT": return "เลิกงาน";
      case "CHECK_IN": return "เช็คอินร้าน";
      default: return eventType;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">สำเร็จ</Badge>;
      case "PENDING":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">รอ</Badge>;
      case "REJECTED":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">ปฏิเสธ</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Activity Feed</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-3 h-3" />
                <span>Auto-refresh ทุก 60 วินาที</span>
                {dataUpdatedAt && (
                  <span>· อัปเดตล่าสุด {new Date(dataUpdatedAt).toLocaleTimeString("th-TH")}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                <Label className="text-xs">จาก</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-sm w-36"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ถึง</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-sm w-36"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">เซลล์</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="h-8 w-40 text-sm">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  {salesUsers?.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name ?? `User #${u.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">แบรนด์</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map(b => (
                    <SelectItem key={b} value={b}>{b === "ALL" ? "ทั้งหมด" : b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">พื้นที่</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Feed */}
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="divide-y">
                {feed?.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5">
                      {getEventIcon(item.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{item.userName}</span>
                        <span className="text-sm text-muted-foreground">{getEventLabel(item.eventType)}</span>
                        {item.storeName && (
                          <span className="text-sm font-medium text-foreground">@ {item.storeName}</span>
                        )}
                        {getStatusBadge(item.visitStatus)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(item.eventTime).toLocaleString("th-TH")}</span>
                        {item.brand && <span>· {item.brand}</span>}
                        {item.legDistanceKm && item.legDistanceKm > 0 && (
                          <span>· {item.legDistanceKm.toFixed(1)} กม.</span>
                        )}
                      </div>
                      {item.note && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{item.note}"</p>
                      )}
                    </div>
                  </div>
                ))}
                {(!feed || feed.length === 0) && (
                  <div className="text-center text-muted-foreground py-12">
                    ไม่มีกิจกรรมในช่วงเวลาที่เลือก
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
