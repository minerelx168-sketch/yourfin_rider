import { useCallback } from 'react';
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as api from '../api/client';
import { useRange } from '../range/useRange';
import { usePolledData } from '../hooks/usePolledData';
import { useReportFreshness } from '../hooks/useReportFreshness';
import { PageHeader } from '../components/PageHeader';
import { Scorecard } from '../components/Scorecard';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlock';
import {
  brandLabel,
  formatKm,
  formatNumber,
  formatPercent,
  shortDateLabel,
} from '../lib/format';
import { BRAND_PALETTE } from '../lib/status';
import './OverviewPage.css';

export function OverviewPage() {
  const { range } = useRange();

  const overview = usePolledData(() => api.getOverview(range), {
    deps: [range.from, range.to],
  });
  const timeseries = usePolledData(() => api.getTimeseries(range), {
    deps: [range.from, range.to],
  });

  useReportFreshness(overview.lastUpdated);

  const refreshing = overview.refreshing || timeseries.refreshing;

  return (
    <div>
      <PageHeader title="ภาพรวมผลงาน" refreshing={refreshing} />

      {overview.loading ? (
        <div className="card">
          <LoadingBlock />
        </div>
      ) : overview.error && !overview.data ? (
        <div className="card">
          <ErrorBlock message={overview.error} onRetry={overview.reload} />
        </div>
      ) : overview.data ? (
        <Scorecards data={overview.data} />
      ) : null}

      <div className="overview-charts">
        <BrandChart
          data={overview.data?.brandBreakdown ?? []}
          loading={overview.loading}
          error={overview.data ? null : overview.error}
        />
        <TrendChart
          series={timeseries.data?.series ?? []}
          loading={timeseries.loading}
          error={timeseries.data ? null : timeseries.error}
          onRetry={timeseries.reload}
        />
      </div>
    </div>
  );
}

function Scorecards({ data }: { data: import('../types').Overview }) {
  return (
    <div className="scorecards">
      <Scorecard
        label="เช็คอินทั้งหมด"
        value={formatNumber(data.totalCheckins)}
        icon="📍"
        accent="#2563eb"
      />
      <Scorecard
        label="ปิดดีล (สำเร็จ)"
        value={formatNumber(data.success)}
        icon="✅"
        accent="#16a34a"
        sub={`รอตัดสินใจ ${formatNumber(data.pending)} · ปฏิเสธ ${formatNumber(
          data.rejected,
        )}`}
      />
      <Scorecard
        label="Conversion"
        value={formatPercent(data.conversionRate)}
        icon="🎯"
        accent="#7c3aed"
      />
      <Scorecard
        label="ระยะทางรวม"
        value={formatKm(data.totalDistanceKm)}
        unit="กม."
        icon="🛣️"
        accent="#ea580c"
      />
      <Scorecard
        label="เซลล์ที่ออกตรวจ"
        value={formatNumber(data.activeRiders)}
        unit="คน"
        icon="🏍️"
        accent="#0891b2"
      />
      <Scorecard
        label="ร้านที่เยือน"
        value={formatNumber(data.storesVisited)}
        unit="ร้าน"
        icon="🏪"
        accent="#db2777"
      />
    </div>
  );
}

interface BrandDatum {
  brand: import('../types').Brand;
  count: number;
}

function BrandChart({
  data,
  loading,
  error,
}: {
  data: BrandDatum[];
  loading: boolean;
  error: string | null;
}) {
  const chartData = data.map((d) => ({ name: brandLabel(d.brand), count: d.count }));
  return (
    <div className="card card-pad chart-card">
      <h3 className="card-title">สัดส่วนตามแบรนด์</h3>
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} />
      ) : chartData.length === 0 ? (
        <EmptyBlock />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={55}
              paddingAngle={2}
              label={(entry: { name?: string; value?: number }) =>
                `${entry.name ?? ''}: ${formatNumber(Number(entry.value ?? 0))}`
              }
              labelLine={false}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={BRAND_PALETTE[i % BRAND_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [formatNumber(Number(v)), 'เช็คอิน']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

interface SeriesDatum {
  date: string;
  checkins: number;
  success: number;
  distanceKm: number;
}

function TrendChart({
  series,
  loading,
  error,
  onRetry,
}: {
  series: SeriesDatum[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const chartData = series.map((d) => ({
    ...d,
    label: shortDateLabel(d.date),
  }));
  const tooltipFormatter = useCallback(
    (value: unknown, name: unknown): [string, string] => {
      const n = Number(value);
      const label = String(name);
      if (label === 'ระยะทาง (กม.)') return [formatKm(n), label];
      return [formatNumber(n), label];
    },
    [],
  );

  return (
    <div className="card card-pad chart-card">
      <h3 className="card-title">แนวโน้มรายวัน</h3>
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={onRetry} />
      ) : chartData.length === 0 ? (
        <EmptyBlock />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gCheckins" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#64748b' }}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="checkins"
              name="เช็คอิน"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#gCheckins)"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="success"
              name="ปิดดีล"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="distanceKm"
              name="ระยะทาง (กม.)"
              stroke="#ea580c"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
