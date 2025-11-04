import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, Zap } from "lucide-react";

interface LogEntry {
  type: 'command' | 'output' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

const SQLMapTool = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [data, setData] = useState('');
  const [cookie, setCookie] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    // Only auto-scroll if we're not near the top of the log
    if (logEndRef.current) {
      const logContainer = logEndRef.current.parentElement;
      if (logContainer) {
        const isScrolledToBottom = 
          logContainer.scrollHeight - logContainer.scrollTop <= logContainer.clientHeight + 100;
        
        if (isScrolledToBottom) {
          logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [logs]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const setupDVVATest = () => {
    setTargetUrl('http://localhost/DVWA/vulnerabilities/sqli/');
    setMethod('GET');
    setData('id=1&Submit=Submit');
    addLog('output', 'DVWA SQL Injection test page loaded. Please enter your PHPSESSID cookie and adjust parameters as needed.');
    addLog('info', 'To get your PHPSESSID: 1. Log in to DVWA 2. Open Developer Tools (F12) 3. Go to Application/Storage 4. Find PHPSESSID in Cookies');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsRunning(true);
    setLogs([]);
    
    // Basic input validation
    if (!targetUrl) {
      addLog('error', 'Target URL is required');
      setIsLoading(false);
      setIsRunning(false);
      return;
    }

    addLog('info', 'Initiating SQLMap scan...');
    addLog('info', 'This may take some time depending on the target and options selected.');

    try {
      // Create a new EventSource for Server-Sent Events with all parameters in the URL
      const params = new URLSearchParams({
        targetUrl,
        method,
        ...(method === 'POST' && data ? { data } : {}),
        ...(cookie ? { cookie } : {})
      });

      const eventSource = new EventSource(`http://localhost:3001/api/sqlmap?${params}`);
      
      // Set a flag to track if we've received the first message
      let hasReceivedData = false;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        addLog('info', 'Connected to SQLMap service...');
      };

      eventSource.onmessage = (event) => {
        try {
          hasReceivedData = true;
          const data = JSON.parse(event.data);
          
          if (data.type === 'complete') {
            addLog('output', '\nSQLMap scan completed!');
            eventSource.close();
            setIsLoading(false);
            setIsRunning(false);
          } else if (data.message) {
            addLog(data.type, data.message);
          }
        } catch (err) {
          console.error('Error parsing event data:', err);
          addLog('error', 'Error processing server response');
        }
      };

      eventSource.onerror = (error: Event) => {
        console.error('EventSource error:', error);
        if (!hasReceivedData) {
          addLog('error', 'Failed to connect to the SQLMap service. Make sure the server is running.');
        } else {
          addLog('error', 'Connection to server was closed');
        }
        eventSource.close();
        setIsLoading(false);
        setIsRunning(false);
      };

      // Set a timeout to check if we're receiving data
      const connectionTimeout = setTimeout(() => {
        if (!hasReceivedData) {
          addLog('error', 'No response from server. The SQLMap service might not be running.');
          eventSource.close();
          setIsLoading(false);
          setIsRunning(false);
        }
      }, 5000);

      // Cleanup function
      return () => {
        clearTimeout(connectionTimeout);
        if (eventSource.readyState !== eventSource.CLOSED) {
          eventSource.close();
        }
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error:', errorMessage);
      addLog('error', `Error: ${errorMessage}`);
      setIsLoading(false);
      setIsRunning(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>SQLMap Scanner</CardTitle>
              <CardDescription>
                Automatic SQL injection and database takeover tool
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setupDVVATest}
                disabled={isLoading}
                className="hidden sm:flex"
              >
                <Database className="mr-2 h-4 w-4" />
                Test DVWA SQLi
              </Button>
              {isRunning && (
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-sm text-muted-foreground hidden sm:inline">Scanning</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md bg-black p-4 font-mono text-sm text-white h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">
                <p>No logs yet. Run a scan to see the output here.</p>
                <p className="text-xs mt-2 text-muted-foreground/70">
                  Tip: Use the form below to configure and run your SQLMap scan.
                </p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${log.type === 'error' ? 'text-red-400' : 'text-white'}`}
                >
                  <span className="text-green-400">$ </span>
                  <span className="text-muted-foreground text-xs mr-2">
                    [{formatTimestamp(log.timestamp)}]
                  </span>
                  {log.message.split('\n').map((line, i) => (
                    <div key={i} className={i > 0 ? 'ml-4' : ''}>
                      {line || <br />}
                    </div>
                  ))}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetUrl">Target URL</Label>
                <Input
                  id="targetUrl"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="http://example.com/vulnerable.php?id=1"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="method">HTTP Method</Label>
                  <select
                    id="method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
                
                {method === 'POST' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="data">POST Data</Label>
                    <Input
                      id="data"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      placeholder="param1=value1&param2=value2"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phpsessid">PHPSESSID (Optional for DVWA)</Label>
                  <button 
                    type="button" 
                    onClick={() => {
                      const sessid = prompt('Enter your PHPSESSID:');
                      if (sessid) {
                        setCookie(`PHPSESSID=${sessid}; security=low`);
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Where to find this?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="phpsessid"
                    type="password"
                    value={cookie}
                    onChange={(e) => setCookie(e.target.value)}
                    placeholder="Paste PHPSESSID here"
                    className="pr-20"
                  />
                  {cookie && (
                    <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                      {cookie.includes('PHPSESSID') ? '✓ Ready' : 'Enter PHPSESSID'}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for DVWA. Found in browser cookies after login.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              {logs.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLogs([])}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  Clear Logs
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Scan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SQLMapTool;
