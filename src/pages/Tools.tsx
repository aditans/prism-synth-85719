import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Wifi, Server, Network, PackageOpen, Play, Settings, HelpCircle, Flame, Zap, Database, WifiOff, Bug, Terminal, Eye, Lock, Code, BarChart2, Activity, Cpu } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: "ready" | "running" | "unavailable";
  category: string;
}

const Tools = () => {
  const navigate = useNavigate();

  const handleToolClick = (toolId: string) => {
    navigate(`/tools/${toolId}`);
  };

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
      icon: Search,
      status: "ready",
      category: "Web Security",
    },
    {
      id: "burp",
      name: "Burp Suite",
      description: "Web vulnerability scanner and proxy",
      icon: Wifi,
      status: "ready",
      category: "Web Security",
    },
    {
      id: "hydra",
      name: "Hydra",
      description: "Parallelized login cracker",
      icon: Server,
      status: "ready",
      category: "Exploitation",
    },
    {
      id: "sqlmap",
      name: "SQLMap",
      description: "Automatic SQL injection tool",
      icon: Network,
      status: "running",
      category: "Exploitation",
    },
    {
      id: "ettercap",
      name: "Ettercap",
      description: "Network traffic interception and sniffing",
      icon: PackageOpen,
      status: "ready",
      category: "Network",
    },
    {
      id: "msfvenom",
      name: "MSFvenom",
      description: "Payload generation and encoding",
      icon: Play,
      status: "ready",
      category: "Exploitation",
    },
    {
      id: "dvwa",
      name: "DVWA",
      description: "Damn Vulnerable Web Application for security training",
      icon: Flame,
      status: "ready",
      category: "Web Security",
    },
    {
      id: "zap",
      name: "OWASP ZAP",
      description: "Web application security scanner and proxy",
      icon: Zap,
      status: "ready",
      category: "Web Security",
    },
    {
      id: "sqlmap",
      name: "SQLMap",
      description: "Automatic SQL injection and database takeover tool",
      icon: Database,
      status: "ready",
      category: "Exploitation",
    },
    {
      id: "metasploit",
      name: "Metasploit",
      description: "Penetration testing framework",
      icon: Terminal,
      status: "ready",
      category: "Exploitation",
    },
    {
      id: "wireshark",
      name: "Wireshark",
      description: "Network protocol analyzer",
      icon: Activity,
      status: "ready",
      category: "Network",
    },
    {
      id: "burpsuite",
      name: "Burp Suite",
      description: "Web vulnerability scanner and proxy",
      icon: Bug,
      status: "ready",
      category: "Web Security",
    },
    {
      id: "nikto",
      name: "Nikto",
      description: "Web server scanner",
      icon: Eye,
      status: "ready",
      category: "Web Security",
    },
    {
      id: "john",
      name: "John the Ripper",
      description: "Password cracker",
      icon: Lock,
      status: "ready",
      category: "Password Cracking",
    },
    {
      id: "hydra",
      name: "THC Hydra",
      description: "Network logon cracker",
      icon: Cpu,
      status: "ready",
      category: "Password Cracking",
    },
    {
      id: "nmap",
      name: "Nmap",
      description: "Network discovery and security auditing",
      icon: Shield,
      status: "ready",
      category: "Network",
    },
    {
      id: "wpscan",
      name: "WPScan",
      description: "WordPress vulnerability scanner",
      icon: Code,
      status: "ready",
      category: "Web Security",
    },
    {
      id: "gobuster",
      name: "GoBuster",
      description: "Directory/file & DNS busting tool",
      icon: BarChart2,
      status: "ready",
      category: "Web Security",
    },
    {
      id: "aircrack",
      name: "Aircrack-ng",
      description: "WiFi security auditing tools",
      icon: WifiOff,
      status: "ready",
      category: "Wireless",
    },
  ];

  const categories = ["All", "Web Security", "Network", "Exploitation", "Password Cracking", "Wireless"];

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
        {tools.map((tool) => (
          <Card key={tool.id} 
            className="hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => handleToolClick(tool.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tool.status === 'running' ? 'bg-primary/20' : 'bg-primary/10'}`}>
                  <tool.icon className={`h-5 w-5 ${tool.status === 'running' ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    {tool.status === 'running' && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Scanning...
                      </span>
                    )}
                  </div>
                  <CardDescription>{tool.description}</CardDescription>
                </div>
              </div>
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
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-2" />
                      {tool.id === 'nmap' ? 'Scanning...' : tool.id === 'dvwa' ? 'Loading...' : 'Running...'}
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      {tool.id === 'nmap' ? 'Start Scan' : tool.id === 'dvwa' ? 'Open DVWA' : 'Quick Run'}
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
        ))}
      </div>

      {/* Scan Results */}
    </div>
  );
};

export default Tools;
