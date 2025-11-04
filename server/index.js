import express from 'express';
import { exec } from 'node:child_process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promisify } from 'node:util';
import cors from 'cors';
import { existsSync, readdirSync } from 'node:fs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import axios from 'axios';

// ZAP Configuration
const ZAP_API_URL = process.env.ZAP_API_URL || 'http://localhost:8090';
const ZAP_API_KEY = process.env.ZAP_API_KEY || ''; // Default empty for no API key

// In-memory storage for active scans
const activeScans = new Map();

// Helper function to send requests to ZAP API
const zapRequest = async (endpoint, method = 'GET', params = {}) => {
  // Build the base URL with proper query parameters
  const url = new URL(`${ZAP_API_URL}${endpoint}`);
  
  // Add API key to URL parameters if it exists
  if (ZAP_API_KEY) {
    url.searchParams.append('apikey', ZAP_API_KEY);
  }

  // For GET requests, add params to URL
  if (method === 'GET') {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  try {
    const config = {
      method,
      url: url.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        ...(ZAP_API_KEY && { 'X-ZAP-API-Key': ZAP_API_KEY }) // Also send API key in header if needed
      },
      timeout: 30000, // 30 second timeout
      validateStatus: () => true // Always resolve the promise so we can handle errors manually
    };

    // For non-GET requests, send params in the body
    if (method !== 'GET' && Object.keys(params).length > 0) {
      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });
      config.data = formData;
    }

    const response = await axios(config);

    // Check for ZAP API errors
    if (response.status === 401) {
      throw new Error('ZAP API: Authentication failed. Please check your API key.');
    } else if (response.status === 404) {
      throw new Error('ZAP API: Endpoint not found. Check your ZAP API version.');
    } else if (response.status >= 400) {
      const errorMsg = response.data?.message || `ZAP API error: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return response.data;
  } catch (error) {
    console.error('ZAP API Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Could not connect to ZAP. Is ZAP running and accessible?');
    } else if (error.code === 'ECONNRESET') {
      throw new Error('Connection to ZAP was reset. The server may be overloaded or not responding properly.');
    }
    throw error;
  }
};

// Security: Validate inputs to prevent command injection
const isValidInput = (input) => {
  // Allow alphanumeric, basic URL-safe characters, and common SQLMap parameters
  return /^[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;= ]+$/.test(input);
};

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Simple in-memory runs store and helpers
const runsStore = [];
const RUNS_MAX = 500;
const nowMs = () => Date.now();
const newId = (prefix) => `${prefix}-${nowMs()}-${Math.random().toString(36).slice(2,8)}`;
const addRun = (tool, params) => {
  const run = {
    id: newId(tool),
    tool,
    params,
    startTime: nowMs(),
    status: 'running',
  };
  runsStore.push(run);
  if (runsStore.length > RUNS_MAX) runsStore.shift();
  return run;
};
const endRun = (id, status, data = {}) => {
  const idx = runsStore.findIndex(r => r.id === id);
  if (idx >= 0) {
    runsStore[idx] = { ...runsStore[idx], endTime: nowMs(), status, ...data };
    return runsStore[idx];
  }
  return null;
};

// List recent runs
app.get('/api/runs', (req, res) => {
  const { tool, status, limit = '100' } = req.query;
  let list = runsStore.slice().reverse();
  if (tool) list = list.filter(r => r.tool === tool);
  if (status) list = list.filter(r => r.status === status);
  const lim = Math.max(1, Math.min(500, parseInt(String(limit)) || 100));
  res.json({ runs: list.slice(0, lim) });
});

// Aggregated metrics
app.get('/api/metrics', (req, res) => {
  const byTool = {};
  for (const r of runsStore) {
    const t = r.tool;
    byTool[t] ||= { total: 0, success: 0, error: 0, durationMs: 0, countWithDuration: 0 };
    byTool[t].total++;
    if (r.status === 'success') byTool[t].success++;
    if (r.status === 'error') byTool[t].error++;
    if (r.startTime && r.endTime) { byTool[t].durationMs += (r.endTime - r.startTime); byTool[t].countWithDuration++; }
  }
  const tools = Object.entries(byTool).map(([tool, v]) => ({
    tool,
    total: v.total,
    success: v.success,
    error: v.error,
    avgDurationMs: v.countWithDuration ? Math.round(v.durationMs / v.countWithDuration) : 0,
  }));
  const totals = tools.reduce((acc, x) => {
    acc.total += x.total; acc.success += x.success; acc.error += x.error; acc.durationMs += x.avgDurationMs; return acc;
  }, { total: 0, success: 0, error: 0, durationMs: 0 });
  res.json({ tools, totals });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ status: 'Server is running!' });
});

// Create a hash file from plaintext for quick testing (for John raw-* formats)
app.post('/api/john/make-hash', (req, res) => {
  try {
    const { password, format } = req.body || {};
    if (!password) return res.status(400).json({ error: 'password is required' });
    const map = {
      'raw-sha1': 'sha1',
      'raw-sha256': 'sha256',
      'raw-sha512': 'sha512',
      'raw-md5': 'md5',
    };
    const algo = map[format] || map['raw-md5'];
    const digest = crypto.createHash(algo).update(String(password)).digest('hex');
    const dir = '/tmp/john-hashes';
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    const file = `${dir}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.txt`;
    fs.writeFileSync(file, `${digest}\n`, { encoding: 'utf8' });
    res.json({ success: true, hash: digest, path: file, format: format || 'raw-md5' });
  } catch (e) {
    console.error('make-hash error:', e);
    res.status(500).json({ error: 'Failed to create hash file' });
  }
});

// Services status endpoint
app.get('/api/services', async (req, res) => {
  try {
    const dvwaUrl = process.env.DVWA_URL || 'http://localhost/DVWA';
    const zapStatus = await checkStatus();

    let dvwa = { url: dvwaUrl, reachable: false, status: 0 };
    try {
      const resp = await axios.get(dvwaUrl, { timeout: 3000, validateStatus: () => true });
      dvwa = { url: dvwaUrl, reachable: resp.status < 500 && resp.status !== 0, status: resp.status };
    } catch {
      dvwa = { url: dvwaUrl, reachable: false, status: 0 };
    }

    const checkCmd = async (cmd) => {
      try { await execAsync(`which ${cmd}`); return true; } catch { return false; }
    };

    const tools = {
      sqlmap: await checkCmd('sqlmap'),
      john: await checkCmd('john'),
      hydra: await checkCmd('hydra'),
      nmap: await checkCmd('nmap'),
      tshark: await checkCmd('tshark'),
    };

    res.json({
      zap: zapStatus,
      dvwa,
      tools,
    });
  } catch (error) {
    console.error('Error in /api/services:', error);
    res.status(500).json({ error: 'Failed to get services status' });
  }
});

// List common wordlists from typical locations (top-level route)
app.get('/api/wordlists', (req, res) => {
  try {
    const bases = [
      '/usr/share/wordlists',
      '/usr/share/seclists',
      '/usr/share/dirb/wordlists',
      '/usr/share/dirbuster/wordlists',
      '/usr/share/nikto',
    ];
    const result = [];
    const exts = new Set(['.txt', '.lst', '.gz', '.dic', '.wordlist']);
    const maxDepth = 4;
    const pathJoin = (...p) => p.join('/').replace(/\/+/g, '/');
    const walk = (base, dir, depth) => {
      if (depth > maxDepth) return;
      let entries = [];
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        const full = pathJoin(dir, entry.name);
        if (entry.isDirectory()) {
          walk(base, full, depth + 1);
        } else if (entry.isFile()) {
          const dot = entry.name.lastIndexOf('.');
          const ext = dot >= 0 ? entry.name.slice(dot) : '';
          if (exts.has(ext)) {
            result.push({ name: full.replace(base + '/', ''), path: full });
          }
        }
      }
    };
    for (const base of bases) {
      if (existsSync(base)) walk(base, base, 0);
    }
    res.json({ wordlists: result });
  } catch (e) {
    console.error('Error listing wordlists:', e);
    res.status(500).json({ error: 'Failed to list wordlists' });
  }
});

// John the Ripper endpoint
app.post('/api/john', async (req, res) => {
  try {
    const { hashFile, wordlist, format = '', rules = false, extra = '' } = req.body || {};
    const run = addRun('john', { hashFile, wordlist, format, rules, extra });

    if (!hashFile) {
      endRun(run.id, 'error', { error: 'hashFile is required' });
      return res.status(400).json({ success: false, error: 'hashFile is required' });
    }
    if (!existsSync(hashFile)) {
      endRun(run.id, 'error', { error: `Hash file not found: ${hashFile}` });
      return res.status(400).json({ success: false, error: `Hash file not found: ${hashFile}` });
    }
    if (wordlist && !existsSync(wordlist)) {
      endRun(run.id, 'error', { error: `Wordlist not found: ${wordlist}` });
      return res.status(400).json({ success: false, error: `Wordlist not found: ${wordlist}` });
    }

    const parts = ['john'];
    if (wordlist) parts.push(`--wordlist="${wordlist}"`);
    if (format) parts.push(`--format=${format}`);
    if (rules) parts.push('--rules');
    if (extra && isValidInput(extra)) parts.push(extra);
    parts.push(`"${hashFile}"`);

    const cmd = parts.join(' ');
    console.log('Executing John:', cmd);

    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 20 });
    endRun(run.id, 'success', { command: cmd, metrics: { cracked: /guesses: (\d+)/i.test(stdout) ? Number((stdout.match(/guesses: (\d+)/i)||[])[1]) : undefined } });
    res.json({ success: true, command: cmd, stdout: stdout || '', stderr: stderr || '' });
  } catch (error) {
    console.error('Error executing John:', error);
    res.status(500).json({ success: false, error: error.message, stdout: error.stdout || '', stderr: error.stderr || '' });
  }
});

// SQLMap endpoint with streaming output
app.get('/api/sqlmap', (req, res) => {
  // Set headers for Server-Sent Events first
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const { targetUrl, method = 'GET', data, cookie } = req.query;

  // Input validation
  if (!targetUrl) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Target URL is required' })}\n\n`);
    return res.end();
  }

  // Security: Validate inputs to prevent command injection
  if (!isValidInput(targetUrl) || (data && !isValidInput(data)) || (cookie && !isValidInput(cookie))) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Invalid input parameters. Only alphanumeric characters and basic URL-safe characters are allowed.' })}\n\n`);
    return res.end();
  }

  try {
    // Build the SQLMap command
    let command = `sqlmap -u "${targetUrl}${method === 'GET' && data ? (targetUrl.includes('?') ? '&' : '?') + data : ''}"`;

    // Add POST data if method is POST
    if (method === 'POST' && data) {
      command += ` --data=\"${data}\"`;
    }

    // Add cookie if provided and ensure security=low is set for DVWA
    if (cookie) {
      let cookieValue = cookie;
      if (cookie.includes('PHPSESSID=') && !cookie.includes('security=')) {
        cookieValue = cookie.endsWith(';') ? `${cookie} security=low` : `${cookie}; security=low`;
      }
      command += ` --cookie=\"${cookieValue}\"`;
      console.log('Using cookie:', cookieValue.length > 50 ? `${cookieValue.substring(0, 30)}...` : cookieValue);
    }

    // Add essential parameters
    command += ' --batch --level=5 --risk=3 --crawl=0 --flush-session';

    // Optional: special handling for DVWA could be added here if needed

    console.log('Executing SQLMap command:', command);

    const run = addRun('sqlmap', { targetUrl, method, hasData: !!data, hasCookie: !!cookie });

    // Send initial message
    res.write(`data: ${JSON.stringify({ type: 'info', message: 'Starting SQLMap scan...' })}\n\n`);

    // Execute SQLMap with streaming output
    const child = exec(command, {
      maxBuffer: 1024 * 1024 * 10,
      encoding: 'utf8'
    });

    let bufferOut = '';
    let bufferErr = '';
    let lastOutput = '';

    const writeSSE = (type, message) => {
      res.write(`data: ${JSON.stringify({ type, message })}\n\n`);
    };

    // Stream stdout
    child.stdout.on('data', (chunk) => {
      lastOutput = chunk.toString();
      bufferOut += lastOutput;
      let lines = bufferOut.split('\n');
      bufferOut = lines.pop();
      lines.filter(Boolean).forEach((line) => writeSSE('output', line));
    });

    // Stream stderr
    child.stderr.on('data', (chunk) => {
      bufferErr += chunk.toString();
      let lines = bufferErr.split('\n');
      bufferErr = lines.pop();
      lines.filter(Boolean).forEach((line) => writeSSE('error', line));
    });

    child.on('close', (code) => {
      // Flush remaining buffers
      if (bufferOut) writeSSE('output', bufferOut);
      if (bufferErr) writeSSE('error', bufferErr);

      if (code === 0) {
        writeSSE('complete', 'SQLMap scan completed successfully');
      } else {
        writeSSE('error', `SQLMap process exited with code ${code}`);
      }

      if (!res.writableEnded) res.end();
      endRun(run.id, code === 0 ? 'success' : 'error', { exitCode: code, metrics: { lastBytes: lastOutput.length } });
    });

    // Handle client disconnect
    req.on('close', () => {
      if (!child.killed) child.kill();
    });
  } catch (error) {
    console.error('Error executing SQLMap:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to execute SQLMap: ' + error.message })}\n\n`);
    res.end();
  }
});

// Hydra password cracker endpoint
app.post('/api/hydra', async (req, res) => {
    const { target, port, service, username, wordlist, threads = 4 } = req.body;
    const run = addRun('hydra', { target, port, service, username, wordlist, threads });
    
    // Input validation
    if (!target || !port || !service || !username || !wordlist) {
        return res.status(400).json({
            success: false,
            error: 'Missing required parameters: target, port, service, username, and wordlist are required'
        });
    }

    // Security: Validate inputs to prevent command injection
    if (!isValidInput(target) || !isValidInput(port) || !isValidInput(service) || !isValidInput(username)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid input parameters. Only alphanumeric characters and basic URL-safe characters are allowed.'
        });
    }

    // Check if wordlist file exists
    if (!existsSync(wordlist)) {
        return res.status(400).json({
            success: false,
            error: `Wordlist file not found at: ${wordlist}`
        });
    }

    let hydraCommand;
    
    // Special handling for HTTP POST form (like DVWA)
    if (service === 'http-post-form') {
        const formPathValue = '/dvwa/login.php';  // Default DVWA login path
        const loginFieldValue = 'username';
        const passwordFieldValue = 'password';
        const loginData = `${loginFieldValue}=^USER^&${passwordFieldValue}=^PASS^&Login=Login`;
        const failureMessage = 'Login failed';
        
        hydraCommand = `hydra -l ${username} -P ${wordlist} -t ${threads} ${target} ${service} \"${formPathValue}:${loginData}:${failureMessage}\" -s ${port} -vV`;
    } else {
        // Standard Hydra command for other services
        hydraCommand = `hydra -l ${username} -P ${wordlist} -t ${threads} ${target} ${service} -s ${port} -vV`;
    }
    
    console.log('Executing Hydra command:', hydraCommand);
    
    try {
        // Execute the command
        const { stdout, stderr } = await execAsync(hydraCommand, { maxBuffer: 1024 * 1024 * 10 });
        
        endRun(run.id, 'success', { command: hydraCommand });
        res.json({
            success: true,
            code: 0,
            output: stdout || 'No output',
            error: stderr || null,
            command: hydraCommand
        });
    } catch (error) {
        console.error('Error executing Hydra:', error);
        endRun(run.id, 'error', { command: hydraCommand, code: error.code || 1 });
        res.status(500).json({
            success: false,
            code: error.code || 1,
            output: error.stdout || 'No output',
            error: error.stderr || error.message,
            command: hydraCommand
        });
    }
});

