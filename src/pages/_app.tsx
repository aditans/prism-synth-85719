import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { setupWiresharkWebSocket } from '@/server/wireshark';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [wsInitialized, setWsInitialized] = useState(false);

  // Initialize WebSocket server on the client side
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Only initialize once
    if (wsInitialized) return;

    // Set up WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/wireshark/ws`;
    
    // The actual WebSocket connection will be handled by the WiresharkTool component
    // We just need to ensure the server is ready to accept connections
    
    setWsInitialized(true);
  }, []);

  return <Component {...pageProps} />;
}

// This function is called when the server starts
if (typeof window === 'undefined') {
  const http = require('http');
  const { parse } = require('url');
  const next = require('next');
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({ dev });
  const handle = app.getRequestHandler();
  const port = process.env.PORT || 3000;

  app.prepare().then(() => {
    const server = http.createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    // Set up WebSocket server
    setupWiresharkWebSocket(server);

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  });
}
