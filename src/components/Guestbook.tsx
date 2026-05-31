import React, { useState, useEffect } from 'react';
import { Leaf, ChevronUp, MessageCircle, Send } from 'lucide-react';
import { websocketService, type GuestbookEntry, type GuestbookReply } from '../services/websocket';
import { WSEvents } from '../types/events';
import { formatTimeAgo } from '../lib/time';

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
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [newReply, setNewReply] = useState<{ [entryId: string]: string }>({});
  const [newEntry, setNewEntry] = useState('');

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleGuestbookEntry = (entry: GuestbookEntry) => {
      setEntries(prev => {
        const existing = prev.findIndex(e => e.id === entry.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = entry;
          return updated;
        }
        return [entry, ...prev];
      });
    };
    const handleGuestbookUpvote = (data: { entryId: string; upvotes: number }) => {
      setEntries(prev => prev.map(e =>
        e.id === data.entryId ? { ...e, upvotes: data.upvotes } : e
      ));
    };
    const handleGuestbookEntries = (entries: GuestbookEntry[]) => {
      if (entries.length > 0) {
        setEntries(entries);
      }
    };

    websocketService.on(WSEvents.CONNECT, handleConnect);
    websocketService.on(WSEvents.DISCONNECT, handleDisconnect);
    websocketService.on(WSEvents.GUESTBOOK_ENTRY, handleGuestbookEntry);
    websocketService.on(WSEvents.GUESTBOOK_ENTRIES, handleGuestbookEntries);
    websocketService.on(WSEvents.GUESTBOOK_UPVOTE, handleGuestbookUpvote);

    websocketService.emit('guestbook:request', {});

    return () => {
      websocketService.off(WSEvents.CONNECT, handleConnect);
      websocketService.off(WSEvents.DISCONNECT, handleDisconnect);
      websocketService.off(WSEvents.GUESTBOOK_ENTRY, handleGuestbookEntry);
      websocketService.off(WSEvents.GUESTBOOK_ENTRIES, handleGuestbookEntries);
      websocketService.off(WSEvents.GUESTBOOK_UPVOTE, handleGuestbookUpvote);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected && entries.length === 0) {
        setEntries(MOCK_ENTRIES);
        setIsUsingFallback(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isConnected, entries.length]);

  const handleUpvote = (entryId: string) => {
    websocketService.emit(WSEvents.GUESTBOOK_UPVOTE, { entryId });
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
    websocketService.emit(WSEvents.GUESTBOOK_REPLY, { entryId, author: 'You', content: newReply[entryId].trim() });
    setNewReply(prev => ({ ...prev, [entryId]: '' }));
  };

  const formatTime = (timestamp: string) => formatTimeAgo(timestamp);

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between mb-4" style={{
        borderBottom: '1px solid var(--paper-border)',
        paddingBottom: '0.5rem',
      }}>
        <h3 className="text-base font-bold flex items-center gap-2" style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--paper-text)',
        }}>
          <Leaf size={16} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
          <span className="hidden sm:inline">Moltbook</span>
          <span className="sm:hidden">Book</span>
        </h3>
        
        {isUsingFallback ? (
          <span className="flex items-center gap-1 text-base px-2 py-0.5 rounded text-xs" 
                style={{ backgroundColor: 'var(--paper-surface)', color: 'var(--paper-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--warning)' }} />
            Demo
          </span>
        ) : isConnected ? (
          <span className="flex items-center gap-1 text-base px-2 py-0.5 rounded" 
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--paper-void)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--paper-void)' }} />
            Live
          </span>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newEntry.trim() || !isConnected) return;
          websocketService.emit(WSEvents.GUESTBOOK_ENTRY, { author: 'You', content: newEntry.trim() });
          setNewEntry('');
        }}
        className="mb-4 flex gap-2"
      >
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder={isConnected ? "Sign the guestbook..." : "Connect to sign..."}
          disabled={!isConnected}
          maxLength={500}
          className="flex-1 resize-none text-base px-3 py-2 rounded"
          style={{
            backgroundColor: 'var(--paper-surface)',
            color: 'var(--paper-text)',
            border: '1px solid var(--paper-border)',
          }}
          rows={2}
        />
        <button
          type="submit"
          disabled={!isConnected || !newEntry.trim()}
          className="px-3 py-2 rounded self-end transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--paper-void)',
          }}
          aria-label="Sign guestbook"
        >
          <Send size={18} />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {entries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-base" style={{ color: 'var(--paper-muted)' }}>
              No entries yet. Be the first to sign!
            </p>
          </div>
        )}

        {entries.map(entry => (
          <div key={entry.id} className="animate-fade-in">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold" style={{ color: 'var(--accent-primary)' }}>
                    {entry.author}
                  </span>
                  <span className="text-base" style={{ color: 'var(--paper-muted)' }}>
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <p className="text-base mb-2" style={{ color: 'var(--paper-text)' }}>
                  {entry.content}
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleUpvote(entry.id)}
                    className="flex items-center gap-1 text-base transition-colors hover:opacity-80 min-h-[44px] px-2 -ml-2"
                    style={{ color: 'var(--accent-dim)' }}
                    aria-label={`Upvote (${entry.upvotes})`}
                  >
                    <ChevronUp size={18} aria-hidden="true" />
                    <span>{entry.upvotes}</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleReplies(entry.id)}
                    className="flex items-center gap-1 text-base transition-colors hover:opacity-80 min-h-[44px] px-2 -ml-2"
                    style={{ color: expandedReplies.has(entry.id) ? 'var(--accent-primary)' : 'var(--paper-muted)' }}
                    aria-label={`${expandedReplies.has(entry.id) ? 'Hide' : 'Show'} replies`}
                    aria-expanded={expandedReplies.has(entry.id)}
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    <span aria-hidden="true">{entry.replies?.length || 0} replies</span>
                  </button>
                </div>
              </div>
            </div>

            {expandedReplies.has(entry.id) && (
              <div className="ml-4 mt-3 space-y-3 pl-3" style={{ borderLeft: '2px solid var(--paper-border)' }}>
                {entry.replies?.map(reply => (
                  <div key={reply.id} className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold" style={{ color: 'var(--paper-text)' }}>
                        {reply.author}
                      </span>
                      <span className="text-base" style={{ color: 'var(--paper-muted)' }}>
                        {formatTime(reply.timestamp)}
                      </span>
                    </div>
                    <p className="text-base" style={{ color: 'var(--paper-text)' }}>
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
                    className="flex-1 text-base px-3 py-2 min-h-[44px] rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'var(--paper-deep)',
                      borderColor: 'var(--paper-border)',
                      color: 'var(--paper-text)',
                    }}
                    aria-label={`Reply to ${entry.author}`}
                  />
                  <button
                    onClick={() => handleSubmitReply(entry.id)}
                    className="p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--paper-void)' }}
                    aria-label="Send reply"
                  >
                    <Send size={18} />
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