app.post('/api/scan-network', (req, res) => {
    const handleError = (error) => {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    };

    try {
        const { command, args = [] } = req.body;
        const run = addRun(command === 'nmap' ? 'nmap' : 'network-scan', { command, args });
        
        if (!command) {
            return res.status(400).json({ 
                success: false, 
                error: 'Command is required' 
            });
        }
        
        // If it's an nmap command, run it directly
        if (command === 'nmap') {
            const nmapCommand = `nmap ${args.join(' ')}`;
            console.log('Executing command:', nmapCommand);
            
            exec(nmapCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                try {
                    console.log('Command output:', { stdout, stderr, error });
                    
                    if (error) {
                        console.error('Command error:', error);
                        endRun(run.id, 'error', { exitCode: error.code || 1, stdout: stdout || '', stderr: stderr || '' });
                        return res.status(500).json({ 
                            success: false, 
                            error: error.message,
                            stderr: stderr || 'No error output',
                            stdout: stdout || 'No output'
                        });
                    }
                    
                    endRun(run.id, 'success', { exitCode: 0 });
                    res.json({ 
                        success: true, 
                        stdout: stdout || 'No output',
                        stderr: stderr || ''
                    });
                } catch (err) {
                    endRun(run.id, 'error', { error: String(err) });
                    handleError(err);
                }
            });
        } else {
            // Fallback to the Python script for other commands
            const scriptPath = path.join(__dirname, '../scripts/network_scanner.py');
            console.log('Executing script at:', scriptPath);
            
            exec(`python3 ${scriptPath}`, (error, stdout, stderr) => {
                try {
                    console.log('Script output:', { stdout, stderr, error });
                    
                    if (error) {
                        console.error('Script error:', error);
                        endRun(run.id, 'error', { exitCode: error.code || 1, stdout: stdout || '', stderr: stderr || '' });
                        return res.status(500).json({ 
                            success: false, 
                            error: error.message,
                            stderr: stderr || 'No error output',
                            stdout: stdout || 'No output'
                        });
                    }
                    
                    endRun(run.id, 'success', { exitCode: 0 });
                    res.json({ 
                        success: true, 
                        stdout: stdout || 'No output',
                        stderr: stderr || ''
                    });
                } catch (err) {
                    endRun(run.id, 'error', { error: String(err) });
                    handleError(err);
                }
            });
        }
    } catch (error) {
        handleError(error);
    }
});

