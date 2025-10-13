import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Key,
} from "lucide-react";
import { encryptLog, decryptLog, saveEncryptedLog, getEncryptedLogs, clearEncryptedLogs } from "@/lib/crypto";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warning" | "error" | "success";
  source: string;
  message: string;
}

const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date(),
    level: "info",
    source: "Nmap",
    message: "Starting Nmap scan on target 10.0.2.15",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 60000),
    level: "success",
    source: "Target Manager",
    message: "Successfully added new target: dvwa.local",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 120000),
    level: "warning",
    source: "Docker",
    message: "Container DVWA memory usage at 85%",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 180000),
    level: "error",
    source: "SQLMap",
    message: "Connection timeout to target 192.168.1.100",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 240000),
    level: "info",
    source: "Encryption",
    message: "Report encrypted and saved successfully",
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 300000),
    level: "info",
    source: "ZAP",
    message: "Spider crawl completed - 234 URLs discovered",
  },
];

export default function Logs() {
  const [logs] = useState<LogEntry[]>(mockLogs);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [password, setPassword] = useState("");
  const [decryptPassword, setDecryptPassword] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string>("");
  const { toast } = useToast();

  const getLogIcon = (level: string) => {
    switch (level) {
      case "info":
        return <Info className="w-4 h-4 text-info" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getLogBadgeVariant = (level: string) => {
    switch (level) {
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      case "success":
        return "default";
      default:
        return "outline";
    }
  };

  const handleEncryptLogs = () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter a password",
        variant: "destructive",
      });
      return;
    }

    const logsData = JSON.stringify(filteredLogs, null, 2);
    const encrypted = encryptLog(logsData, password);
    saveEncryptedLog(encrypted);
    
    setIsEncrypted(true);
    setPassword("");
    toast({
      title: "Success",
      description: "Logs encrypted and saved to cypted folder",
    });
  };

  const handleDecryptLogs = () => {
    if (!decryptPassword) {
      toast({
        title: "Error",
        description: "Please enter the decryption password",
        variant: "destructive",
      });
      return;
    }

    const encryptedLogs = getEncryptedLogs();
    if (encryptedLogs.length === 0) {
      toast({
        title: "Error",
        description: "No encrypted logs found",
        variant: "destructive",
      });
      return;
    }

    const latestLog = encryptedLogs[encryptedLogs.length - 1];
    const decrypted = decryptLog(latestLog, decryptPassword);

    if (decrypted) {
      setDecryptedContent(decrypted);
      toast({
        title: "Success",
        description: "Logs decrypted successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Incorrect password or corrupted data",
        variant: "destructive",
      });
    }
  };

  const handleClearEncrypted = () => {
    clearEncryptedLogs();
    setDecryptedContent("");
    setIsEncrypted(false);
    toast({
      title: "Success",
      description: "Encrypted logs cleared",
    });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.level === filter;
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Logs</h1>
          <p className="text-muted-foreground">
            System logs and activity monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-info" />
              Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.level === "info").length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {logs.filter((l) => l.level === "success").length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {logs.filter((l) => l.level === "warning").length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {logs.filter((l) => l.level === "error").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Encryption Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Encrypt Logs (AES-256)
            </CardTitle>
            <CardDescription>
              Store logs securely in the cypted folder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="encrypt-password">Encryption Password</Label>
              <Input
                id="encrypt-password"
                type="password"
                placeholder="Enter encryption password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleEncryptLogs} className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Encrypt & Save Logs
            </Button>
            {isEncrypted && (
              <Badge variant="default" className="w-full justify-center">
                <Key className="w-3 h-3 mr-1" />
                Logs Encrypted
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5" />
              Decrypt Logs
            </CardTitle>
            <CardDescription>
              View encrypted logs from cypted folder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decrypt-password">Decryption Password</Label>
              <Input
                id="decrypt-password"
                type="password"
                placeholder="Enter decryption password"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDecryptLogs} className="flex-1">
                <Unlock className="w-4 h-4 mr-2" />
                Decrypt Logs
              </Button>
              <Button onClick={handleClearEncrypted} variant="destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decrypted Content */}
      {decryptedContent && (
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Decrypted Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <pre className="text-sm p-4 rounded-lg bg-secondary/30">
                {decryptedContent}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="glass-panel">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5" />
            Activity Logs
          </CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getLogIcon(log.level)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getLogBadgeVariant(log.level)} className="text-xs">
                          {log.level}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.source}
                        </Badge>
                      </div>
                      <p className="text-sm">{log.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
