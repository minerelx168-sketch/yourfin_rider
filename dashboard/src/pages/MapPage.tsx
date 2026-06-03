import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from '../api/client';
import { useRange } from '../range/useRange';
import { usePolledData } from '../hooks/usePolledData';
import { useReportFreshness } from '../hooks/useReportFreshness';
import { PageHeader } from '../components/PageHeader';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlock';
import { StatusBadge } from '../components/StatusBadge';
import { brandLabel, formatDateTime } from '../lib/format';
import { STATUS_COLOR } from '../lib/status';
import type { MapPoint, VisitStatus } from '../types';
import './MapPage.css';

// Bangkok center per the brief.
const BANGKOK: [number, number] = [13.7563, 100.5018];
const NEUTRAL = '#64748b';

function colorFor(status: VisitStatus | null): string {
  return status ? STATUS_COLOR[status] : NEUTRAL;
}

export function MapPage() {
  const { range } = useRange();
  const { data, loading, refreshing, error, reload, lastUpdated } = usePolledData(
    () => api.getMapPoints(range),
    { deps: [range.from, range.to] },
  );
  useReportFreshness(lastUpdated);

  const points = data?.points ?? [];

  return (
    <div>
      <PageHeader title="แผนที่การออกตรวจ" refreshing={refreshing} />

      <div className="card map-card">
        {loading ? (
          <LoadingBlock label="กำลังโหลดแผนที่…" />
        ) : error && !data ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : (
          <div className="map-shell">
            <MapContainer
              center={BANGKOK}
              zoom={11}
              scrollWheelZoom
              className="map-leaflet"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {points.map((p) => (
                <CircleMarker
                  key={p.id}
                  center={[p.lat, p.lng]}
                  radius={8}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 1.5,
                    fillColor: colorFor(p.visitStatus),
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup>
                    <MarkerPopup point={p} />
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            <div className="map-legend">
              <div className="legend-title">สถานะการเยือน</div>
              <LegendRow color={STATUS_COLOR.SUCCESS} label="ปิดดีล (SUCCESS)" />
              <LegendRow color={STATUS_COLOR.PENDING} label="รอตัดสินใจ (PENDING)" />
              <LegendRow color={STATUS_COLOR.REJECTED} label="ปฏิเสธ (REJECTED)" />
              <LegendRow color={NEUTRAL} label="อื่นๆ (เข้า/ออกงาน)" />
              <div className="legend-count muted">{points.length} จุด</div>
            </div>

            {points.length === 0 && (
              <div className="map-empty-overlay">
                <EmptyBlock message="ไม่มีจุดเช็คอินในช่วงเวลาที่เลือก" icon="🗺️" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="legend-row">
      <span className="legend-dot" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function MarkerPopup({ point }: { point: MapPoint }) {
  return (
    <div className="map-popup">
      <strong className="popup-store">{point.storeName ?? 'ไม่ระบุร้าน'}</strong>
      <div className="popup-row">
        <span className="popup-key">เซลล์</span>
        <span>{point.riderName}</span>
      </div>
      <div className="popup-row">
        <span className="popup-key">แบรนด์</span>
        <span>{brandLabel(point.brand)}</span>
      </div>
      <div className="popup-row">
        <span className="popup-key">สถานะ</span>
        <StatusBadge status={point.visitStatus} />
      </div>
      <div className="popup-row">
        <span className="popup-key">เวลา</span>
        <span>{formatDateTime(point.eventTime)}</span>
      </div>
    </div>
  );
}
