import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';

function normalizeDisplayFilter(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let f = raw.trim();
    // Map common terms
    f = f.replace(/\bhttps\b/gi, 'tls');
    // Convert 'port N' to display filter equivalent
    f = f.replace(/\bport\s+(\d+)\b/gi, '(tcp.port == $1 or udp.port == $1)');
    // Collapse excessive whitespace
    f = f.replace(/\s+/g, ' ');
    return f;
}

export function setupWiresharkWebSocket(server, runApi = {}) {
    const { addRun, endRun } = runApi || {};
    const wss = new WebSocketServer({ noServer: true });

    // Handle upgrade on the HTTP server
    server.on('upgrade', (request, socket, head) => {
        if (request.url === '/api/wireshark/ws') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
    });

    // Handle new WebSocket connections
    wss.on('connection', (ws) => {
        ws.isAlive = true;
        let captureProcess = null;
        let currentRunId = null;

        // Heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
            if (!ws.isAlive) {
                ws.terminate();
                return;
            }
            ws.isAlive = false;
            ws.ping();
        }, 30000);

        // Handle incoming messages
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);

                if (data.action === 'start') {
                    // Stop any existing capture
                    if (captureProcess) {
                        captureProcess.kill('SIGKILL');
                    }

                    // Start new capture using deterministic field output
                    const explicitCount = Number.isFinite(+data.count) && +data.count > 0 ? String(+data.count) : '';
                    const args = [
                        '-i', data.interface || 'eth0',
                        '-l',
                        '-T', 'fields',
                        '-e', 'frame.time',
                        '-e', 'frame.len',
                        '-e', 'tcp.len',
                        '-e', 'ip.src',
                        '-e', 'ip.dst',
                        '-e', 'tcp.srcport',
                        '-e', 'tcp.dstport',
                        '-e', 'udp.srcport',
                        '-e', 'udp.dstport',
                        '-e', '_ws.col.Protocol',
                        '-e', '_ws.col.Info',
                        '-E', 'separator=\t',
                        '-E', 'quote=d',
                        '-E', 'occurrence=f'
                    ];

                    // If a positive count was explicitly requested, add '-c'
                    if (explicitCount) {
                        args.splice(4, 0, '-c', explicitCount);
                    }

                    // Add filter if provided: treat as display filter by default for robustness
                    if (data.filter && String(data.filter).trim() !== '') {
                        const rawFilter = String(data.filter).trim();
                        const normalized = normalizeDisplayFilter(rawFilter);
                        args.push('-Y', normalized);
                        console.log('[wireshark] using display filter', { raw: rawFilter, normalized });
                    }

                    const esc = (s) => {
                        const str = String(s);
                        return /[\s"'()]/.test(str) ? `'${str.replace(/'/g, "'\\''")}'` : str;
                    };
                    const cmdString = ['tshark', ...args].map(esc).join(' ');
                    console.log('[wireshark] spawning tshark', { args });
                    console.log('[wireshark] command', cmdString);
                    captureProcess = spawn('tshark', args);

                    // Start run logging if available
                    try {
                        if (typeof addRun === 'function') {
                            const run = addRun('wireshark', { interface: data.interface || 'eth0', filter: data.filter || '', count: explicitCount || undefined });
                            currentRunId = run?.id || null;
                        }
                    } catch {}
                    
                    const toPacketFromFields = (line) => {
                        try {
                            const parts = line.split('\t');
                            // Keep order in sync with args -e
                            const [time, frameLen, tcpLen, ipSrc, ipDst, tcpSrc, tcpDst, udpSrc, udpDst, proto, colInfo] = parts.map(p => (p || '').replace(/^\"|\"$/g, ''));
                            const srcPort = tcpSrc || udpSrc;
                            const dstPort = tcpDst || udpDst;
                            const source = [ipSrc, srcPort].filter(Boolean).join(':') || ipSrc || srcPort || '';
                            const destination = [ipDst, dstPort].filter(Boolean).join(':') || ipDst || dstPort || '';
                            const protocol = (proto || (tcpSrc || tcpDst ? 'tcp' : (udpSrc || udpDst ? 'udp' : 'unknown'))).toLowerCase() === 'tls' ? 'https' : (proto || 'unknown');
                            const length = Number(tcpLen || frameLen || '0') || 0;
                            const info = colInfo || [source, '→', destination].filter(Boolean).join(' ');
                            const timestamp = time || new Date().toISOString();
                            return { timestamp, source, destination, protocol, length, info };
                        } catch {
                            return null;
                        }
                    };

                    captureProcess.stdout.on('data', (data) => {
                        try {
                            const output = data.toString();
                            const packets = [];
                            for (const line of output.split('\n')) {
                                const trimmed = line.trim();
                                if (!trimmed) continue;
                                const mapped = toPacketFromFields(trimmed);
                                if (mapped) packets.push(mapped);
                            }
                            if (packets.length > 0) {
                                ws.send(JSON.stringify({ type: 'packets', packets }));
                                for (const mapped of packets) {
                                    console.log(`[wireshark] ${mapped.timestamp} ${mapped.protocol.toUpperCase()} ${mapped.source} -> ${mapped.destination} len=${mapped.length} ${mapped.info || ''}`);
                                }
                            }
                        } catch (error) {
                            console.error('Error processing packet data:', error);
                        }
                    });

                    captureProcess.stderr.on('data', (data) => {
                        const msg = data.toString();
                        const critical = /(invalid|error|permission denied|no such device|unexpected|failed)/i.test(msg);
                        if (critical) {
                            console.error('tshark error:', msg);
                        } else {
                            console.log('tshark stderr:', msg.trim());
                        }
                    });

                    captureProcess.on('close', (code) => {
                        console.log(`tshark process exited with code ${code}`);
                        captureProcess = null;
                        try {
                            if (currentRunId && typeof endRun === 'function') {
                                endRun(currentRunId, code === 0 ? 'success' : 'error', { exitCode: code });
                            }
                        } catch {}
                        if (code === 0) {
                            try { ws.send(JSON.stringify({ type: 'status', status: 'capture_stopped' })); } catch {}
                        }
                    });

                    ws.send(JSON.stringify({
                        type: 'status',
                        status: 'capture_started',
                        interface: data.interface || 'eth0'
                    }));
                } else if (data.action === 'stop') {
                    if (captureProcess) {
                        captureProcess.kill('SIGKILL');
                        captureProcess = null;
                        try {
                            if (currentRunId && typeof endRun === 'function') {
                                endRun(currentRunId, 'success', { reason: 'stopped' });
                            }
                        } catch {}
                        ws.send(JSON.stringify({
                            type: 'status',
                            status: 'capture_stopped'
                        }));
                    }
                }
            } catch (_) {
                // Ignore non-JSON messages
            }
        });

        // Handle pong responses
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Clean up on connection close
        ws.on('close', () => {
            clearInterval(heartbeatInterval);
            if (captureProcess) {
                captureProcess.kill('SIGKILL');
            }
            try {
                if (currentRunId && typeof endRun === 'function') {
                    endRun(currentRunId, 'error', { reason: 'client_disconnected' });
                }
            } catch {}
        });

        // Send initial connection confirmation
        ws.send(JSON.stringify({
            type: 'status',
            status: 'connected'
        }));
    });

    return wss;
}
