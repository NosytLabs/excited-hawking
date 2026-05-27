import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';

import { initWebSocket } from '../services/websocket.js';

describe('WebSocket origin allowlist', () => {
  let httpServer: ReturnType<typeof createServer> | null = null;
  let wsServer: ReturnType<typeof initWebSocket> | null = null;

  afterEach(async () => {
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer?.close((error) => {
          if (error) {
            if (error.message === 'Server is not running.') {
              resolve();
              return;
            }
            reject(error);
            return;
          }
          resolve();
        });
      });
      httpServer = null;
    }

    if (wsServer) {
      wsServer.removeAllListeners();
      wsServer = null;
    }
  });

  it('allows the isolated Vite dev origin during the socket.io handshake', async () => {
    httpServer = createServer();
    wsServer = initWebSocket(httpServer);

    await new Promise<void>((resolve) => {
      httpServer?.listen(0, '127.0.0.1', () => resolve());
    });

    const port = (httpServer.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/socket.io/?EIO=4&transport=polling&t=test4173`, {
      headers: {
        Origin: 'http://127.0.0.1:4173',
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:4173');
  });
});
