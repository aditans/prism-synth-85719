import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last session
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Scans</CardTitle>
            <Play className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Nmap, ZAP, SQLMap active
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              8 critical, 15 high priority
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              2 encrypted, 6 exported
            </p>
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
              {[
                {
                  tool: "Nmap",
                  target: "10.0.2.15",
                  status: "running",
                  progress: 67,
                  time: "2m ago",
                },
                {
                  tool: "ZAP",
                  target: "dvwa.local",
                  status: "completed",
                  progress: 100,
                  time: "15m ago",
                },
                {
                  tool: "SQLMap",
                  target: "192.168.1.100",
                  status: "failed",
                  progress: 34,
                  time: "1h ago",
                },
              ].map((scan, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{scan.tool}</span>
                        <Badge
                          variant={
                            scan.status === "running"
                              ? "default"
                              : scan.status === "completed"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {scan.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Target: {scan.target}
                      </div>
                      {scan.status === "running" && (
                        <div className="mt-2 w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${scan.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {scan.time}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
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