// ZAP API Endpoints
app.post('/api/zap/scan', async (req, res) => {
  const { target, apikey = ZAP_API_KEY } = req.body;
  
  if (!target) {
    return res.status(400).json({ error: 'Target URL is required' });
  }

  try {
    // Start a new ZAP spider scan
    const spiderScan = await zapRequest('/JSON/spider/action/scan/', 'GET', {
      url: target,
      recurse: true,
      contextName: '',
      subtreeOnly: false
    });

    // Start an active scan
    const activeScan = await zapRequest('/JSON/ascan/action/scan/', 'GET', {
      url: target,
      recurse: true,
      inScopeOnly: false,
      scanPolicyName: 'Default Policy',
      method: 'GET',
      postData: ''
    });

    const scanId = `zap-${Date.now()}`;
    const scanData = {
      target,
      spiderScanId: spiderScan.scan,
      activeScanId: activeScan.scan,
      startTime: new Date().toISOString(),
      status: 'running',
      logs: [],
      runId: null
    };

    activeScans.set(scanId, scanData);
    
    // Initial scan info
    scanData.logs.push({
      type: 'info',
      message: `Starting ZAP scan for ${target}`,
      timestamp: new Date().toISOString()
    });

    // Start polling for scan status and create run record
    try {
      const run = addRun('zap', { target });
      scanData.runId = run.id;
    } catch {}
    // Start polling for scan status
    checkScanStatus(scanId);

    res.json({ 
      status: 'started',
      scanId,
      message: 'ZAP scan started successfully'
    });

  } catch (error) {
    console.error('ZAP scan error:', error);
    res.status(500).json({ 
      error: 'Failed to start ZAP scan',
      details: error.message 
    });
  }
});

