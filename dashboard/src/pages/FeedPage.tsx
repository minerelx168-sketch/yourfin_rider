import * as api from '../api/client';
import { useRange } from '../range/useRange';
import { usePolledData } from '../hooks/usePolledData';
import { useReportFreshness } from '../hooks/useReportFreshness';
import { PageHeader } from '../components/PageHeader';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlock';
import { StatusBadge } from '../components/StatusBadge';
import {
  brandLabel,
  EVENT_TYPE_LABEL,
  formatDateTime,
  formatKm,
} from '../lib/format';
import type { EventType, FeedItem } from '../types';
import './FeedPage.css';

const EVENT_ICON: Record<EventType, string> = {
  CLOCK_IN: '🟢',
  CHECK_IN: '📍',
  CLOCK_OUT: '🔴',
};

export function FeedPage() {
  const { range } = useRange();
  const { data, loading, refreshing, error, reload, lastUpdated } = usePolledData(
    () => api.getActivityFeed(50, range),
    { deps: [range.from, range.to] },
  );
  useReportFreshness(lastUpdated);

  const feed = data?.feed ?? [];

  return (
    <div>
      <PageHeader title="กิจกรรมล่าสุด" refreshing={refreshing} />

      <div className="card">
        {loading ? (
          <LoadingBlock />
        ) : error && !data ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : feed.length === 0 ? (
          <EmptyBlock message="ยังไม่มีกิจกรรมในช่วงเวลาที่เลือก" icon="⚡" />
        ) : (
          <ul className="feed-list">
            {feed.map((item) => (
              <FeedRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const isCheckin = item.eventType === 'CHECK_IN';
  return (
    <li className="feed-item">
      <div className="feed-icon">{EVENT_ICON[item.eventType]}</div>
      <div className="feed-body">
        <div className="feed-line1">
          <strong className="feed-rider">{item.riderName}</strong>
          <span className="feed-event">{EVENT_TYPE_LABEL[item.eventType]}</span>
          {isCheckin && item.storeName && (
            <span className="feed-store">@ {item.storeName}</span>
          )}
        </div>
        <div className="feed-line2">
          {isCheckin && item.brand && (
            <span className="feed-meta">{brandLabel(item.brand)}</span>
          )}
          {item.legDistanceKm != null && (
            <span className="feed-meta">🛣️ {formatKm(item.legDistanceKm)} กม.</span>
          )}
        </div>
      </div>
      <div className="feed-right">
        {isCheckin && <StatusBadge status={item.visitStatus} />}
        <time className="feed-time">{formatDateTime(item.eventTime)}</time>
      </div>
    </li>
  );
}
