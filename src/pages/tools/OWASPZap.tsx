import { useState } from "react";
import { BaseToolPage } from "./BaseToolPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function OWASPZap() {
  const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'stopping' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState('http://localhost:8080');
  const [apiKey, setApiKey] = useState('');
  const [zapUrl, setZapUrl] = useState('');

  const handleStart = async () => {
    setStatus('starting');
    setError(null);
    
    try {
      // In a real implementation, this would start ZAP and return the control URL
      await new Promise(resolve => setTimeout(resolve, 2000));
      setZapUrl('http://localhost:8080/zap/');
      setStatus('running');
    } catch (err) {
      setError(err.message || 'Failed to start OWASP ZAP');
      setStatus('error');
    }
  };

  const handleStop = async () => {
    setStatus('stopping');
    try {
      // In a real implementation, this would stop ZAP
      await new Promise(resolve => setTimeout(resolve, 1000));
      setZapUrl('');
      setStatus('idle');
    } catch (err) {
      setError('Failed to stop OWASP ZAP');
      setStatus('error');
    }
  };

  const runQuickScan = async () => {
    if (!target) {
      setError('Please enter a target URL');
      return;
    }
    
    try {
      // In a real implementation, this would trigger a ZAP scan
      setStatus('starting');
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulate scan completion
      setStatus('running');
    } catch (err) {
      setError('Failed to start scan');
      setStatus('error');
    }
  };

  return (
    <BaseToolPage
      title="OWASP ZAP"
      description="The Zed Attack Proxy (ZAP) is one of the world's most popular free security tools and is actively maintained by hundreds of international volunteers."
      status={status}
      error={error}
      onStart={handleStart}
      onStop={handleStop}
      docsLink="https://www.zaproxy.org/docs/"
    >
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target">Target URL</Label>
            <Input
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="http://example.com"
              disabled={status === 'running'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">ZAP API Key (optional)</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Leave empty for default"
              disabled={status === 'running'}
            />
          </div>
          
          {status === 'running' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm">ZAP is running and accessible at:</p>
                <div className="mt-2 flex items-center">
                  <a 
                    href={zapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center"
                  >
                    {zapUrl}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={runQuickScan}>
                  Run Quick Scan
                </Button>
                <Button variant="outline" onClick={() => window.open(zapUrl, '_blank')}>
                  Open ZAP Desktop
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {status === 'running' && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-black text-green-400 font-mono text-sm p-4 rounded overflow-auto">
              {status === 'starting' ? (
                'Starting OWASP ZAP...'
              ) : status === 'running' ? (
                'ZAP is running. Click "Run Quick Scan" to start scanning the target.'
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}
    </BaseToolPage>
  );
}

export default OWASPZap;
