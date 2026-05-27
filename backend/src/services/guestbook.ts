import { sanitizeForHTML } from '../types/index.js';
import type { Server, Socket } from 'socket.io';

interface GuestbookReply {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface GuestbookEntry {
  id: string;
  author: string;
  content: string;
  upvotes: number;
  timestamp: string;
  replies: GuestbookReply[];
}

const MAX_GUESTBOOK_ENTRIES = 1000;
const guestbookEntries: Map<string, GuestbookEntry> = new Map();
const guestbookOrder: string[] = [];

function evictOldEntries(): void {
  while (guestbookOrder.length >= MAX_GUESTBOOK_ENTRIES) {
    const oldestId = guestbookOrder.shift();
    if (oldestId) guestbookEntries.delete(oldestId);
  }
}

export function setupGuestbookHandlers(socket: Socket, io: Server): void {
  socket.on('guestbook:entry', (data: { author: string; content: string }) => {
    evictOldEntries();
    const entry: GuestbookEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      author: sanitizeForHTML(data.author, 100) || 'Anonymous',
      content: sanitizeForHTML(data.content, 500),
      upvotes: 0,
      timestamp: new Date().toISOString(),
      replies: []
    };
    guestbookOrder.push(entry.id);
    guestbookEntries.set(entry.id, entry);
    io.emit('guestbook:entry', entry);
    console.log(`[WS] Guestbook entry created: ${entry.id}`);
  });

  socket.on('guestbook:upvote', (data: { entryId: string }) => {
    const entry = guestbookEntries.get(data.entryId);
    if (entry) {
      entry.upvotes += 1;
      io.emit('guestbook:upvote', { entryId: data.entryId, upvotes: entry.upvotes });
      console.log(`[WS] Guestbook entry upvoted: ${data.entryId}, new count: ${entry.upvotes}`);
    }
  });

  socket.on('guestbook:reply', (data: { entryId: string; author: string; content: string }) => {
    const entry = guestbookEntries.get(data.entryId);
    if (entry) {
      const reply: GuestbookReply = {
        id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        author: sanitizeForHTML(data.author, 100) || 'Anonymous',
        content: sanitizeForHTML(data.content, 500),
        timestamp: new Date().toISOString()
      };
      entry.replies.push(reply);
      io.emit('guestbook:entry', entry);
      console.log(`[WS] Guestbook reply added to: ${data.entryId}`);
    }
  });
}
