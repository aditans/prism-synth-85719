import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Globe,
  Lock,
  Zap,
  Database,
  Network,
  PackageOpen,
  Play,
  Settings,
  HelpCircle,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: "ready" | "running" | "unavailable";
  category: string;
}

const tools: Tool[] = [
  {
    id: "nmap",
    name: "Nmap",
    description: "Network reconnaissance and security auditing",
    icon: Shield,
    status: "ready",
    category: "Reconnaissance",
  },
  {
    id: "zap",
    name: "OWASP ZAP",
    description: "Web application security scanner",
    icon: Globe,
    status: "ready",
    category: "Web Security",
  },
  {
    id: "burp",
    name: "Burp Suite",
    description: "Web vulnerability scanner and proxy",
    icon: Zap,
    status: "ready",
    category: "Web Security",
  },
  {
    id: "hydra",
    name: "Hydra",
    description: "Parallelized login cracker",
    icon: Lock,
    status: "ready",
    category: "Exploitation",
  },
  {
    id: "sqlmap",
    name: "SQLMap",
    description: "Automatic SQL injection tool",
    icon: Database,
    status: "running",
    category: "Exploitation",
  },
  {
    id: "ettercap",
    name: "Ettercap",
    description: "Network traffic interception and sniffing",
    icon: Network,
    status: "ready",
    category: "Network",
  },
  {
    id: "msfvenom",
    name: "MSFvenom",
    description: "Payload generation and encoding",
    icon: PackageOpen,
    status: "ready",
    category: "Exploitation",
  },
];

const categories = ["All", "Reconnaissance", "Web Security", "Exploitation", "Network"];

export default function Tools() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Tools</h1>
        <p className="text-muted-foreground">
          Pentesting tools available in your arsenal
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={category === "All" ? "default" : "secondary"}
            className="cursor-pointer hover:bg-primary/80"
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              className="glass-panel hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <Badge
                    variant={
                      tool.status === "ready"
                        ? "default"
                        : tool.status === "running"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {tool.status}
                  </Badge>
                </div>
                <CardTitle>{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {tool.category}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={tool.status === "unavailable"}
                  >
                    {tool.status === "running" ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse mr-2" />
                        View Run
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Quick Run
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <HelpCircle className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
