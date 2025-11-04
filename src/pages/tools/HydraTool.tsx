import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Target, Terminal } from "lucide-react";

interface LogEntry {
  type: 'command' | 'output' | 'error';
  message: string;
  timestamp: Date;
}

const HydraTool = () => {
  const [target, setTarget] = useState('');
  const [port, setPort] = useState('22');
  const [service, setService] = useState('ssh');
  const [username, setUsername] = useState('root');
  // Available wordlists
  const wordlists = [
    { name: 'Quick List (10 common passwords)', path: '/usr/share/wordlists/quicklist.txt' },
    { name: 'RockYou (14 million passwords)', path: '/usr/share/wordlists/rockyou.txt' },
  ];
  
  const [wordlist, setWordlist] = useState(wordlists[0].path);

  const setupDVVATest = () => {
    setTarget('localhost');
    setPort('80');
    setService('http-post-form');
    setUsername('admin');
    setWordlist('/usr/share/wordlists/rockyou.txt');
    setThreads('4');
  };
  const [threads, setThreads] = useState('4');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsRunning(true);
    setLogs([]);
    
    // Log the command being executed
    const command = `hydra -l ${username} -P ${wordlist} -t ${parseInt(threads, 10)} ${target} ${service} -s ${port} -vV`;
    addLog('command', `$ ${command}`);
    
    // Add a small delay to ensure the UI updates before starting the attack
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const response = await fetch('http://localhost:3001/api/hydra', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          port,
          service,
          username,
          wordlist,
          threads: parseInt(threads, 10),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute Hydra');
      }

      // Add output to logs
      if (data.output) {
        addLog('output', data.output);
      }
      if (data.error) {
        addLog('error', data.error);
      }
      
      addLog('output', '\nHydra attack completed!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error:', errorMessage);
      addLog('error', `Error: ${errorMessage}`);
    } finally {
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
              <CardTitle>Hydra Password Cracker</CardTitle>
              <CardDescription>
                Parallelized login cracker which supports numerous protocols to attack
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
                <Target className="mr-2 h-4 w-4" />
                Test DVWA Login
              </Button>
              {isRunning && (
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-sm text-muted-foreground hidden sm:inline">Running</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md bg-black p-4 font-mono text-sm text-white h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">
                <p>No logs yet. Run an attack to see the output here.</p>
                <p className="text-xs mt-2 text-muted-foreground/70">
                  Tip: Use the form below to configure and run your Hydra attack.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target</Label>
                <Input
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g., 192.168.1.1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Input
                  id="service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="e.g., ssh, ftp, http-post-form"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wordlist">Wordlist</Label>
                <select
                  id="wordlist"
                  value={wordlist}
                  onChange={(e) => setWordlist(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {wordlists.map((wl) => (
                    <option key={wl.path} value={wl.path}>
                      {wl.name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-muted-foreground">
                  Selected: {wordlist}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="threads">Threads</Label>
                <Input
                  id="threads"
                  type="number"
                  value={threads}
                  onChange={(e) => setThreads(e.target.value)}
                  min="1"
                  max="64"
                />
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
                    Running...
                  </>
                ) : (
                  <>
                    <Terminal className="mr-2 h-4 w-4" />
                    Start Attack
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

export default HydraTool;
