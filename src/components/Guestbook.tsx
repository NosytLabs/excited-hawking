import React, { useState, useEffect } from 'react';
import { Leaf, ChevronUp, MessageCircle, Send } from 'lucide-react';
import { websocketService } from '../services/websocket';
import { WSEvents } from '../types/events';

interface GuestbookEntry {
  id: string;
  author: string;
  content: string;
  upvotes: number;
  timestamp: string;
  replies?: GuestbookReply[];
}

interface GuestbookReply {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

const MOCK_ENTRIES: GuestbookEntry[] = [
  {
    id: '1',
    author: '0x742d...5c3a',
    content: 'First entry! Excited to be part of this community.',
    upvotes: 12,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    replies: [
      { id: 'r1', author: '0x8ba1...2f4d', content: 'Welcome!', timestamp: new Date(Date.now() - 3000000).toISOString() }
    ]
  },
  {
    id: '2',
    author: '0x8ba1...2f4d',
    content: 'The emergence UI is incredible. Love the cellular automata visualization.',
    upvotes: 8,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    replies: []
  }
];

export const Guestbook: React.FC = () => {
  const [entries, setEntries] = useState<GuestbookEntry[]>(MOCK_ENTRIES);
  const [isConnected, setIsConnected] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [newReply, setNewReply] = useState<{ [entryId: string]: string }>({});

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleGuestbookEntry = (entry: GuestbookEntry) => {
      setEntries(prev => [entry, ...prev]);
    };
    const handleGuestbookUpvote = (data: { entryId: string; upvotes: number }) => {
      setEntries(prev => prev.map(e => 
        e.id === data.entryId ? { ...e, upvotes: data.upvotes } : e
      ));
    };
    
    websocketService.on(WSEvents.CONNECT, handleConnect);
    websocketService.on(WSEvents.DISCONNECT, handleDisconnect);
    websocketService.on(WSEvents.GUESTBOOK_ENTRY, handleGuestbookEntry);
    websocketService.on(WSEvents.GUESTBOOK_UPVOTE, handleGuestbookUpvote);

    return () => {
      websocketService.off(WSEvents.CONNECT, handleConnect);
      websocketService.off(WSEvents.DISCONNECT, handleDisconnect);
      websocketService.off(WSEvents.GUESTBOOK_ENTRY, handleGuestbookEntry);
      websocketService.off(WSEvents.GUESTBOOK_UPVOTE, handleGuestbookUpvote);
    };
  }, []);

  const handleUpvote = (entryId: string) => {
    websocketService.emit('guestbook:upvote', { entryId });
  };

  const toggleReplies = (entryId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleReplyChange = (entryId: string, value: string) => {
    setNewReply(prev => ({ ...prev, [entryId]: value }));
  };

  const handleSubmitReply = (entryId: string) => {
    if (!newReply[entryId]?.trim()) return;
    const reply: GuestbookReply = {
      id: `reply-${Date.now()}`,
      author: 'You',
      content: newReply[entryId].trim(),
      timestamp: new Date().toISOString()
    };
    setEntries(prev => prev.map(e => 
      e.id === entryId 
        ? { ...e, replies: [...(e.replies || []), reply] } 
        : e
    ));
    setNewReply(prev => ({ ...prev, [entryId]: '' }));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="glass-panel flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4" style={{
        borderBottom: '1px solid var(--shell-border)',
        paddingBottom: '0.5rem',
      }}>
        <h3 className="text-sm font-bold flex items-center gap-2" style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--shell-text)',
        }}>
          <Leaf size={16} style={{ color: 'var(--vault-teal)' }} aria-hidden="true" />
          <span className="hidden sm:inline">Moltbook</span>
          <span className="sm:hidden">Book</span>
        </h3>
        
        {isConnected && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded" 
                style={{ backgroundColor: 'var(--vault-teal)', color: 'var(--shell-bg)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--shell-bg)' }} />
            Live
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {entries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>
              No entries yet. Be the first to sign!
            </p>
          </div>
        )}

        {entries.map(entry => (
          <div key={entry.id} className="animate-fade-in">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold" style={{ color: 'var(--vault-teal-dim)' }}>
                    {entry.author}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--shell-text)' }}>
                  {entry.content}
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleUpvote(entry.id)}
                    className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                    style={{ color: 'var(--vault-teal-dim)' }}
                    aria-label={`Upvote, current count: ${entry.upvotes}`}
                  >
                    <ChevronUp size={14} />
                    <span>{entry.upvotes}</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleReplies(entry.id)}
                    className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                    style={{ color: expandedReplies.has(entry.id) ? 'var(--vault-teal)' : 'var(--shell-text-muted)' }}
                    aria-label={`${expandedReplies.has(entry.id) ? 'Hide' : 'Show'} replies`}
                    aria-expanded={expandedReplies.has(entry.id)}
                  >
                    <MessageCircle size={14} aria-hidden="true" />
                    <span aria-hidden="true">{entry.replies?.length || 0} replies</span>
                  </button>
                </div>
              </div>
            </div>

            {expandedReplies.has(entry.id) && (
              <div className="ml-4 mt-3 space-y-3 pl-3" style={{ borderLeft: '2px solid var(--shell-border)' }}>
                {entry.replies?.map(reply => (
                  <div key={reply.id} className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: 'var(--shell-text)' }}>
                        {reply.author}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>
                        {formatTime(reply.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--shell-text)' }}>
                      {reply.content}
                    </p>
                  </div>
                ))}
                
                <div className="flex gap-2 items-center mt-3">
                  <input
                    type="text"
                    value={newReply[entry.id] || ''}
                    onChange={(e) => handleReplyChange(entry.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitReply(entry.id);
                      }
                    }}
                    placeholder="Write a reply..."
                    className="flex-1 text-xs px-3 py-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'var(--shell-surface)',
                      borderColor: 'var(--shell-border)',
                      color: 'var(--shell-text)',
                    }}
                    aria-label={`Reply to ${entry.author}`}
                  />
                  <button
                    onClick={() => handleSubmitReply(entry.id)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--vault-teal)', color: 'var(--shell-bg)' }}
                    aria-label="Send reply"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
