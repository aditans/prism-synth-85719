import { Server as HTTPServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer } from 'ws';

declare module 'next' {
  interface NextApiRequestWithSocket extends NextApiRequest {
    ws?: WebSocketServer;
  }

  interface NextApiResponseWithSocket extends NextApiResponse {
    socket: {
      server: HTTPServer & {
        wsServer?: WebSocketServer;
      };
    };
  }
}