app.get('/api/zap/status/:scanId', (req, res) => {
  const { scanId } = req.params;
  const scan = activeScans.get(scanId);
  
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  
  res.json({
    status: scan.status,
    logs: scan.logs.slice(-50), // Return last 50 log entries
    findings: scan.findings || { high: 0, medium: 0, low: 0, informational: 0 },
    startTime: scan.startTime,
    endTime: scan.endTime
  });
});

app.post('/api/zap/stop/:scanId', async (req, res) => {
  const { scanId } = req.params;
  const scan = activeScans.get(scanId);
  
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  
  try {
    // Stop active scan if running
    if (scan.activeScanId) {
      await zapRequest('/JSON/ascan/action/stop/', 'GET', { scanId: scan.activeScanId });
    }
    
    // Stop spider scan if running
    if (scan.spiderScanId) {
      await zapRequest('/JSON/spider/action/stop/', 'GET', { scanId: scan.spiderScanId });
    }
    
    scan.status = 'stopped';
    scan.endTime = new Date().toISOString();
    scan.logs.push({
      type: 'info',
      message: 'Scan stopped by user',
      timestamp: new Date().toISOString()
    });
    if (scan.runId) endRun(scan.runId, 'error', { reason: 'stopped' });
    
    res.json({ status: 'stopped' });
  } catch (error) {
    console.error('Error stopping scan:', error);
    res.status(500).json({ error: 'Failed to stop scan' });
  }
});

