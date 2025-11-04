import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Terminal, Server, Power, RefreshCw, AlertTriangle, Info, Shield, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ServerStatus {
  running: boolean;
  version?: string;
  error?: string;
  loading?: boolean;
}

interface LogEntry {
  type: 'command' | 'output' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

interface ZapConfig {
  zapApiUrl: string;
  hasApiKey: boolean;
}

const ZAPTool = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [status, setStatus] = useState('Loading ZAP configuration...');
  const [zapConfig, setZapConfig] = useState<ZapConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [vulnerabilities, setVulnerabilities] = useState<Array<{
    id: string;
    name: string;
    risk: string;
    confidence: string;
    url: string;
    description: string;
    solution?: string;
    reference?: string;
  }>>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({ 
    running: false, 
    loading: false 
  });
  const logEndRef = useRef<HTMLDivElement>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout>();

  // Check ZAP server status
  // Helper function to safely parse JSON responses
  const safeJsonParse = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON response:', text);
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
    }
  };

  const checkZAPStatus = async () => {
    try {
      const backendUrl = 'http://localhost:3001';
      // First check if our backend is running
      const response = await fetch(`${backendUrl}/api/zap/status`);
      
      if (!response.ok) {
        // If the backend is down, check ZAP directly as a fallback
        try {
          const zapResponse = await fetch('http://localhost:8090/JSON/core/view/version', {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (zapResponse.ok) {
            // ZAP is running but our backend might not be properly connected
            return setServerStatus(prev => ({
              ...prev,
              running: true,
              version: 'ZAP running (direct connection)',
              error: 'Backend connection issue',
              loading: false
            }));
          }
        } catch (zapError) {
          console.error('Direct ZAP connection failed:', zapError);
        }
        
        const errorText = await response.text();
        console.error('ZAP status check failed:', errorText);
        throw new Error(`ZAP server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await safeJsonParse(response);
      
      if (data) {
        setServerStatus(prev => ({
          ...prev,
          running: data.running,
          version: data.version,
          error: undefined,
          loading: false
        }));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error checking ZAP status:', error);
      setServerStatus(prev => ({
        ...prev,
        running: false,
        error: 'ZAP server is not running',
        version: undefined,
        loading: false
      }));
    }
  };

  // Start/Stop ZAP server
  const toggleZAPServer = async () => {
    setServerStatus(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const backendUrl = 'http://localhost:3001';
      const endpoint = serverStatus.running ? 'stop' : 'start';
      
      // First try to check if ZAP is already running
      if (!serverStatus.running) {
        try {
          const zapResponse = await fetch('http://localhost:8090/JSON/core/view/version', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          
          if (zapResponse.ok) {
            // ZAP is already running, update status
            return setServerStatus(prev => ({
              ...prev,
              running: true,
              version: 'ZAP already running',
              loading: false
            }));
          }
        } catch (e) {
          // Ignore, ZAP is not running
        }
      }
      
      // If we get here, proceed with normal start/stop
      const response = await fetch(`${backendUrl}/api/zap/${endpoint}`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        let errorMessage = 'Failed to toggle ZAP server';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Poll for status update
      await checkZAPStatus();
      
    } catch (error) {
      console.error('Error in toggleZAPServer:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setServerStatus(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
    }
  };

  // Set up status polling
  useEffect(() => {
    checkZAPStatus();
    
    // Poll every 5 seconds
    statusCheckInterval.current = setInterval(checkZAPStatus, 5000);
    
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (type: LogEntry['type'], message: string) => {
    const newLog = { type, message, timestamp: new Date() };
    setLogs(prev => [...prev, newLog]);
  };

  // Fetch ZAP configuration on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Use the full URL in development to avoid CORS issues
        const apiUrl = import.meta.env.DEV 
          ? `http://localhost:${import.meta.env.VITE_SERVER_PORT || 3001}/api/zap/config`
          : '/api/zap/config';
          
        console.log('Fetching ZAP config from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'include',
          mode: 'cors'
        });
        
        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
          }
          throw new Error(errorMessage);
        }
        
        const config = await response.json();
        console.log('Received ZAP config:', config);
        setZapConfig(config);
        setStatus('Ready to scan');
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Failed to fetch ZAP config:', {
          error: err,
          message: errorMessage,
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(`Error loading ZAP configuration: ${errorMessage}`);
        setStatus('Error loading configuration');
      }
    };

    fetchConfig();
  }, []);

  const generateMockVulnerabilities = () => {
    const severities = ['High', 'Medium', 'Low', 'Informational'];
    const types = [
      'Cross-Site Scripting (Reflected)',
      'SQL Injection',
      'Cross-Site Request Forgery',
      'Server-Side Request Forgery',
      'Insecure Direct Object Reference',
      'Security Headers Missing',
      'Information Disclosure'
    ];
    
    const count = Math.floor(Math.random() * 5) + 1; // 1-5 vulnerabilities
    const vulnerabilities = [];
    
    for (let i = 0; i < count; i++) {
      vulnerabilities.push({
        id: `VULN-${1000 + i}`,
        type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        url: `${targetUrl}/vulnerable/endpoint${i}`,
        description: 'This is a sample vulnerability description. In a real scan, this would contain details about the specific vulnerability found.'
      });
    }
    
    return vulnerabilities;
  };

  const generateReport = (vulnerabilities: any[]) => {
    if (vulnerabilities.length === 0) {
      return '\n=== Scan Report ===\n\nNo vulnerabilities found. The target appears to be secure.\n';
    }
    
    let report = '\n=== Scan Report ===\n\n';
    report += `Scan completed on: ${new Date().toLocaleString()}\n`;
    report += `Target: ${targetUrl}\n`;
    report += `Total vulnerabilities found: ${vulnerabilities.length}\n\n`;
    
    // Group by severity
    const bySeverity = vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    report += 'Vulnerability Summary:\n';
    Object.entries(bySeverity).forEach(([severity, count]) => {
      report += `  ${severity}: ${count}\n`;
    });
    
    // List all vulnerabilities
    report += '\nVulnerability Details:\n';
    vulnerabilities.forEach((vuln, index) => {
      report += `\n${index + 1}. [${vuln.severity}] ${vuln.type}\n`;
      report += `   URL: ${vuln.url}\n`;
      report += `   Description: ${vuln.description}\n`;
    });
    
    report += '\n=== End of Report ===\n';
    return report;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;
    
    setIsScanning(true);
    setStatus(`Scanning ${targetUrl}...`);
    addLog('info', `Starting ZAP scan for: ${targetUrl}`);
    
    try {
      // Start the spider scan
      addLog('info', 'Starting spider scan...');
      const spiderResponse = await fetch(`http://localhost:3001/api/zap/spider/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      
      if (!spiderResponse.ok) {
        const contentType = spiderResponse.headers.get('content-type') || '';
        let errorMessage = `HTTP error! status: ${spiderResponse.status} ${spiderResponse.statusText}`;
        
        if (contentType.includes('application/json')) {
          try {
            const errorData = await spiderResponse.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If we can't parse JSON, fall through to text parsing
          }
        }
        
        if (contentType.includes('text/html')) {
          const text = await spiderResponse.text();
          console.error('HTML response from server:', text);
          errorMessage = 'Server returned an HTML error page. Check if the ZAP server is running and accessible.';
        }
        
        throw new Error(errorMessage);
      }
      
      const { scanId: spiderScanId } = await spiderResponse.json();
      addLog('info', `Spider scan started with ID: ${spiderScanId}`);
      
      // Poll spider scan status
      let spiderComplete = false;
      while (!spiderComplete) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusRes = await fetch(`http://localhost:3001/api/zap/spider/status/${spiderScanId}`);
      
      if (!statusRes.ok) {
        const errorText = await statusRes.text();
        throw new Error(`Failed to get spider scan status: ${errorText}`);
      }
      
      const statusText = await statusRes.text();
      let status;
      try {
        status = JSON.parse(statusText);
      } catch (e) {
        console.error('Failed to parse status response:', statusText);
        throw new Error(`Invalid response format from server: ${statusText.substring(0, 100)}...`);
      }
        
        if (status.status === 'completed') {
          spiderComplete = true;
          addLog('info', 'Spider scan completed');
        } else if (status.status === 'error') {
          throw new Error('Spider scan failed: ' + (status.error || 'Unknown error'));
        } else {
          addLog('info', `Spider progress: ${status.progress}%`);
        }
      }
      
      // Start the active scan
      addLog('info', 'Starting active scan...');
      const activeScanResponse = await fetch(`http://localhost:3001/api/zap/ascan/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      
      if (!activeScanResponse.ok) {
        const error = await activeScanResponse.json();
        throw new Error(error.error || 'Failed to start active scan');
      }
      
      const { scanId: activeScanId } = await activeScanResponse.json();
      addLog('info', `Active scan started with ID: ${activeScanId}`);
      
      // Poll active scan status
      let scanComplete = false;
      while (!scanComplete) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusRes = await fetch(`http://localhost:3001/api/zap/ascan/status/${activeScanId}`);
        const status = await statusRes.json();
        
        if (status.status === 'completed') {
          scanComplete = true;
          addLog('info', 'Active scan completed');
        } else if (status.status === 'error') {
          throw new Error('Active scan failed: ' + (status.error || 'Unknown error'));
        } else {
          addLog('info', `Active scan progress: ${status.progress}%`);
        }
      }
      
      // Get the scan results
      addLog('info', 'Fetching scan results...');
      const alertsRes = await fetch(`http://localhost:3001/api/zap/alerts`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!alertsRes.ok) {
        const contentType = alertsRes.headers.get('content-type') || '';
        let errorMessage = `Failed to fetch scan results: ${alertsRes.status} ${alertsRes.statusText}`;
        
        if (contentType.includes('application/json')) {
          try {
            const errorData = await alertsRes.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
        } else {
          const errorText = await alertsRes.text();
          console.error('Non-JSON error response:', errorText);
          errorMessage = `Server error: ${errorText.substring(0, 200)}...`;
        }
        
        throw new Error(errorMessage);
      }
      
      const alerts = await alertsRes.json();
      
      // Store vulnerabilities for the UI
      setVulnerabilities(alerts);
      
      // Generate a report
      if (alerts.length === 0) {
        addLog('info', 'No vulnerabilities found');
      } else {
        addLog('info', `Found ${alerts.length} potential issues`);
        setActiveTab('results');
      }
      
      setStatus('Scan completed');
      addLog('info', 'Scan completed successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      addLog('error', `Scan failed: ${errorMessage}`);
      setStatus('Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const renderRiskBadge = (risk: string) => {
    const riskLower = risk.toLowerCase();
    let variant: 'destructive' | 'warning' | 'default' | 'secondary' = 'default';
    let icon = null;
    
    switch (riskLower) {
      case 'high':
        variant = 'destructive';
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        break;
      case 'medium':
        variant = 'warning';
        icon = <AlertCircle className="h-3 w-3 mr-1" />;
        break;
      case 'low':
        variant = 'default';
        icon = <Info className="h-3 w-3 mr-1" />;
        break;
      default:
        variant = 'secondary';
        icon = <Shield className="h-3 w-3 mr-1" />;
    }
    
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Server Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-6 w-6 text-primary" />
              <CardTitle>ZAP Server</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${
                serverStatus.running ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm font-medium">
                {serverStatus.running ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Version:</span>
              <span className="text-sm font-mono">
                {serverStatus.version || 'Not available'}
              </span>
            </div>
            {serverStatus.error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {serverStatus.error}
              </div>
            )}
          </div>
          
          <Button
            onClick={toggleZAPServer}
            disabled={serverStatus.loading}
            className="w-full"
          >
            {serverStatus.loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {serverStatus.running ? 'Stopping...' : 'Starting...'}
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                {serverStatus.running ? 'Stop Server' : 'Start Server'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Scanner Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            OWASP ZAP Scanner
          </CardTitle>
          <CardDescription>
            Web application security scanner for finding vulnerabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL</Label>
              <div className="flex gap-2">
                <Input
                  id="targetUrl"
                  type="url"
                  placeholder="https://example.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={!zapConfig || isScanning}>
                  {isScanning ? 'Scanning...' : 'Start Scan'}
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>Status: {status}</p>
              {zapConfig && (
                <p className="text-xs mt-1">
                  Connected to ZAP API at http://localhost:8090 
                  {zapConfig.hasApiKey ? ' (with API key)' : ' (no API key)'}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Scan Results */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="py-3 pb-0">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="results" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Results
                  {vulnerabilities.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {vulnerabilities.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Logs
                  {logs.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {logs.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLogs([])}
                  disabled={logs.length === 0}
                >
                  Clear Logs
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <TabsContent value="results" className="m-0">
              <div className="h-96 overflow-y-auto p-4">
                {vulnerabilities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Shield className="h-12 w-12 mb-4 opacity-30" />
                    <p className="text-lg font-medium">No vulnerabilities found</p>
                    <p className="text-sm">Start a scan to check for security issues</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Risk</TableHead>
                        <TableHead>Vulnerability</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead className="text-right">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vulnerabilities.map((vuln, index) => (
                        <TableRow key={index} className="cursor-pointer hover:bg-accent/50">
                          <TableCell>{renderRiskBadge(vuln.risk)}</TableCell>
                          <TableCell className="font-medium">{vuln.name}</TableCell>
                          <TableCell className="max-w-[300px] truncate" title={vuln.url}>
                            {vuln.url}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">
                              {vuln.confidence.charAt(0).toUpperCase() + vuln.confidence.slice(1).toLowerCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="logs" className="m-0">
              <div className="bg-black text-green-400 font-mono text-sm p-4 h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500 italic">
                    No logs yet. Start a scan to see the output here.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div 
                        key={index} 
                        className={`flex ${log.type === 'error' ? 'text-red-400' : ''}`}
                      >
                        <span className="text-gray-500 mr-2 w-12 shrink-0">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="text-yellow-400 mr-2 w-16 shrink-0">
                          [{log.type.toUpperCase()}]
                        </span>
                        <span className="whitespace-pre-wrap break-words">
                          {log.message}
                        </span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default ZAPTool;
