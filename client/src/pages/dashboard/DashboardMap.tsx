import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useMemo, useCallback } from "react";
import { format, subDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapView } from "@/components/Map";

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "#22c55e",
  PENDING: "#9ca3af",
  REJECTED: "#f97316",
};

const BRANDS = ["ALL", "SAMSUNG", "VIVO", "OPPO", "XIAOMI", "REALME", "APPLE", "OTHER"] as const;

export default function DashboardMap() {
  const { loading, isAuthenticated } = useAuth();
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 7), "yyyy-MM-dd"));
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
    ...(selectedUser !== "ALL" ? { userId: Number(selectedUser) } : {}),
    ...(selectedBrand !== "ALL" ? { brand: selectedBrand } : {}),
    ...(selectedRegion !== "ALL" ? { region: selectedRegion } : {}),
  }), [startDate, endDate, selectedUser, selectedBrand, selectedRegion]);

  const { data: mapData, isLoading } = trpc.dashboard.mapData.useQuery(
    queryInput,
    { enabled: isAuthenticated }
  );

  const handleMapReady = useCallback((map: google.maps.Map) => {
    if (!mapData || mapData.length === 0) {
      map.setCenter({ lat: 13.7563, lng: 100.5018 });
      map.setZoom(7);
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    mapData.forEach((pin) => {
      const position = { lat: pin.lat, lng: pin.lng };
      bounds.extend(position);

      const color = STATUS_COLORS[pin.visitStatus || "PENDING"];

      const marker = new google.maps.Marker({
        position,
        map,
        title: pin.storeName || "ร้านค้า",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 8,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding:4px;min-width:150px;">
            <strong>${pin.storeName || "ร้านค้า"}</strong><br/>
            <span>แบรนด์: ${pin.brand || "-"}</span><br/>
            <span>เซลล์: ${pin.userName}</span><br/>
            <span style="color:${color};font-weight:600;">
              ${pin.visitStatus === "SUCCESS" ? "สำเร็จ" : pin.visitStatus === "PENDING" ? "รอ" : "ปฏิเสธ"}
            </span><br/>
            <small>${new Date(pin.eventTime).toLocaleString("th-TH")}</small>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });

    map.fitBounds(bounds);
  }, [mapData]);

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
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Coverage Map</h1>
              <p className="text-sm text-muted-foreground">แผนที่แสดงจุดเข้าพบร้านค้า</p>
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

          {/* Legend */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>สำเร็จ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>รอ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>ปฏิเสธ</span>
            </div>
          </div>
        </div>

        {/* Map */}
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[600px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <MapView onMapReady={handleMapReady} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
