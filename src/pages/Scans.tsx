import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Scan {
  id: string;
  tool: string;
  target: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  startTime: string;
  duration?: string;
  findings?: number;
}

const mockScans: Scan[] = [
  {
    id: "1",
    tool: "Nmap",
    target: "10.0.2.15",
    status: "running",
    progress: 67,
    startTime: "14:32",
    duration: "2m 15s",
  },
  {
    id: "2",
    tool: "ZAP Spider",
    target: "dvwa.local",
    status: "completed",
    progress: 100,
    startTime: "14:17",
    duration: "15m 42s",
    findings: 23,
  },
  {
    id: "3",
    tool: "SQLMap",
    target: "192.168.1.100",
    status: "failed",
    progress: 34,
    startTime: "13:45",
    duration: "8m 12s",
  },
  {
    id: "4",
    tool: "Hydra",
    target: "10.0.2.20",
    status: "queued",
    progress: 0,
    startTime: "14:35",
  },
];

export default function Scans() {
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
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">1</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">21</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">2</div>
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
              {mockScans.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium">{scan.tool}</TableCell>
                  <TableCell className="font-mono text-sm">{scan.target}</TableCell>
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
                      {scan.startTime}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{scan.duration || "-"}</TableCell>
                  <TableCell>
                    {scan.findings ? (
                      <Badge variant="outline">{scan.findings}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
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
