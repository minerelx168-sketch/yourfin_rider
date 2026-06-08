import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, Medal } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BRANDS = ["ALL", "SAMSUNG", "VIVO", "OPPO", "XIAOMI", "REALME", "APPLE", "OTHER"] as const;

export default function DashboardLeaderboard() {
  const { loading, isAuthenticated } = useAuth();
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

  const { data: leaderboard, isLoading } = trpc.dashboard.leaderboard.useQuery(
    queryInput,
    { enabled: isAuthenticated }
  );

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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">อันดับเซลล์ไรเดอร์ตามผลงาน</p>
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

        {/* Top 3 */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leaderboard.slice(0, 3).map((entry, idx) => (
              <Card key={entry.userId} className={`border shadow-sm ${idx === 0 ? "ring-2 ring-yellow-400" : ""}`}>
                <CardContent className="p-4 text-center">
                  <div className="mb-2">
                    {idx === 0 && <Trophy className="w-8 h-8 text-yellow-500 mx-auto" />}
                    {idx === 1 && <Medal className="w-8 h-8 text-gray-400 mx-auto" />}
                    {idx === 2 && <Medal className="w-8 h-8 text-amber-600 mx-auto" />}
                  </div>
                  <p className="font-bold text-foreground">{entry.userName}</p>
                  <p className="text-xs text-muted-foreground">{entry.userTeam}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-bold text-lg text-green-600">{entry.successVisits}</p>
                      <p className="text-muted-foreground">สำเร็จ</p>
                    </div>
                    <div>
                      <p className="font-bold text-lg text-primary">{entry.conversionRate}%</p>
                      <p className="text-muted-foreground">Conversion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Full Table */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">อันดับทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>ทีม</TableHead>
                    <TableHead className="text-right">เข้าพบ</TableHead>
                    <TableHead className="text-right">สำเร็จ</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                    <TableHead className="text-right">ระยะทาง (กม.)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard?.map((entry, idx) => (
                    <TableRow key={entry.userId}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{entry.userName}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.userTeam || "-"}</TableCell>
                      <TableCell className="text-right">{entry.totalVisits}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{entry.successVisits}</TableCell>
                      <TableCell className="text-right">{entry.conversionRate}%</TableCell>
                      <TableCell className="text-right">{Math.round(entry.totalDistanceKm)}</TableCell>
                    </TableRow>
                  ))}
                  {(!leaderboard || leaderboard.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        ไม่มีข้อมูลในช่วงเวลาที่เลือก
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
