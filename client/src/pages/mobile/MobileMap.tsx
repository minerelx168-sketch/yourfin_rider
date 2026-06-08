import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import MobileLayout from "@/components/MobileLayout";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useCallback, useState } from "react";
import { MapView } from "@/components/Map";

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "#22c55e",
  PENDING: "#9ca3af",
  REJECTED: "#f97316",
};

const STATUS_LABELS: Record<string, string> = {
  SUCCESS: "สำเร็จ",
  PENDING: "รอ",
  REJECTED: "ปฏิเสธ",
};

export default function MobileMap() {
  const { loading, isAuthenticated } = useAuth();
  const [mapReady, setMapReady] = useState(false);

  const { data: activities } = trpc.activity.todaySummary.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const checkIns = activities?.activities?.filter(a => a.eventType === "CHECK_IN") ?? [];

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setMapReady(true);

    // Center on Bangkok if no data
    if (checkIns.length === 0) {
      map.setCenter({ lat: 13.7563, lng: 100.5018 });
      map.setZoom(11);
      return;
    }

    // Add markers for each check-in
    const bounds = new google.maps.LatLngBounds();

    checkIns.forEach((activity) => {
      const position = { lat: activity.lat, lng: activity.lng };
      bounds.extend(position);

      const color = STATUS_COLORS[activity.visitStatus || "PENDING"];
      const label = STATUS_LABELS[activity.visitStatus || "PENDING"];

      const marker = new google.maps.Marker({
        position,
        map,
        title: activity.storeName || "ร้านค้า",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 10,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding:4px;min-width:120px;">
            <strong>${activity.storeName || "ร้านค้า"}</strong><br/>
            <span style="color:${color};font-weight:600;">${label}</span><br/>
            <small>${new Date(activity.eventTime).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</small>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });

    if (checkIns.length > 0) {
      map.fitBounds(bounds);
      if (checkIns.length === 1) {
        map.setZoom(15);
      }
    }
  }, [checkIns]);

  if (loading) {
    return (
      <MobileLayout title="แผนที่">
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
    <MobileLayout title="แผนที่วันนี้">
      <div className="relative h-[calc(100vh-8rem)]">
        {/* Legend */}
        <div className="absolute top-3 left-3 z-10 bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-md border">
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>สำเร็จ</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>รอ</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>ปฏิเสธ</span>
            </div>
          </div>
        </div>

        <MapView onMapReady={handleMapReady} />
      </div>
    </MobileLayout>
  );
}
