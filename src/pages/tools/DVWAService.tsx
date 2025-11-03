import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function DVWAService() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDVWAStatus = async () => {
    try {
      // Try to access DVWA directly
      const response = await fetch('http://localhost/DVWA/login.php', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      // If we get here, DVWA is accessible
      setIsRunning(true);
      setError(null);
      return { isRunning: true, url: 'http://localhost/DVWA' };
      
    } catch (err) {
      console.log('DVWA not accessible, checking services...');
      
      // If direct access fails, check if services are running
      try {
        const apacheStatus = await fetch('http://localhost', { method: 'HEAD' })
          .then(() => 'running')
          .catch(() => 'stopped');
          
        const dbStatus = await fetch('http://localhost/DVWA/setup.php', { method: 'HEAD' })
          .then(() => 'running')
          .catch(() => 'stopped');
          
        setError(`Services: Apache ${apacheStatus}, Database ${dbStatus}`);
        return { 
          isRunning: false,
          services: {
            apache: apacheStatus,
            database: dbStatus
          }
        };
      } catch (error) {
        console.error('Error checking services:', error);
        setError('Unable to check service status');
        return { isRunning: false };
      }
    }
  };

  const startDVWA = async () => {
    setIsStarting(true);
    setError('Opening DVWA...');
    
    try {
      // Since DVWA is already installed and running, we'll just open it
      const dvwaUrl = 'http://localhost/DVWA';
      
      // Open in a new tab
      window.open(dvwaUrl, '_blank');
      
      // Update status
      setIsRunning(true);
      toast.success('DVWA opened in a new tab');
      
      // Re-check status to ensure everything is working
      await checkDVWAStatus();
    } catch (err) {
      console.error('Error starting DVWA:', err);
      setError(err.message);
      toast.error(`Failed to start DVWA: ${err.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    // Check initial status
    checkDVWAStatus();
    
    // Set up periodic status check (every 30 seconds)
    const interval = setInterval(checkDVWAStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DVWA Service</h1>
          <p className="text-muted-foreground">Manage your DVWA instance</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/tools')}>
          Back to Tools
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DVWA Control Panel */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>DVWA Control Panel</CardTitle>
            <CardDescription>
              {isRunning 
                ? 'DVWA is currently running and accessible' 
                : 'DVWA service is not running. Click the button below to start.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                isRunning ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
              }`} />
              <span className={`font-medium ${
                isRunning ? 'text-green-400' : 'text-amber-400'
              }`}>
                {isRunning ? 'Service is running' : 'Service is not running'}
              </span>
            </div>
            
            <Button 
              onClick={startDVWA}
              disabled={isStarting || isRunning}
              className="w-full"
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : isRunning ? (
                'DVWA is Running'
              ) : (
                'Start DVWA'
              )}
            </Button>

            {isRunning && (
              <Button 
                variant="outline" 
                className="w-full" variant="outline"
                onClick={() => window.open('http://localhost/DVWA', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open DVWA
              </Button>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DVWA Information */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>About DVWA</CardTitle>
            <CardDescription>
              Damn Vulnerable Web Application (DVWA) is a PHP/MySQL web application that is damn vulnerable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div>
              <h3 className="font-medium mb-2">Default Credentials</h3>
              <div className="bg-muted border p-4 rounded-md">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-medium w-24">Username:</span>
                    <code className="ml-2 px-2 py-1 bg-background rounded text-sm font-mono">admin</code>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-24">Password:</span>
                    <code className="ml-2 px-2 py-1 bg-background rounded text-sm font-mono">password</code>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Documentation</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="https://github.com/digininja/DVWA" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    DVWA GitHub Repository
                  </a>
                </li>
                <li>
                  <a 
                    href="http://www.dvwa.co.uk/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Official DVWA Website
                  </a>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
