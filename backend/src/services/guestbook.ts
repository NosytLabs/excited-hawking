import { generateId } from '../lib/crypto.js';
import { sanitizeForHTML } from '../types/index.js';
import type { Server, Socket } from 'socket.io';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

interface GuestbookData {
  entries: GuestbookEntry[];
  order: string[];
}

const MAX_GUESTBOOK_ENTRIES = 1000;
const guestbookOrder: string[] = [];
const guestbookUpvoteTracker: Map<string, Set<number>> = new Map();

function getDbPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, '../../../data/guestbook.json');
}

function loadEntries(): Map<string, GuestbookEntry> {
  const dbPath = getDbPath();
  const map = new Map<string, GuestbookEntry>();
  if (existsSync(dbPath)) {
    try {
      const data = JSON.parse(readFileSync(dbPath, 'utf-8')) as GuestbookData;
      if (Array.isArray(data.entries)) {
        for (const entry of data.entries) {
          map.set(entry.id, entry);
        }
      }
      if (Array.isArray(data.order)) {
        guestbookOrder.length = 0;
        guestbookOrder.push(...data.order);
      }
    } catch (err) {
      console.warn('[Guestbook] Failed to load entries:', err);
    }
  }
  return map;
}

const guestbookEntries: Map<string, GuestbookEntry> = loadEntries();

function saveEntries(): void {
  try {
    const dbPath = getDbPath();
    const dataDir = join(dirname(dbPath));
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    const data: GuestbookData = {
      entries: Array.from(guestbookEntries.values()),
      order: guestbookOrder
    };
    writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Guestbook] Failed to save:', err);
  }
}

function evictOldEntries(): void {
  while (guestbookOrder.length >= MAX_GUESTBOOK_ENTRIES) {
    const oldestId = guestbookOrder.shift();
    if (oldestId) guestbookEntries.delete(oldestId);
  }
  saveEntries();
}

function checkGuestbookRateLimit(socketId: string, action: string): boolean {
  const key = `${socketId}:${action}`;
  const now = Date.now();
  const windowMs = 60000;
  const maxActions = 10;
  
  if (!guestbookUpvoteTracker.has(key)) {
    guestbookUpvoteTracker.set(key, new Set<number>());
  }
  
  const tracker = guestbookUpvoteTracker.get(key)!;
  const windowStart = now - windowMs;

  const toDelete: number[] = [];
  for (const timestamp of tracker) {
    if (timestamp < windowStart) toDelete.push(timestamp);
  }
  for (const ts of toDelete) tracker.delete(ts);
  
  if (tracker.size >= maxActions) {
    console.warn(`[WS][RATE LIMIT] Guestbook ${action} exceeded for socket: ${socketId}`);
    return false;
  }
  
  tracker.add(now);
  return true;
}

export function setupGuestbookHandlers(socket: Socket, io: Server): void {
  socket.on('guestbook:entry', (data: { author: string; content: string }) => {
    if (!checkGuestbookRateLimit(socket.id, 'entry')) {
      socket.emit('error', { code: 'RATE_LIMITED', message: 'Too many guestbook entries' });
      return;
    }
    evictOldEntries();
    const entry: GuestbookEntry = {
      id: generateId(),
      author: sanitizeForHTML(data.author, 100) || 'Anonymous',
      content: sanitizeForHTML(data.content, 500),
      upvotes: 0,
      timestamp: new Date().toISOString(),
      replies: []
    };
    guestbookOrder.push(entry.id);
    guestbookEntries.set(entry.id, entry);
    saveEntries();
    io.emit('guestbook:entry', entry);
    console.log(`[WS] Guestbook entry created: ${entry.id}`);
  });

  socket.on('guestbook:upvote', (data: { entryId: string }) => {
    if (!checkGuestbookRateLimit(socket.id, 'upvote')) {
      socket.emit('error', { code: 'RATE_LIMITED', message: 'Too many upvotes' });
      return;
    }
    const entry = guestbookEntries.get(data.entryId);
    if (!entry) {
      socket.emit('error', { code: 'NOT_FOUND', message: 'Guestbook entry not found' });
      return;
    }
    entry.upvotes += 1;
    saveEntries();
    io.emit('guestbook:upvote', { entryId: data.entryId, upvotes: entry.upvotes });
    console.log(`[WS] Guestbook entry upvoted: ${data.entryId}, new count: ${entry.upvotes}`);
  });

  socket.on('guestbook:reply', (data: { entryId: string; author: string; content: string }) => {
    if (!checkGuestbookRateLimit(socket.id, 'reply')) {
      socket.emit('error', { code: 'RATE_LIMITED', message: 'Too many replies' });
      return;
    }
    const entry = guestbookEntries.get(data.entryId);
    if (!entry) {
      socket.emit('error', { code: 'NOT_FOUND', message: 'Guestbook entry not found' });
      return;
    }
    const reply: GuestbookReply = {
      id: generateId(),
      author: sanitizeForHTML(data.author, 100) || 'Anonymous',
      content: sanitizeForHTML(data.content, 500),
      timestamp: new Date().toISOString()
    };
    entry.replies.push(reply);
    saveEntries();
    io.emit('guestbook:entry', entry);
    console.log(`[WS] Guestbook reply added to: ${data.entryId}`);
  });

  socket.on('guestbook:request', () => {
    socket.emit('guestbook:entries', Array.from(guestbookEntries.values()));
  });
}