// Helper function to check scan status
async function checkScanStatus(scanId) {
  const scan = activeScans.get(scanId);
  if (!scan || scan.status !== 'running') return;

  try {
    // Check spider status
    const spiderStatus = await zapRequest('/JSON/spider/view/status/', 'GET', { scanId: scan.spiderScanId });
    
    // Check active scan status
    const ascanStatus = await zapRequest('/JSON/ascan/view/status/', 'GET', { scanId: scan.activeScanId });
    
    // Get alerts
    const alerts = await zapRequest('/JSON/core/view/alerts/', 'GET', { baseurl: scan.target });
    
    // Process alerts
    const findings = {
      high: 0,
      medium: 0,
      low: 0,
      informational: 0
    };
    
    if (alerts && alerts.alerts) {
      alerts.alerts.forEach(alert => {
        const risk = alert.risk.toLowerCase();
        if (risk === 'high') findings.high++;
        else if (risk === 'medium') findings.medium++;
        else if (risk === 'low') findings.low++;
        else findings.informational++;
      });
    }
    
    scan.findings = findings;
    
    // Add status update to logs
    scan.logs.push({
      type: 'info',
      message: `Spider: ${spiderStatus.status}% | Active Scan: ${ascanStatus.status}% | ` +
               `Findings: ${findings.high} High, ${findings.medium} Medium, ${findings.low} Low`,
      timestamp: new Date().toISOString()
    });
    
    // Check if scans are complete
    if (spiderStatus.status === '100' && ascanStatus.status === '100') {
      scan.status = 'completed';
      scan.endTime = new Date().toISOString();
      scan.logs.push({
        type: 'info',
        message: 'Scan completed successfully!',
        timestamp: new Date().toISOString()
      });
      if (scan.runId) endRun(scan.runId, 'success', { spiderScanId: scan.spiderScanId, activeScanId: scan.activeScanId });
      
      // Generate report
      try {
        const report = await zapRequest('/OTHER/core/other/htmlreport/', 'GET', {});
        scan.report = report;
      } catch (error) {
        console.error('Error generating report:', error);
        scan.logs.push({
          type: 'error',
          message: 'Failed to generate report',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Schedule next status check
      setTimeout(() => checkScanStatus(scanId), 5000);
    }
  } catch (error) {
    console.error('Error checking scan status:', error);
    scan.logs.push({
      type: 'error',
      message: `Error checking scan status: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    if (scan.runId) endRun(scan.runId, 'error', { error: String(error?.message || error) });
    
    // Retry after delay
    setTimeout(() => checkScanStatus(scanId), 10000);
  }
}

// Import ZAP server controller
import { startZAP, stopZAP, checkStatus } from './zap-server.js';

// Configure CORS
const allowedOrigins = [
  'http://localhost:8080', // Add your frontend URL
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
];

// Enable CORS for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Manage Python Mistral service (uvicorn)
let aiPyProc = null;
const aiPyHost = '127.0.0.1';
const aiPyPort = 7070;

app.get('/api/ai/python/status', async (req, res) => {
  try {
    const health = await fetch(`http://${aiPyHost}:${aiPyPort}/health`).then(r => r.json()).catch(() => null);
    res.json({ running: !!health, pid: aiPyProc?.pid || null, health });
  } catch (e) {
    res.json({ running: false, pid: aiPyProc?.pid || null });
  }
});

app.post('/api/ai/python/start', async (req, res) => {
  if (aiPyProc && !aiPyProc.killed) {
    return res.json({ status: 'already_running', pid: aiPyProc.pid });
  }
  const args = ['scripts.mistral_service:app', '--host', aiPyHost, '--port', String(aiPyPort)];
  const launch = (cmd, a) => {
    const p = spawn(cmd, a, { stdio: 'inherit', env: process.env });
    p.on('exit', (code) => {
      aiPyProc = null;
      console.log(`[ai-python] exited with code ${code}`);
    });
    p.on('error', (err) => {
      console.error('[ai-python] spawn error:', err);
    });
    return p;
  };
  try {
    // 1) Prefer venv python if present
    const venvPy = path.join(process.cwd(), '.venv', 'bin', 'python');
    if (existsSync(venvPy)) {
      console.log('[ai-python] starting via venv:', venvPy);
      aiPyProc = launch(venvPy, ['-m', 'uvicorn', ...args]);
    } else {
      // 2) Try system python3 -m uvicorn
      try {
        console.log('[ai-python] venv not found, trying python3 -m uvicorn');
        aiPyProc = launch('python3', ['-m', 'uvicorn', ...args]);
      } catch (e1) {
        // 3) Fallback to uvicorn on PATH
        console.warn('python3 not working, trying uvicorn directly');
        aiPyProc = launch('uvicorn', args);
      }
    }
    if (!aiPyProc || aiPyProc.killed) throw new Error('Failed to spawn uvicorn');
    return res.json({ status: 'starting', pid: aiPyProc.pid, host: aiPyHost, port: aiPyPort });
  } catch (e) {
    console.error('Failed to start Python AI service:', e);
    return res.status(500).json({ error: 'failed_to_start', details: String(e?.message || e) });
  }
});

app.post('/api/ai/python/stop', async (req, res) => {
  try {
    if (aiPyProc && !aiPyProc.killed) {
      aiPyProc.kill('SIGTERM');
      return res.json({ status: 'stopping' });
    }
    res.json({ status: 'not_running' });
  } catch (e) {
    res.status(500).json({ error: 'failed_to_stop', details: String(e?.message || e) });
  }
});

// AI chat via Mistral proxy
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages = [], model = 'mistral-small-latest', temperature = 0.3 } = req.body || {};
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'MISTRAL_API_KEY is not set' });
    }
    const payload = {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature,
      stream: false,
    };
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: 'Mistral API error', details: text });
    }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || '';
    res.json({ content, raw: data });
  } catch (err) {
    res.status(500).json({ error: 'Chat failed', details: String(err?.message || err) });
  }
});

