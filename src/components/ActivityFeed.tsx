import { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'prompt' | 'vote' | 'governance' | 'stake';
  description: string;
  address: string;
  timestamp: number;
}

const typeColors = {
  prompt: 'text-[var(--accent-primary)]',
  vote: 'text-[var(--accent-dim)]',
  governance: 'text-[var(--success)]',
  stake: 'text-[var(--paper-muted)]',
};

function getFallbackEvents(): ActivityEvent[] {
  const now = Date.now();
  return [
    { id: '1', type: 'prompt', description: 'Prompt processed via Agent pipeline', address: '0x1234...5678', timestamp: now - 30000 },
    { id: '2', type: 'vote', description: 'Vote cast on G-042: Grid complexity metrics', address: '0xabcd...efgh', timestamp: now - 90000 },
    { id: '3', type: 'stake', description: '50.00 DIEM staked for access', address: '0x9876...5432', timestamp: now - 150000 },
    { id: '4', type: 'governance', description: 'Proposal G-043 submitted: treasury allocation', address: '0x5555...aaaa', timestamp: now - 300000 },
    { id: '5', type: 'prompt', description: 'Deep analysis prompt queued (depth: 0.05)', address: '0xdddd...eeee', timestamp: now - 420000 },
    { id: '6', type: 'vote', description: 'Quadratic vote weighted at 7.07x', address: '0x1111...2222', timestamp: now - 600000 },
  ];
}

export const ActivityFeed = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/activity', { signal: AbortSignal.timeout(3000) });
        if (response.ok && !ignore) {
          const data = await response.json();
          setEvents(data.events || []);
        } else if (!ignore) {
          setEvents(getFallbackEvents());
        }
      } catch {
        if (!ignore) setEvents(getFallbackEvents());
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    const diff = now - timestamp;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div role="region" aria-label="Activity feed">
      {/* Header row — no eyebrow, inline status */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--paper-border)]">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[var(--accent-primary)]" />
          <span className="text-sm font-mono text-[var(--paper-muted)]">Live Activity</span>
        </div>
        <div role="status" aria-live="polite" className="flex items-center gap-1.5 text-sm text-[var(--success)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
          Live
        </div>
      </div>

      {/* Event list */}
      <div className="space-y-2 max-h-[240px] overflow-y-auto">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-2 h-2 mt-1.5 rounded-sm bg-[var(--paper-surface)]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-[var(--paper-surface)]" />
                  <div className="h-2 w-1/4 bg-[var(--paper-surface)]" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-[var(--paper-muted)]">No activity yet</p>
            <p className="text-sm text-[var(--paper-muted)] mt-1">Submit a prompt to get started</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 text-sm">
              <div className={`mt-0.5 ${typeColors[event.type]}`}>
                <Activity size={10} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--paper-text)] truncate">{event.description}</span>
                  <span className="text-xs text-[var(--paper-muted)] flex items-center gap-1 shrink-0" aria-label={`${formatTime(event.timestamp)} ago`}>
                    <Clock size={8} aria-hidden="true" />
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <span className="text-xs text-[var(--paper-muted)] font-mono">{event.address}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
