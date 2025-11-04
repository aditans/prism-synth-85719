import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import {
  Target,
  Shield,
  Play,
  CheckCircle2,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<{ tools: Array<{tool: string; total: number; success: number; error: number; avgDurationMs: number}>; totals: { total: number; success: number; error: number; durationMs: number } } | null>(null);
  const [runs, setRuns] = useState<Array<{ id: string; tool: string; status: string; startTime?: number; endTime?: number; params?: any }>>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ zap?: { running: boolean; version?: string }; dvwa?: { url: string; reachable: boolean; status: number }; tools?: Record<string, boolean> } | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const [m, r, s] = await Promise.all([
          fetch('http://localhost:3001/api/metrics').then(res => res.json()).catch(() => null),
          fetch('http://localhost:3001/api/runs?limit=12').then(res => res.json()).catch(() => null),
          fetch('http://localhost:3001/api/services').then(res => res.json()).catch(() => null),
        ]);
        if (!aborted) {
          if (m && m.tools) setMetrics(m);
          if (r && Array.isArray(r.runs)) setRuns(r.runs);
          if (s && (s.zap || s.dvwa || s.tools)) setServices(s);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  const runningCount = useMemo(() => runs.filter(r => r.status === 'running').length, [runs]);
  const totalFindings = useMemo(() => {
    if (!metrics) return 0;
    return metrics.totals.success + Math.max(0, metrics.totals.error - 0);
  }, [metrics]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to P.R.I.S.M. - Your offline pentesting orchestration suite
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Targets</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics ? metrics.totals.total : (loading ? '…' : 0)}</div>
            <p className="text-xs text-muted-foreground">Total runs recorded</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Scans</CardTitle>
            <Play className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '…' : runningCount}</div>
            <p className="text-xs text-muted-foreground">Runs in progress</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span>ZAP Proxy</span>
                <Badge variant={(services?.zap?.running ? 'secondary' : 'destructive') as any} className="text-xs">
                  {services?.zap?.running ? (services?.zap?.version ? `running (${services.zap.version})` : 'running') : (loading ? '…' : 'offline')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>DVWA</span>
                <Badge variant={(services?.dvwa?.reachable ? 'secondary' : 'destructive') as any} className="text-xs">
                  {services?.dvwa?.reachable ? 'reachable' : (loading ? '…' : 'unreachable')}
                </Badge>
              </div>
              <div className="pt-2 text-xs text-muted-foreground truncate">
                {services?.dvwa?.url || ''}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '…' : totalFindings}</div>
            <p className="text-xs text-muted-foreground">Derived from recent tool outcomes</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics ? metrics.tools.length : (loading ? '…' : 0)}</div>
            <p className="text-xs text-muted-foreground">Tools with recent activity</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Scans */}
        <Card className="lg:col-span-2 gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Scans
            </CardTitle>
            <CardDescription>Latest pentesting operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(runs.length === 0 && !loading) && (
                <div className="text-sm text-muted-foreground">No recent runs.</div>
              )}
              {runs.map((r) => {
                const started = r.startTime ? new Date(r.startTime) : null;
                const ended = r.endTime ? new Date(r.endTime) : null;
                const duration = (started && ended) ? Math.round((ended.getTime() - started.getTime())/1000) : null;
                const variant = r.status === 'running' ? 'default' : (r.status === 'success' ? 'secondary' : 'destructive');
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{r.tool}</span>
                          <Badge variant={variant as any} className="text-xs">{r.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {started ? `Started: ${started.toLocaleTimeString()}` : 'Start time: —'}
                          {duration !== null ? ` • Duration: ${duration}s` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {started ? started.toLocaleDateString() : ''}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Launch common operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="default">
              <Target className="w-4 h-4 mr-2" />
              Add New Target
            </Button>
            <Button className="w-full justify-start" variant="secondary">
              <Shield className="w-4 h-4 mr-2" />
              Quick Nmap Scan
            </Button>
            <Button className="w-full justify-start" variant="secondary">
              <Play className="w-4 h-4 mr-2" />
              Start ZAP Spider
            </Button>
            <Button className="w-full justify-start" variant="secondary">
              <Activity className="w-4 h-4 mr-2" />
              Launch DVWA Sandbox
            </Button>

            <div className="pt-4 border-t border-border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Critical Findings
              </h4>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm font-medium">SQL Injection</p>
                  <p className="text-xs text-muted-foreground">Target: 10.0.2.15</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-sm font-medium">XSS Vulnerability</p>
                  <p className="text-xs text-muted-foreground">Target: dvwa.local</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