// ZAP Server Routes
app.get('/api/zap/status', async (req, res) => {
  try {
    const status = await checkStatus();
    res.json(status);
  } catch (error) {
    console.error('Error checking ZAP status:', error);
    res.status(500).json({ 
      error: 'Failed to check ZAP status',
      details: error.message 
    });
  }
});

app.post('/api/zap/start', async (req, res) => {
  try {
    const result = await startZAP();
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to start ZAP' 
      });
    }
  } catch (error) {
    console.error('Error starting ZAP:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start ZAP',
      details: error.message 
    });
  }
});

// Spider scan endpoints
app.post('/api/zap/spider/scan', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Start spider scan
    const scanResult = await zapRequest('/JSON/spider/action/scan/', 'GET', {
      url,
      recurse: true,
      subtreeOnly: true,
      contextName: ''
    });

    res.json({ 
      success: true, 
      scanId: scanResult.scan,
      message: 'Spider scan started successfully'
    });
  } catch (error) {
    console.error('Error starting spider scan:', error);
    res.status(500).json({ 
      error: 'Failed to start spider scan',
      details: error.response?.data || error.message 
    });
  }
});

app.get('/api/zap/spider/status/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    const status = await zapRequest('/JSON/spider/view/status/', 'GET', { scanId });
    res.json({ 
      status: status.status === '100' ? 'completed' : 'running',
      progress: parseInt(status.status) || 0
    });
  } catch (error) {
    console.error('Error getting spider status:', error);
    res.status(500).json({ 
      error: 'Failed to get spider status',
      details: error.response?.data || error.message 
    });
  }
});

