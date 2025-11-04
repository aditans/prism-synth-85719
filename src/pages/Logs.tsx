import { useEffect, useMemo, useState } from "react";
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
import type { EncryptedData } from "@/lib/crypto";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warning" | "error" | "success";
  source: string;
  message: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [password, setPassword] = useState("");
  const [decryptPassword, setDecryptPassword] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string>("");
  const { toast } = useToast();
  const [encMetrics, setEncMetrics] = useState<Array<{ id: string; start: Date; end: Date; durationMs: number; sizeKB: number }>>(() => {
    try {
      const s = localStorage.getItem('logs_enc_metrics');
      return s ? JSON.parse(s).map((m: any) => ({ ...m, start: new Date(m.start), end: new Date(m.end) })) : [];
    } catch {
      return [];
    }
  });
  const [ciphertexts, setCiphertexts] = useState<EncryptedData[]>(() => {
    try { return getEncryptedLogs(); } catch { return []; }
  });
  const [showCiphertext, setShowCiphertext] = useState<boolean>(false);
  const [decMetrics, setDecMetrics] = useState<Array<{ id: string; start: Date; end: Date; durationMs: number; sizeKB?: number }>>(() => {
    try {
      const s = localStorage.getItem('logs_dec_metrics');
      return s ? JSON.parse(s).map((m: any) => ({ ...m, start: new Date(m.start), end: new Date(m.end) })) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const r = await fetch('http://localhost:3001/api/runs?limit=200').then(res => res.json()).catch(() => null);
        if (!aborted && r && Array.isArray(r.runs)) {
          const entries: LogEntry[] = [];
          for (const run of r.runs) {
            const startedAt = run.startTime ? new Date(run.startTime) : new Date();
            const source = (run.tool || 'system').toString();
            const target = run.tool === 'sqlmap' ? (run.params?.targetUrl || '')
              : run.tool === 'hydra' ? (run.params?.target || '')
              : run.tool === 'john' ? (run.params?.hashFile || '')
              : run.tool === 'zap' ? (run.params?.target || '')
              : run.tool === 'nmap' || run.tool === 'network-scan' ? (run.params?.args || []).join(' ')
              : (run.params?.target || '');
            entries.push({
              id: `${run.id}-start`,
              timestamp: startedAt,
              level: 'info',
              source,
              message: `Started ${source}${target ? ` on ${target}` : ''}`,
            });
            if (run.status === 'success' || run.endTime) {
              entries.push({
                id: `${run.id}-done`,
                timestamp: run.endTime ? new Date(run.endTime) : startedAt,
                level: run.status === 'error' ? 'error' : 'success',
                source,
                message: run.status === 'error' ? `Failed ${source}` : `Completed ${source}`,
              });
            } else if (run.status === 'error') {
              entries.push({
                id: `${run.id}-fail`,
                timestamp: startedAt,
                level: 'error',
                source,
                message: `Failed ${source}`,
              });
            }
          }
          // Sort newest first
          entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setLogs(entries);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

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

    const started = new Date();
    const t0 = performance.now();
    const logsData = JSON.stringify(filteredLogs, null, 2);
    const encrypted = encryptLog(logsData, password);
    saveEncryptedLog(encrypted);
    const t1 = performance.now();
    const ended = new Date();
    setEncMetrics(prev => {
      const next = [
        ...prev,
        {
          id: `${started.getTime()}`,
          start: started,
          end: ended,
          durationMs: t1 - t0,
          sizeKB: logsData.length / 1024,
        }
      ];
      localStorage.setItem('logs_enc_metrics', JSON.stringify(next));
      return next;
    });
    
    setIsEncrypted(true);
    setPassword("");
    setCiphertexts(prev => [...prev, encrypted]);
    setShowCiphertext(true);
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
    const started = new Date();
    const t0 = performance.now();
    const decrypted = decryptLog(latestLog, decryptPassword);
    const t1 = performance.now();
    const ended = new Date();

    if (decrypted) {
      setDecryptedContent(decrypted);
      setDecMetrics(prev => {
        const next = [
          ...prev,
          {
            id: `${started.getTime()}`,
            start: started,
            end: ended,
            durationMs: t1 - t0,
            sizeKB: latestLog.ciphertext.length / 1024,
          }
        ];
        localStorage.setItem('logs_dec_metrics', JSON.stringify(next));
        return next;
      });
      // Remove the just-decrypted ciphertext from storage and UI
      try {
        const existing = getEncryptedLogs();
        const filtered = existing.filter(
          (e) => !(e.ciphertext === latestLog.ciphertext && e.timestamp === latestLog.timestamp)
        );
        localStorage.setItem('cypted_logs', JSON.stringify(filtered));
        setCiphertexts(filtered);
      } catch {}
      // Hide ciphertext section after any successful decrypt
      setShowCiphertext(false);
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

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const matchesFilter = filter === "all" || log.level === filter;
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [logs, filter, searchTerm]);

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

      {/* Ciphertext (latest) */}
      {showCiphertext && ciphertexts.length > 0 && (
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Ciphertext</CardTitle>
            <CardDescription>Latest encrypted payload (frontend only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ScrollArea className="h-[200px]">
              <pre className="text-xs break-all whitespace-pre-wrap p-4 rounded-lg bg-secondary/30">
                {ciphertexts[ciphertexts.length - 1].ciphertext}
              </pre>
            </ScrollArea>
            <div className="text-xs text-muted-foreground">
              Timestamp: {new Date(ciphertexts[ciphertexts.length - 1].timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
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

      {/* Decryption Metrics */}
      {decMetrics.length > 0 && (
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Decryption Metrics
            </CardTitle>
            <CardDescription>Time and size per decryption</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={decMetrics.map((m, i) => ({ idx: i + 1, duration: Math.round(m.durationMs) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idx" />
                    <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="duration" name="Duration (ms)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={decMetrics.map((m, i) => ({ idx: i + 1, size: Number((m.sizeKB || 0).toFixed(2)) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idx" />
                    <YAxis label={{ value: 'KB', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="size" name="Payload Size (KB)" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decMetrics.map((m, i) => (
                    <TableRow key={m.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="text-muted-foreground">{m.start.toLocaleTimeString()}</TableCell>
                      <TableCell className="text-muted-foreground">{m.end.toLocaleTimeString()}</TableCell>
                      <TableCell>{Math.round(m.durationMs)} ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Encryption Metrics */}
      {encMetrics.length > 0 && (
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Encryption Metrics
            </CardTitle>
            <CardDescription>Time and size per encryption</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={encMetrics.map((m, i) => ({ idx: i + 1, duration: Math.round(m.durationMs) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idx" />
                    <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="duration" name="Duration (ms)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={encMetrics.map((m, i) => ({ idx: i + 1, size: Number(m.sizeKB.toFixed(2)) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idx" />
                    <YAxis label={{ value: 'KB', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="size" name="Payload Size (KB)" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {encMetrics.map((m, i) => (
                    <TableRow key={m.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="text-muted-foreground">{m.start.toLocaleTimeString()}</TableCell>
                      <TableCell className="text-muted-foreground">{m.end.toLocaleTimeString()}</TableCell>
                      <TableCell>{Math.round(m.durationMs)} ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
            Showing {filteredLogs.length} of {logs.length} log entries {loading ? '(loading…)': ''}
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
