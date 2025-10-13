import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Box,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Terminal,
  Activity,
  HardDrive,
  Cpu,
  Database,
  Shield,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Container {
  id: string;
  name: string;
  image: string;
  status: "running" | "stopped" | "starting";
  ports: string[];
  cpu: number;
  memory: number;
  uptime?: string;
}

const mockContainers: Container[] = [
  {
    id: "1",
    name: "DVWA",
    image: "vulnerables/web-dvwa",
    status: "running",
    ports: ["80:80", "3306:3306"],
    cpu: 12,
    memory: 45,
    uptime: "2h 15m",
  },
  {
    id: "2",
    name: "Metasploitable2",
    image: "tleemcjr/metasploitable2",
    status: "stopped",
    ports: ["22:22", "21:21", "80:80"],
    cpu: 0,
    memory: 0,
  },
  {
    id: "3",
    name: "WebGoat",
    image: "webgoat/webgoat-8.0",
    status: "stopped",
    ports: ["8080:8080", "9090:9090"],
    cpu: 0,
    memory: 0,
  },
];

export default function Sandbox() {
  const [containers, setContainers] = useState<Container[]>(mockContainers);

  const startContainer = (id: string) => {
    setContainers(
      containers.map((c) =>
        c.id === id ? { ...c, status: "starting" as const } : c
      )
    );
    setTimeout(() => {
      setContainers(
        containers.map((c) =>
          c.id === id
            ? { ...c, status: "running" as const, cpu: 15, memory: 40, uptime: "0m" }
            : c
        )
      );
    }, 2000);
  };

  const stopContainer = (id: string) => {
    setContainers(
      containers.map((c) =>
        c.id === id
          ? { ...c, status: "stopped" as const, cpu: 0, memory: 0, uptime: undefined }
          : c
      )
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Sandbox</h1>
        <p className="text-muted-foreground">
          Manage vulnerable containers and practice environments
        </p>
      </div>

      {/* Docker Status */}
      <Card className="glass-panel border-primary/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Box className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Docker Status</h3>
                <p className="text-sm text-muted-foreground">
                  Engine running • 3 containers available
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">Resource Usage</p>
                <p className="text-xs text-muted-foreground">
                  CPU: 12% • Memory: 45%
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Containers */}
      <div className="grid grid-cols-1 gap-4">
        {containers.map((container) => (
          <Card
            key={container.id}
            className={`gradient-card ${
              container.status === "running" ? "border-success/50" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      container.status === "running"
                        ? "bg-success/10 animate-pulse-slow"
                        : "bg-muted"
                    }`}
                  >
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {container.name}
                      <Badge
                        variant={
                          container.status === "running"
                            ? "default"
                            : container.status === "starting"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {container.status === "running" && (
                          <div className="w-2 h-2 rounded-full bg-success mr-1" />
                        )}
                        {container.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {container.image}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex gap-2">
                  {container.status === "running" ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(`http://localhost:${container.ports[0].split(':')[0]}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Open
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Terminal className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => stopContainer(container.id)}
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    </>
                  ) : container.status === "starting" ? (
                    <Button variant="secondary" size="sm" disabled>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Starting...
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => startContainer(container.id)}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ports */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Exposed Ports
                  </p>
                  <div className="space-y-1">
                    {container.ports.map((port, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-mono">
                        {port}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* CPU */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    CPU Usage
                  </p>
                  <div className="space-y-2">
                    <Progress value={container.cpu} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {container.cpu}%
                    </p>
                  </div>
                </div>

                {/* Memory */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    Memory
                  </p>
                  <div className="space-y-2">
                    <Progress value={container.memory} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {container.memory}%
                    </p>
                  </div>
                </div>

                {/* Uptime */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Uptime
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {container.uptime || "Not running"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common sandbox management operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="secondary" className="h-16 flex flex-col gap-1">
              <Play className="w-5 h-5" />
              <span className="text-xs">Start All Containers</span>
            </Button>
            <Button variant="secondary" className="h-16 flex flex-col gap-1">
              <Square className="w-5 h-5" />
              <span className="text-xs">Stop All Containers</span>
            </Button>
            <Button variant="secondary" className="h-16 flex flex-col gap-1">
              <RefreshCw className="w-5 h-5" />
              <span className="text-xs">Reset to Default State</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