// Active scan endpoints
app.post('/api/zap/ascan/scan', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Start active scan
    const scanResult = await zapRequest('/JSON/ascan/action/scan/', 'GET', {
      url,
      recurse: true,
      inScopeOnly: true,
      scanPolicyName: 'Default Policy',
      method: 'GET',
      postData: ''
    });

    res.json({ 
      success: true, 
      scanId: scanResult.scan,
      message: 'Active scan started successfully'
    });
  } catch (error) {
    console.error('Error starting active scan:', error);
    res.status(500).json({ 
      error: 'Failed to start active scan',
      details: error.response?.data || error.message 
    });
  }
});

app.get('/api/zap/ascan/status/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    const status = await zapRequest('/JSON/ascan/view/status/', 'GET', { scanId });
    res.json({ 
      status: status.status === '100' ? 'completed' : 'running',
      progress: parseInt(status.status) || 0
    });
  } catch (error) {
    console.error('Error getting active scan status:', error);
    res.status(500).json({ 
      error: 'Failed to get active scan status',
      details: error.response?.data || error.message 
    });
  }
});

// Get alerts
app.get('/api/zap/alerts', async (req, res) => {
  try {
    const { baseurl = '', riskId = '', start = 0, count = 100 } = req.query;
    const alerts = await zapRequest('/JSON/alert/view/alerts/', 'GET', {
      baseurl,
      riskId,
      start,
      count
    });
    
    res.json(alerts.alerts || []);
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({ 
      error: 'Failed to get alerts',
      details: error.response?.data || error.message 
    });
  }
});

