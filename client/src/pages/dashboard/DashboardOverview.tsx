import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Route, TrendingUp, Users } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BRANDS = ["ALL", "SAMSUNG", "VIVO", "OPPO", "XIAOMI", "REALME", "APPLE", "OTHER"] as const;

export default function DashboardOverview() {
  const { user, loading, isAuthenticated } = useAuth();
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedUser, setSelectedUser] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");

  const { data: salesUsers } = trpc.dashboard.users.useQuery(undefined, { enabled: isAuthenticated });

  const queryInput = useMemo(() => ({
    startDate,
    endDate,
    ...(selectedUser !== "ALL" ? { userId: Number(selectedUser) } : {}),
    ...(selectedBrand !== "ALL" ? { brand: selectedBrand } : {}),
    ...(selectedRegion !== "ALL" ? { region: selectedRegion } : {}),
  }), [startDate, endDate, selectedUser, selectedBrand, selectedRegion]);

  const { data: overview, isLoading: overviewLoading } = trpc.dashboard.overview.useQuery(
    queryInput,
    { enabled: isAuthenticated }
  );

  const { data: timeseries, isLoading: timeseriesLoading } = trpc.dashboard.timeseries.useQuery(
    queryInput,
    { enabled: isAuthenticated }
  );

  // Get unique regions from sales users - MUST be before conditional returns
  const regions = useMemo(() => {
    if (!salesUsers) return [];
    const regionSet = new Set(salesUsers.map(u => u.region).filter(Boolean));
    return Array.from(regionSet) as string[];
  }, [salesUsers]);

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

  const conversionRate = overview && overview.totalVisits > 0
    ? Math.round((overview.successVisits / overview.totalVisits) * 100)
    : 0;

  const chartData = timeseries?.map(d => ({
    date: format(new Date(d.date), "dd/MM"),
    visits: d.totalVisits,
    success: d.successVisits,
    distance: Math.round(d.totalDistanceKm * 10) / 10,
  })) ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard ภาพรวม</h1>
              <p className="text-sm text-muted-foreground">ติดตาม KPI ทีมเซลล์ไรเดอร์</p>
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

          {/* Filters Row */}
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

        {/* Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">เข้าพบร้านทั้งหมด</p>
                  <p className="text-2xl font-bold text-foreground">
                    {overviewLoading ? "..." : overview?.totalVisits ?? 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {overviewLoading ? "..." : `${conversionRate}%`}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ระยะทางรวม (กม.)</p>
                  <p className="text-2xl font-bold text-foreground">
                    {overviewLoading ? "..." : Math.round(overview?.totalDistanceKm ?? 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Route className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ไรเดอร์ที่ทำงาน</p>
                  <p className="text-2xl font-bold text-foreground">
                    {overviewLoading ? "..." : overview?.activeRiders ?? 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visits Chart */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">จำนวนเข้าพบร้านรายวัน</CardTitle>
            </CardHeader>
            <CardContent>
              {timeseriesLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visits" name="เข้าพบ" fill="hsl(220, 70%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="success" name="สำเร็จ" fill="hsl(145, 60%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Distance Chart */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ระยะทางรายวัน (กม.)</CardTitle>
            </CardHeader>
            <CardContent>
              {timeseriesLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="distance"
                      name="ระยะทาง"
                      stroke="hsl(270, 60%, 55%)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
