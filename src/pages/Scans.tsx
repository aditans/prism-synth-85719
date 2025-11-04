import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Play,
  Pause,
  Square,
  Eye,
  Download,
  RefreshCw,
  Shield,
  Clock,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Scans() {
  const [runs, setRuns] = useState<Array<{ id: string; tool: string; status: string; startTime?: number; endTime?: number; params?: any }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const r = await fetch('http://localhost:3001/api/runs?limit=100').then(res => res.json()).catch(() => null);
        if (!aborted && r && Array.isArray(r.runs)) setRuns(r.runs);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "default";
      case "completed":
        return "secondary";
      case "failed":
        return "destructive";
      case "queued":
        return "outline";
      default:
        return "outline";
    }
  };

  const totals = useMemo(() => {
    const total = runs.length;
    const running = runs.filter(r => r.status === 'running').length;
    const completed = runs.filter(r => r.status === 'success').length;
    const failed = runs.filter(r => r.status === 'error').length;
    return { total, running, completed, failed };
  }, [runs]);

  const rows = useMemo(() => {
    return runs.map((r) => {
      const status = r.status === 'success' ? 'completed' : r.status === 'error' ? 'failed' : r.status;
      let target = '';
      if (r.tool === 'sqlmap') target = r.params?.targetUrl || '';
      else if (r.tool === 'hydra') target = r.params?.target || '';
      else if (r.tool === 'john') target = r.params?.hashFile || '';
      else if (r.tool === 'zap') target = r.params?.target || '';
      else if (r.tool === 'nmap' || r.tool === 'network-scan') target = (r.params?.args || []).join(' ');
      const started = r.startTime ? new Date(r.startTime) : null;
      const ended = r.endTime ? new Date(r.endTime) : null;
      const durationMs = (started && ended) ? (ended.getTime() - started.getTime()) : null;
      const duration = durationMs !== null ? `${Math.floor(durationMs/60000)}m ${Math.round((durationMs%60000)/1000)}s` : '-';
      const startDisplay = started ? started.toLocaleTimeString() : '-';
      const progress = status === 'completed' ? 100 : status === 'failed' ? 0 : 0;
      return { id: r.id, tool: r.tool, target, status, progress, startDisplay, duration };
    });
  }, [runs]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Scans</h1>
          <p className="text-muted-foreground">
            Monitor and manage your pentesting operations
          </p>
        </div>
        <Button>
          <Play className="w-4 h-4 mr-2" />
          New Scan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '…' : totals.total}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{loading ? '…' : totals.running}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{loading ? '…' : totals.completed}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{loading ? '…' : totals.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Scans Table */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active & Recent Scans
          </CardTitle>
          <CardDescription>View and control your scanning jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Findings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium">{scan.tool}</TableCell>
                  <TableCell className="font-mono text-sm">{scan.target || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(scan.status)}>
                      {scan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {scan.status === "running" ? (
                      <div className="space-y-1">
                        <Progress value={scan.progress} className="h-2" />
                        <span className="text-xs text-muted-foreground">
                          {scan.progress}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {scan.progress}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-3 h-3" />
                      {scan.startDisplay}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{scan.duration}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {scan.status === "running" && (
                        <>
                          <Button size="sm" variant="ghost">
                            <Pause className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Square className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {scan.status === "completed" && (
                        <>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {scan.status === "failed" && (
                        <Button size="sm" variant="ghost">
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
