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

const mockEvents: ActivityEvent[] = [
  { id: '1', type: 'prompt', description: 'Prompt processed', address: '0x1234...5678', timestamp: BASE_TIME - 30000 },
  { id: '2', type: 'vote', description: 'Vote cast on G-042', address: '0xabcd...efgh', timestamp: BASE_TIME - 120000 },
  { id: '3', type: 'stake', description: '50 DIEM staked', address: '0x9876...5432', timestamp: BASE_TIME - 300000 },
  { id: '4', type: 'governance', description: 'Proposal G-041 passed', address: 'system', timestamp: BASE_TIME - 600000 },
  { id: '5', type: 'prompt', description: 'Prompt processed', address: '0x5555...aaaa', timestamp: BASE_TIME - 900000 },
];

const typeColors = {
  prompt: 'text-[var(--vault-teal)]',
  vote: 'text-[var(--shell-accent)]',
  governance: 'text-[var(--shell-success)]',
  stake: 'text-[var(--shell-text-muted)]',
};

export const ActivityFeed = () => {
  const [events, setEvents] = useState<ActivityEvent[]>(mockEvents);
  const [now, setNow] = useState(BASE_TIME);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(prev => prev + 15000);
      setEvents(prev => {
        const newEvent: ActivityEvent = {
          id: (BASE_TIME + 15000).toString(),
          type: ['prompt', 'vote', 'stake'][Math.floor(Math.random() * 3)] as ActivityEvent['type'],
          description: 'New event',
          address: '0x' + Math.random().toString(16).slice(2, 10) + '...',
          timestamp: BASE_TIME + 15000,
        };
        return [newEvent, ...prev].slice(0, 10);
      });
    }, 15000);
    
    return () => clearInterval(interval);
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
        {events.map((event) => (
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
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-[var(--shell-border)] text-center">
        <span className="text-[10px] text-[var(--shell-text-muted)]">
          Activity shown for demonstration purposes
        </span>
      </div>
    </div>
  );
};

export default ActivityFeed;

