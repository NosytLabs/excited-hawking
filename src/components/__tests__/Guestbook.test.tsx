import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Guestbook } from '../Guestbook';
import { WSEvents } from '../../types/events';

const websocketMock = vi.hoisted(() => {
  const handlers = new Map<string, Set<(data: unknown) => void>>();

  const on = vi.fn((event: string, handler: (data: unknown) => void) => {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    handlers.get(event)?.add(handler);
  });

  const off = vi.fn((event: string, handler?: (data: unknown) => void) => {
    if (handler) {
      const eventHandlers = handlers.get(event);
      eventHandlers?.delete(handler);
      if (eventHandlers?.size === 0) {
        handlers.delete(event);
      }
      return;
    }

    handlers.delete(event);
  });

  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    getConnectionStatus: vi.fn(() => false),
    on,
    off,
    emitEvent(event: string, data: unknown) {
      handlers.get(event)?.forEach((handler) => handler(data));
    },
    reset() {
      handlers.clear();
      this.connect.mockClear();
      this.disconnect.mockClear();
      this.emit.mockClear();
      this.getConnectionStatus.mockClear();
      this.getConnectionStatus.mockReturnValue(false);
      on.mockClear();
      off.mockClear();
    },
  };
});

vi.mock('../../services/websocket', () => ({
  websocketService: websocketMock,
}));

describe('Guestbook', () => {
  beforeEach(() => {
    websocketMock.reset();
  });

  it('should render without crashing', () => {
    render(<Guestbook />);
  });

  it('should preserve external guestbook listeners when the component unmounts', () => {
    const externalListener = vi.fn();
    websocketMock.on(WSEvents.GUESTBOOK_ENTRY, externalListener);

    const { unmount } = render(<Guestbook />);
    unmount();

    act(() => {
      websocketMock.emitEvent(WSEvents.GUESTBOOK_ENTRY, {
        id: 'entry-1',
        author: 'External',
        content: 'Still listening',
        upvotes: 1,
        timestamp: new Date().toISOString(),
      });
    });

    expect(externalListener).toHaveBeenCalledTimes(1);
  });
});