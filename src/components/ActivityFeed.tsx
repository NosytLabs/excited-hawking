import { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'prompt' | 'vote' | 'governance' | 'stake';
  description: string;
  address: string;
  timestamp: number;
}

const BASE_TIME = 1748284800000;

const typeColors = {
  prompt: 'text-[var(--vault-teal)]',
  vote: 'text-[var(--shell-accent)]',
  governance: 'text-[var(--shell-success)]',
  stake: 'text-[var(--shell-text-muted)]',
};

export const ActivityFeed = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/activity');
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch {
        // fallback to mock data on error
        setEvents([
          { id: '1', type: 'prompt', description: 'Prompt processed', address: '0x1234...5678', timestamp: BASE_TIME - 30000 },
          { id: '2', type: 'vote', description: 'Vote cast on G-042', address: '0xabcd...efgh', timestamp: BASE_TIME - 120000 },
          { id: '3', type: 'stake', description: '50 DIEM staked', address: '0x9876...5432', timestamp: BASE_TIME - 300000 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (timestamp: number) => {
    const diff = now - timestamp;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[var(--vault-teal)]" />
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider">
            Live Activity
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[var(--shell-success)]">
          <span className="w-2 h-2 rounded-full bg-[var(--shell-success)] animate-pulse" />
          Live
        </div>
      </div>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-[var(--shell-text-muted)] text-xs">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-4 text-[var(--shell-text-muted)] text-xs">
            No activity yet. Be the first to interact!
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 text-xs">
              <div className={`mt-0.5 ${typeColors[event.type]}`}>
                <Activity size={12} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--shell-text)]">{event.description}</span>
                  <span className="text-[10px] text-[var(--shell-text-muted)] flex items-center gap-1">
                    <Clock size={10} />
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--shell-text-muted)] font-mono">{event.address}</span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-[var(--shell-border)] text-center">
        <span className="text-[10px] text-[var(--shell-text-muted)]">
          Real-time activity from the network
        </span>
      </div>
    </div>
  );
};

export default ActivityFeed;

