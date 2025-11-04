import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Terminal, AlertCircle, Play, Square, X, Filter, Info, ChevronDown, ChevronUp, Copy, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

type WiresharkStatus = 'idle' | 'capturing' | 'stopping' | 'stopped' | 'error';
type Protocol = 'tcp' | 'udp' | 'http' | 'https' | 'dns' | 'icmp' | 'all';

interface NetworkInterface {
  name: string;
  description: string;
  addresses: string[];
}

interface ProtocolFilter {
  tcp: boolean;
  udp: boolean;
  http: boolean;
  https: boolean;
  dns: boolean;
  icmp: boolean;
}

interface Packet {
  id?: string;  
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
}

const ProtocolBadge = ({ protocol }: { protocol: string }) => {
  const getVariant = () => {
    switch(protocol.toLowerCase()) {
      case 'tcp': return 'default';
      case 'udp': return 'secondary';
      case 'http': return 'destructive';
      case 'https': return 'destructive';
      case 'dns': return 'outline';
      case 'icmp': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Badge variant={getVariant()} className="text-xs">
      {protocol.toUpperCase()}
    </Badge>
  );
};

export default function WiresharkTool() {
  const { toast } = useToast();
  const [status, setStatus] = useState<WiresharkStatus>('idle');
  const [interfaceName, setInterfaceName] = useState('');
  const [availableInterfaces, setAvailableInterfaces] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>({
    tcp: true,
    udp: true,
    http: true,
    https: true,
    dns: true,
    icmp: true,
  });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const packetsEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoot, setIsRoot] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);

  // Filter packets based on protocol filters and search
  const filteredPackets = useMemo(() => {
    return packets.filter(packet => {
      // If all protocols are selected or none are selected, show all packets
      const allProtocolsOff = !protocolFilter.tcp && !protocolFilter.udp && 
                            !protocolFilter.http && !protocolFilter.https && 
                            !protocolFilter.dns && !protocolFilter.icmp;
      
      if (allProtocolsOff) return false;
      
      const protocol = packet.protocol.toLowerCase();
      const isDnsPacket = packet.destination === '53' || packet.source === '53' || protocol === 'dns';
      
      return (
        (protocolFilter.tcp && protocol === 'tcp') ||
        (protocolFilter.udp && protocol === 'udp') ||
        (protocolFilter.http && protocol === 'http') ||
        (protocolFilter.https && protocol === 'https') ||
        (protocolFilter.dns && isDnsPacket) ||
        (protocolFilter.icmp && protocol === 'icmp')
      );
    });
  }, [packets, protocolFilter]);

  // Fetch available network interfaces
  useEffect(() => {
    const fetchInterfaces = async () => {
      try {
        // Use the Express server's endpoint on port 3001
        const response = await fetch('http://localhost:3001/api/network/interfaces', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Coerce API response into string[] of interface names
        const raw = data.interfaces;
        const interfaces: string[] = Array.isArray(raw)
          ? raw
              .map((i: any) => (typeof i === 'string' ? i : i?.name))
              .filter((v: any): v is string => typeof v === 'string' && v.length > 0)
          : ['eth0', 'wlan0', 'lo'];
        setAvailableInterfaces(interfaces);
        
        // Default to the first available interface if none is selected
        if (!interfaceName && interfaces.length > 0) {
          setInterfaceName(interfaces[0]);
        }
      } catch (error) {
        console.error('Error fetching network interfaces:', error);
        
        // Set default interfaces as fallback
        const defaultInterfaces = ['eth0', 'wlan0', 'lo'];
        setAvailableInterfaces(defaultInterfaces);
        if (!interfaceName) {
          setInterfaceName(defaultInterfaces[0]);
        }
        
        toast({
          title: 'Warning',
          description: error instanceof Error 
            ? `Using default interfaces: ${error.message}` 
            : 'Using default network interfaces',
          variant: 'destructive',
        });
      }
    };

    fetchInterfaces();
  }, [interfaceName, toast]);

  // WebSocket connection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Connect directly to the API server on port 3001
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const socket = new WebSocket(`${proto}://${host}:3001/api/wireshark/ws`);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setWs(socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'packet' && data.packet) {
          const pkt = data.packet as Packet;
          const normProto = (pkt.protocol || '').toString().toLowerCase().startsWith('tls') ? 'https' : (pkt.protocol || 'unknown');
          const withId: Packet = (pkt.id ? pkt : {
            ...pkt,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          }) as Packet;
          withId.protocol = normProto;
          setPackets(prev => [withId, ...prev].slice(0, 1000));
          return;
        }
        if (data.type === 'packets' && Array.isArray(data.packets)) {
          // If packets are already in final shape from server (-T fields path), just append
          if (data.packets.length > 0 && !data.packets[0]?.layers && typeof data.packets[0]?.source === 'string') {
            const now = Date.now();
            const ready = (data.packets as Packet[]).map((p, i) => {
              const id = p.id ?? `${now}-${i}-${Math.random().toString(36).slice(2, 8)}`;
              const protocol = (p.protocol || '').toString().toLowerCase().startsWith('tls') ? 'https' : (p.protocol || 'unknown');
              return { ...p, id, protocol } as Packet;
            });
            setPackets(prev => [...ready.reverse(), ...prev].slice(0, 1000));
            return;
          }
          const mapped: Packet[] = [];
          for (const pkt of data.packets) {
            // Support both EK format (layers under pkt.layers) and legacy JSON (pkt._source.layers)
            const layers: any = pkt?.layers || pkt?._source?.layers || {};
            const frame = layers.frame || {};
            const ip = layers.ip || layers['ip'] || {};
            const ipv6 = layers.ipv6 || layers['ipv6'] || {};
            const tcp = layers.tcp || layers['tcp'] || {};
            const udp = layers.udp || layers['udp'] || {};
            const http = layers.http || layers['http'] || {};
            const tls = layers.tls || layers['tls'] || {};
            const dns = layers.dns || layers['dns'] || {};
            const icmp = layers.icmp || layers['icmp'] || {};
            const wscol = layers['_ws.col'] || layers['_ws.col.Info'] || {};

            const getFirst = (v: any): string => {
              const firstVal = Array.isArray(v) ? v[0] : v;
              if (firstVal === null || firstVal === undefined) return '';
              if (typeof firstVal === 'object') return '';
              return String(firstVal);
            };

            const timestamp = getFirst(frame['frame.time']) || getFirst(frame['time']) || pkt?.ts || pkt?.timestamp || new Date().toISOString();
            const ipSrc = getFirst(ip['ip.src']) || getFirst(ipv6['ipv6.src']);
            const ipDst = getFirst(ip['ip.dst']) || getFirst(ipv6['ipv6.dst']);
            const tcpSrc = getFirst(tcp['tcp.srcport']);
            const tcpDst = getFirst(tcp['tcp.dstport']);
            const udpSrc = getFirst(udp['udp.srcport']);
            const udpDst = getFirst(udp['udp.dstport']);
            const src = [ipSrc, (tcpSrc || udpSrc)].filter(Boolean).join(':') || ipSrc || tcpSrc || udpSrc || '';
            const dst = [ipDst, (tcpDst || udpDst)].filter(Boolean).join(':') || ipDst || tcpDst || udpDst || '';

            // Determine protocol by layer presence first, then fallbacks
            let protocol = getFirst((layers['_ws.col'] && layers['_ws.col']['Protocol']))
              || getFirst(wscol['Protocol'])
              || (http && Object.keys(http).length ? 'http' : '')
              || (tls && Object.keys(tls).length ? 'tls' : '')
              || (dns && Object.keys(dns).length ? 'dns' : '')
              || (icmp && Object.keys(icmp).length ? 'icmp' : '')
              || (tcpSrc || tcpDst ? 'tcp' : '')
              || (udpSrc || udpDst ? 'udp' : '')
              || (ipSrc || ipDst ? 'ip' : '')
              || 'unknown';
            if (protocol.toLowerCase() === 'tls') protocol = 'https';

            const length = Number(getFirst(frame['frame.len']) || '0') || 0;
            const httpHost = getFirst(http['http.host']);
            const httpUri = getFirst(http['http.request.uri']);
            const httpInfo = httpHost || httpUri ? `${httpHost||''}${httpUri||''}` : '';
            const colInfo = (layers['_ws.col'] && getFirst(layers['_ws.col']['Info'])) || '';
            const portsInfo = (tcpSrc || tcpDst || udpSrc || udpDst) ? `${tcpSrc||udpSrc||''}->${tcpDst||udpDst||''}` : '';
            const arrowInfo = [src, '→', dst].filter(Boolean).join(' ');
            const info = httpInfo || colInfo || portsInfo || arrowInfo || protocol;

            const mappedPacket: Packet = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              timestamp,
              source: src,
              destination: dst,
              protocol,
              length,
              info: info || portsInfo || protocol,
            };
            mapped.push(mappedPacket);
          }
          if (mapped.length) {
            setPackets(prev => [...mapped.reverse(), ...prev].slice(0, 1000));
          }
          return;
        }
        if (data.type === 'status') {
          if (data.status === 'capture_started') setStatus('capturing');
          else if (data.status === 'capture_stopped') setStatus('stopped');
          else if (typeof data.status === 'string') setStatus(data.status as WiresharkStatus);
          return;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setStatus('stopped');
      setWs(null);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
      toast({
        title: 'WebSocket Error',
        description: 'Failed to connect to Wireshark service',
        variant: 'destructive',
      });
    };

    return () => {
      socket.close();
    };
  }, []);

  // Auto-scroll to bottom when new packets arrive (opt-in)
  useEffect(() => {
    if (!autoScroll) return;
    packetsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [packets, autoScroll]);

  const startCapture = useCallback(() => {
    if (!interfaceName) {
      toast({
        title: 'Error',
        description: 'Please select a network interface',
        variant: 'destructive',
      });
      return;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      const filterString = buildFilterString();
      ws.send(JSON.stringify({
        action: 'start',
        interface: interfaceName,
        filter: filterString,
      }));
      setStatus('capturing');
      setPackets([]); // Clear previous packets
    } else {
      toast({
        title: 'Error',
        description: 'Not connected to Wireshark service',
        variant: 'destructive',
      });
    }
  }, [ws, interfaceName, filter, protocolFilter, toast]);

  const stopCapture = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'stop' }));
      setStatus('stopping');
    }
  }, [ws]);

  const buildFilterString = useCallback(() => {
    const protocolFilters = [];
    if (protocolFilter.tcp) protocolFilters.push('tcp');
    if (protocolFilter.udp) protocolFilters.push('udp');
    if (protocolFilter.http) protocolFilters.push('http');
    if (protocolFilter.https) protocolFilters.push('https');
    if (protocolFilter.dns) protocolFilters.push('port 53');
    if (protocolFilter.icmp) protocolFilters.push('icmp');

    let filterString = '';
    if (protocolFilters.length > 0) {
      filterString = `(${protocolFilters.join(' or ')})`;
    }

    if (filter.trim()) {
      filterString = filterString 
        ? `${filterString} and (${filter})`
        : filter;
    }

    return filterString.trim();
  }, [protocolFilter, filter]);

  const clearPackets = useCallback(() => {
    setPackets([]);
    setSelectedPacket(null);
  }, []);

  const copyPacketToClipboard = useCallback((packet: Packet) => {
    navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
    toast({
      title: 'Copied!',
      description: 'Packet data copied to clipboard',
    });
  }, [toast]);

  const exportPackets = useCallback(() => {
    const dataStr = JSON.stringify(packets, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportName = `wireshark-capture-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
    
    toast({
      title: 'Exported!',
      description: `Exported ${packets.length} packets to ${exportName}`,
    });
  }, [packets, toast]);

  const exportLog = useCallback(() => {
    const lines = packets.map(p => {
      const ts = p.timestamp;
      const proto = (p.protocol || '').toString().toUpperCase();
      const src = p.source || '';
      const dst = p.destination || '';
      const len = typeof p.length === 'number' ? p.length : Number(p.length || 0) || 0;
      const info = p.info || '';
      return `${ts} ${proto} ${src} -> ${dst} len=${len} ${info}`.trim();
    }).join('\n');
    const blob = new Blob([lines + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const name = `wireshark-capture-${new Date().toISOString()}.log`;
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Log exported!',
      description: `Saved ${packets.length} lines to ${name}`,
    });
  }, [packets, toast]);

  const handlePacketClick = (packet: Packet) => {
    setSelectedPacket(packet);
  };

  if (status === 'error') {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Failed to connect to the Wireshark service. This could be due to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The Wireshark service is not running</li>
                  <li>Network connectivity issues</li>
                  <li>Insufficient permissions to capture network traffic</li>
                </ul>
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                  >
                    Retry Connection
                  </Button>
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Wireshark Network Analyzer</CardTitle>
              <CardDescription>
                {status === 'capturing' ? (
                  <span className="flex items-center text-green-500">
                    <span className="relative flex h-3 w-3 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Capturing on {interfaceName}
                  </span>
                ) : (
                  'Capture and analyze network traffic in real-time'
                )}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={autoScroll ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoScroll(v => !v)}
                title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
              >
                {autoScroll ? 'Auto-Scroll: On' : 'Auto-Scroll: Off'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportLog}
                disabled={packets.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Log
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPackets}
                disabled={packets.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant={status === 'capturing' ? 'destructive' : 'default'}
                size="sm"
                onClick={status === 'capturing' ? stopCapture : startCapture}
                disabled={status === 'stopping'}
              >
                {status === 'capturing' ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Capture
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Capture
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="interface">Network Interface</Label>
                <select
                  id="interface"
                  value={interfaceName}
                  onChange={(e) => setInterfaceName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={status === 'capturing'}
                >
                  {availableInterfaces.map((iface) => (
                    <option key={iface} value={iface}>
                      {iface}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="filter">Filter (BPF syntax)</Label>
                    <div className="relative">
                      <Input
                        id="filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="e.g., port 80 or host 1.2.3.4"
                        className="font-mono pr-10"
                        disabled={status === 'capturing'}
                      />
                      {filter && (
                        <button
                          type="button"
                          onClick={() => setFilter('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          disabled={status === 'capturing'}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-10 w-10"
                    disabled={status === 'capturing'}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">Filters</span>
                  </Button>
                </div>
              </div>
            </div>
            {showFilters && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Protocol Filters</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const allEnabled = Object.values(protocolFilter).every(v => v);
                          setProtocolFilter({
                            tcp: !allEnabled,
                            udp: !allEnabled,
                            http: !allEnabled,
                            https: !allEnabled,
                            dns: !allEnabled,
                            icmp: !allEnabled,
                          });
                        }}
                        className="h-8 text-xs"
                        disabled={status === 'capturing'}
                      >
                        {Object.values(protocolFilter).every(v => v) ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {Object.entries(protocolFilter).map(([key, value]) => {
                        const protocolName = key.toUpperCase();
                        const protocolColors: Record<string, string> = {
                          'TCP': 'bg-blue-100 text-blue-800 border-blue-200',
                          'UDP': 'bg-purple-100 text-purple-800 border-purple-200',
                          'HTTP': 'bg-green-100 text-green-800 border-green-200',
                          'HTTPS': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                          'DNS': 'bg-amber-100 text-amber-800 border-amber-200',
                          'ICMP': 'bg-rose-100 text-rose-800 border-rose-200',
                        };
                        
                        return (
                          <div key={key} className="flex items-center space-x-2">
                            <div className="relative flex items-start">
                              <div className="flex h-6 items-center">
                                <input
                                  id={`filter-${key}`}
                                  type="checkbox"
                                  checked={value as boolean}
                                  onChange={() =>
                                    setProtocolFilter(prev => ({
                                      ...prev,
                                      [key]: !prev[key as keyof ProtocolFilter],
                                    }))
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  disabled={status === 'capturing'}
                                />
                              </div>
                              <div className="ml-3 text-sm leading-6">
                                <label 
                                  htmlFor={`filter-${key}`}
                                  className={`text-sm font-medium px-2.5 py-0.5 rounded border ${
                                    protocolColors[protocolName] || 'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}
                                >
                                  {protocolName}
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Info className="h-3 w-3 mr-1.5 flex-shrink-0" />
                        <span>Active filter: <code className="bg-muted px-1.5 py-0.5 rounded">{buildFilterString() || 'none'}</code></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Capture Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status</span>
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${status === 'capturing' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm">{status === 'capturing' ? 'Capturing...' : 'Not capturing'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Packets Captured</span>
              <span className="text-sm font-mono">{packets.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Filtered Packets</span>
              <span className="text-sm font-mono">{filteredPackets.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Interface</span>
              <span className="text-sm font-mono">{interfaceName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Tabs defaultValue="packets" className="w-full h-full">
          <div className="border-b">
            <TabsList className="rounded-none bg-transparent p-0 w-full justify-start">
              <TabsTrigger 
                value="packets" 
                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Packets
                {packets.length > 0 && (
                  <span className="ml-2 bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                    {packets.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                disabled={!selectedPacket}
                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Details
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="packets" className="m-0">
            <div className="h-[500px] overflow-hidden flex flex-col">
              {filteredPackets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                  {status === 'capturing' ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Terminal className="h-10 w-10 text-muted-foreground/50" />
                        <div className="absolute -inset-1 bg-primary/10 rounded-full opacity-0 animate-ping"></div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-medium">Listening for network traffic on {interfaceName}...</p>
                        <p className="text-sm text-muted-foreground">
                          Try browsing the web or using network applications
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Terminal className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="font-medium">No packets captured yet</p>
                      <p className="text-sm text-muted-foreground">
                        Click "Start Capture" to begin monitoring network traffic
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="divide-y">
                    {filteredPackets.map((packet) => {
                      const isSelected = selectedPacket?.id === packet.id;
                      return (
                        <div 
                          key={packet.id}
                          className={`p-2 hover:bg-muted/50 cursor-pointer ${isSelected ? 'bg-muted' : ''}`}
                          onClick={() => setSelectedPacket(packet)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                                  {packet.timestamp}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="font-mono text-sm font-medium truncate">
                                  {packet.source}
                                </span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-mono text-sm font-medium truncate">
                                  {packet.destination}
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground truncate">
                                {packet.info}
                              </div>
                            </div>
                            <div className="ml-2">
                              <ProtocolBadge protocol={packet.protocol} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={packetsEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
          <TabsContent value="details" className="m-0 h-[500px] overflow-auto">
            {selectedPacket ? (
              <div className="h-full flex flex-col">
                <div className="border-b p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Packet Details</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPacket.protocol.toUpperCase()} packet from {selectedPacket.source} to {selectedPacket.destination}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyPacketToClipboard(selectedPacket)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Packet Information</h4>
                      <div className="bg-muted/50 p-4 rounded-md">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(selectedPacket, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Select a packet to view details</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
      
      {/* Keyboard Shortcuts Help */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-2">Controls</p>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li className="flex items-center">
                    <kbd className="bg-muted px-1.5 py-0.5 rounded border mr-2">Space</kbd>
                    <span>Start/Stop capture</span>
                  </li>
                  <li className="flex items-center">
                    <kbd className="bg-muted px-1.5 py-0.5 rounded border mr-2">C</kbd>
                    <span>Clear packets</span>
                  </li>
                  <li className="flex items-center">
                    <kbd className="bg-muted px-1.5 py-0.5 rounded border mr-2">F</kbd>
                    <span>Focus filter</span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Status Indicators</p>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    <span>Capturing packets</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-gray-500 mr-2"></span>
                    <span>Not capturing</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                    <span>Error occurred</span>
                  </li>
                </ul>
              </div>
              </div>
              </CardContent>
            </Card>
            
          </div>
    </div>
  );
}
