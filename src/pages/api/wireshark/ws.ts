import { NextApiRequest, NextApiResponse } from 'next';
import { WebSocketServer } from 'ws';
import { NextApiRequestWithSocket } from '@/types';

// This is a placeholder for the WebSocket server initialization
// The actual WebSocket server is set up in src/server/wireshark.ts
// and connected to the HTTP server in pages/_app.tsx

export default function handler(
  req: NextApiRequestWithSocket,
  res: NextApiResponse
) {
  // This route is only for WebSocket upgrades
  if (!req.ws) {
    res.status(400).json({ error: 'WebSocket not supported' });
    return;
  }

  // The WebSocket upgrade is handled by the WebSocket server
  // so we don't need to do anything here
  res.status(426).json({ error: 'Upgrade to WebSocket required' });
}

// This tells Next.js to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};