app.post('/api/zap/stop', async (req, res) => {
  try {
    const result = await stopZAP();
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to stop ZAP' 
      });
    }
  } catch (error) {
    console.error('Error stopping ZAP:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to stop ZAP',
      details: error.message 
    });
  }
});

// Network interfaces endpoint
app.get('/api/network/interfaces', (req, res) => {
  try {
    const sysNetPath = '/sys/class/net';
    let interfaces = [];
    try {
      interfaces = readdirSync(sysNetPath, { withFileTypes: true })
        .filter((d) => d.isSymbolicLink() || d.isDirectory())
        .map((d) => d.name)
        .filter((n) => n && n.length > 0);
    } catch (e) {
      console.warn('Falling back to defaults; unable to read /sys/class/net:', e?.message || e);
      interfaces = ['eth0', 'lo'];
    }
    console.log('Returning network interfaces:', interfaces);
    res.json({ interfaces });
  } catch (error) {
    console.error('Error in /api/network/interfaces:', error);
    res.status(500).json({ error: 'Failed to get network interfaces' });
  }
});

// Get ZAP configuration
app.get('/api/zap/config', (req, res) => {
  console.log('Fetching ZAP config...');
  const zapConfig = {
    zapApiUrl: process.env.ZAP_API_URL || `http://localhost:${process.env.ZAP_PORT || 8080}`,
    hasApiKey: !!process.env.ZAP_API_KEY
  };
  console.log('ZAP config:', zapConfig);
  res.json(zapConfig);
});

// Import WebSocket server setup
import { setupWiresharkWebSocket } from './wireshark.js';

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`ZAP API URL: ${ZAP_API_URL}`);
  if (ZAP_API_KEY) {
    console.log('ZAP API Key: **********');
  } else {
    console.log('ZAP API Key: Not set (using default)');
  }
});

// Setup WebSocket server
setupWiresharkWebSocket(server, { addRun, endRun });

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    }
});
