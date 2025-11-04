import { WebSocketServer, WebSocket } from 'ws';
import { spawn, exec } from 'child_process';
import { Server } from 'http';
import { NextApiRequest } from 'next';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface WiresharkClient extends WebSocket {
  isAlive: boolean;
  captureProcess?: any;
}

export function setupWiresharkWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade on the HTTP server
  server.on('upgrade', (request: any, socket, head) => {
    console.log('[wireshark] HTTP upgrade request', { url: request.url, remote: request.socket?.remoteAddress });
    if (request.url === '/api/wireshark/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  // Handle new WebSocket connections
  wss.on('connection', (ws: WiresharkClient, req: NextApiRequest) => {
    console.log('[wireshark] WebSocket connected', { clientCount: wss.clients.size, ip: (req as any)?.socket?.remoteAddress });
    ws.isAlive = true;

    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (!ws.isAlive) {
        console.log('[wireshark] heartbeat failed, terminating socket');
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    }, 30000);

    // Handle incoming messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('[wireshark] message received', { action: data?.action, filter: Boolean(data?.filter), iface: data?.interface });
        
        if (data.action === 'start') {
          // Stop any existing capture
          if (ws.captureProcess) {
            console.log('[wireshark] stopping existing capture before start');
            ws.captureProcess.kill('SIGKILL');
          }

          // Validate interface exists
          const { stdout: interfaces } = await execAsync('ls /sys/class/net');
          const availableInterfaces = interfaces.trim().split('\n');
          console.log('[wireshark] available interfaces', availableInterfaces);
          
          if (!availableInterfaces.includes(data.interface)) {
            console.log('[wireshark] invalid interface', { requested: data.interface });
            ws.send(JSON.stringify({
              type: 'error',
              message: `Interface '${data.interface}' not found. Available interfaces: ${availableInterfaces.join(', ')}`
            }));
            return;
          }

          // Start new capture with tshark
          const args = [
            '-i', data.interface,
            '-T', 'json',
            '-e', 'frame.time_relative',
            '-e', 'ip.src',
            '-e', 'ip.dst',
            '-e', '_ws.col.Protocol',
            '-e', 'frame.len',
            '-e', '_ws.col.Info',
            '-c', 5,
            '-l', // Output each packet on a new line
            '--no-promiscuous-mode', // Don't put the interface in promiscuous mode
            '--no-duplicate-keys' // Don't duplicate keys in JSON output
          ];
          
          // Add capture filter (BPF) if provided
          if (data.filter && data.filter.trim() !== '') {
            args.push('-f', data.filter.trim());
          }

          console.log('[wireshark] spawning tshark', { args });
          const tshark = spawn('tshark', args, {
            stdio: ['ignore', 'pipe', 'pipe']
          });

          ws.captureProcess = tshark;

          tshark.on('error', (err) => {
            console.error('[wireshark] tshark spawn error', err);
            try {
              ws.send(JSON.stringify({ type: 'error', message: String(err?.message || err) }));
            } catch {}
          });

          // Handle tshark output
          tshark.stdout.on('data', (data) => {
            try {
              const lines = data.toString().split('\n').filter(Boolean);
              if (lines.length > 0) {
                console.log('[wireshark] tshark stdout lines', { count: lines.length });
              }
              for (const line of lines) {
                const packetData = JSON.parse(line);
                const packet = {
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Generate a unique ID
                  timestamp: new Date().toISOString(),
                  source: packetData['_source']?.layers?.ip_src?.[0] || 'N/A',
                  destination: packetData['_source']?.layers?.ip_dst?.[0] || 'N/A',
                  protocol: packetData['_source']?.layers?.['_ws.col.Protocol']?.[0] || 'Unknown',
                  length: parseInt(packetData['_source']?.layers?.['frame.len']?.[0] || '0', 10),
                  info: packetData['_source']?.layers?.['_ws.col.Info']?.[0] || ''
                };

                ws.send(JSON.stringify({
                  type: 'packet',
                  packet
                }));
              }
            } catch (e) {
              console.error('Error parsing tshark output:', e);
            }
          });

          // Handle errors
          tshark.stderr.on('data', (data) => {
            const errorMessage = data.toString();
            console.log(`tshark stderr: ${errorMessage}`);
            const critical = /(permission denied|no such device|could not be initiated|not found|invalid|failed)/i.test(errorMessage);
            if (critical) {
              ws.send(JSON.stringify({
                type: 'error',
                message: errorMessage
              }));
            }
          });

          tshark.on('close', (code) => {
            console.log('[wireshark] tshark exited', { code });
            if (code !== 0) {
              console.error(`tshark process exited with code ${code}`);
              ws.send(JSON.stringify({
                type: 'status',
                status: 'error',
                message: `tshark process exited with code ${code}`
              }));
            }
          });

          ws.send(JSON.stringify({
            type: 'status',
            status: 'capturing'
          }));
        } else if (data.action === 'stop') {
          console.log('[wireshark] stop requested');
          if (ws.captureProcess) {
            ws.captureProcess.kill('SIGKILL');
            ws.captureProcess = null;
            ws.send(JSON.stringify({
              type: 'status',
              status: 'stopped'
            }));
          }
        }
      } catch (e) {
        return;
      }
    });

    // Handle ping/pong for keepalive
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (ws.captureProcess) {
        ws.captureProcess.kill('SIGKILL');
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      console.log('[wireshark] WebSocket closed', { clientCount: wss.clients.size - 1 });
      clearInterval(heartbeatInterval);
      if (ws.captureProcess) {
        ws.captureProcess.kill('SIGKILL');
      }
    });

    // Initial status
    ws.send(JSON.stringify({
      type: 'status',
      status: 'idle'
    }));
  });

  return wss;
}
