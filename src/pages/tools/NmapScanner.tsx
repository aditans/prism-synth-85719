import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const scanTypes = [
  { id: 'quick', name: 'Quick Scan', command: '-T4 -F' },
  { id: 'intense', name: 'Intense Scan', command: '-T4 -A -v' },
  { id: 'full', name: 'Full Scan', command: '-sS -sU -T4 -A -v -PE -PP -PS80,443 -PA3389 -PU40125 -PY -g 53' },
  { id: 'os', name: 'OS Detection', command: '-O' },
  { id: 'vuln', name: 'Vulnerability Scan', command: '--script vuln' },
  { id: 'dvwa', name: 'DVWA Scan', command: '-sV --script=http-vuln-*,http-enum,http-sql-injection -p 80' },
];

export function NmapScanner() {
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState(scanTypes[0].id);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState('');
  const [scanHistory, setScanHistory] = useState<Array<{target: string; type: string; command: string; timestamp: string}>>([]);

  const handleScan = async () => {
    const scanTarget = target.trim() || 'localhost';
    
    if (!scanTarget) {
      toast.error('Please enter a target IP or hostname');
      return;
    }

    setIsScanning(true);
    setResults('');
    
    const selectedScan = scanTypes.find(s => s.id === scanType);
    const command = `nmap ${selectedScan?.command || ''} ${target}`.trim();
    
    try {
      const response = await fetch('http://localhost:3001/api/scan-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'nmap',
          args: [...(selectedScan?.command.split(' ') || []), scanTarget].filter(Boolean)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute scan');
      }

      const data = await response.json();
      if (data.success) {
        // Combine stdout and stderr for complete output
        const output = [
          data.stdout || '',
          data.stderr ? `\n\nErrors:\n${data.stderr}` : ''
        ].join('');
        
        setResults(output || 'No output from scan');
        
        // Add to scan history
        const newScan = {
          target,
          type: selectedScan?.name || 'Custom',
          command,
          timestamp: new Date().toISOString()
        };
        setScanHistory(prev => [newScan, ...prev].slice(0, 10)); // Keep last 10 scans
        
        toast.success('Scan completed successfully');
      } else {
        throw new Error(data.error || 'Scan failed');
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(`Scan failed: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const scanDVWA = async () => {
    setTarget('localhost');
    setScanType('dvwa');
    // Small delay to ensure state updates before triggering scan
    await new Promise(resolve => setTimeout(resolve, 100));
    handleScan();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nmap Scanner</h1>
          <p className="text-muted-foreground">Powerful network scanning tool</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={scanDVWA}
            className="bg-green-600 hover:bg-green-700 text-white hover:text-white"
          >
            Scan DVWA
          </Button>
          <Button variant="outline" onClick={() => navigate('/tools')}>
            Back to Tools
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan Configuration</CardTitle>
              <CardDescription>Configure your Nmap scan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="target">Target (IP/Hostname)</Label>
                  {target === 'localhost' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Scanning DVWA</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Input
                    id="target"
                    placeholder={scanType === 'dvwa' ? 'localhost (DVWA)' : 'e.g., 192.168.1.1'}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="flex-1"
                    disabled={scanType === 'dvwa'}
                  />
                </div>

                <div className="space-y-2">
                  <div className="grid gap-2">
                    <Label htmlFor="scan-type">Scan Type</Label>
                    <Select 
                      value={scanType} 
                      onValueChange={(value) => {
                        setScanType(value);
                        if (value === 'dvwa') {
                          setTarget('localhost');
                        }
                      }}
                    >
                      <SelectTrigger id="scan-type">
                        <SelectValue placeholder="Select scan type" />
                      </SelectTrigger>
                      <SelectContent>
                        {scanTypes.map((type) => (
                          <SelectItem 
                            key={type.id} 
                            value={type.id}
                            className={type.id === 'dvwa' ? 'font-bold text-green-600 dark:text-green-400' : ''}
                          >
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleScan}
                    disabled={isScanning || !target.trim()}
                  >
                    {isScanning ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-2" />
                        Scanning...
                      </>
                    ) : (
                      'Start Scan'
                    )}
                  </Button>
                </div>
              </div>

              {/* Scan History */}
              {scanHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Scan History</CardTitle>
                    <CardDescription>Recent scans</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {scanHistory.map((scan, index) => (
                      <div 
                        key={index} 
                        className="p-3 border rounded-md hover:bg-accent/50 cursor-pointer"
                        onClick={() => setTarget(scan.target)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{scan.target}</p>
                            <p className="text-sm text-muted-foreground">{scan.type}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(scan.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Scan Results</CardTitle>
              <CardDescription>
                {target ? `Results for ${target}` : 'Enter a target and start scanning'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">
                    {scanType === 'dvwa' ? 'DVWA Scan Results' : 'Scan Results'}
                  </h3>
                  {scanType === 'dvwa' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open('http://localhost/DVWA', '_blank')}
                      className="text-xs"
                    >
                      Open DVWA
                    </Button>
                  )}
                </div>
                <div className="bg-background border rounded-md p-4 h-96 overflow-auto font-mono text-sm whitespace-pre">
                  {results ? (
                    <div className="space-y-2">
                      {results.split('\n').map((line, i) => {
                        // Color code different parts of the output
                        let className = '';
                        if (line.includes('open')) className = 'text-green-500';
                        else if (line.includes('filtered') || line.includes('closed')) className = 'text-amber-500';
                        else if (line.includes('Nmap scan report')) className = 'text-blue-400 font-medium';
                        else if (line.includes('PORT') && line.includes('SERVICE') && line.includes('VERSION')) className = 'font-bold';
                        
                        return (
                          <div key={i} className={className}>
                            {line || ' '}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    'Scan results will appear here...'
                  )}
                </div>
                {scanType === 'dvwa' && !results && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <p>This scan will check for common DVWA vulnerabilities including:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>SQL Injection</li>
                      <li>XSS (Cross-Site Scripting)</li>
                      <li>Command Injection</li>
                      <li>File Inclusion</li>
                      <li>Authentication Bypass</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
