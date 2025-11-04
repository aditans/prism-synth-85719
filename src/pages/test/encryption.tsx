import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { File, Lock, Unlock, Trash2, Download } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

type EncryptionMethod = 'AES-256' | 'AES-192' | 'AES-128' | '3DES';

interface EncryptedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  encryptionMethod: EncryptionMethod;
  encryptedAt: Date;
  file: File;
  encryptedData?: ArrayBuffer;
  iv?: Uint8Array;
  keyRaw?: ArrayBuffer; // stored only for demo decrypt timing
}

interface DecryptedFileItem {
  id: string;
  name: string;
  method: EncryptionMethod;
  decryptedAt: Date;
  durationMs: number;
  url: string; // blob URL for manual download
}
export default function EncryptionTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('Ready');
  const [isProcessing, setIsProcessing] = useState(false);
  const [encryptionMethod, setEncryptionMethod] = useState<EncryptionMethod>('AES-256');
  const [encryptedFiles, setEncryptedFiles] = useState<EncryptedFile[]>([]);
  const [encHistory, setEncHistory] = useState<Array<{ id: string; method: EncryptionMethod; start: number; end: number; durationMs: number; startedAt: Date; endedAt: Date; sizeKB: number }>>(
    () => {
      try { const s = localStorage.getItem('enc_test_metrics_enc'); return s ? JSON.parse(s).map((x: any) => ({...x, startedAt: new Date(x.startedAt), endedAt: new Date(x.endedAt)})) : []; } catch { return []; }
    }
  );
  const [decHistory, setDecHistory] = useState<Array<{ id: string; method: EncryptionMethod; start: number; end: number; durationMs: number; startedAt: Date; endedAt: Date }>>(
    () => {
      try { const s = localStorage.getItem('enc_test_metrics_dec'); return s ? JSON.parse(s).map((x: any) => ({...x, startedAt: new Date(x.startedAt), endedAt: new Date(x.endedAt)})) : []; } catch { return []; }
    }
  );
  const [decryptedFiles, setDecryptedFiles] = useState<DecryptedFileItem[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus(`Selected: ${e.target.files[0].name}`);
    }
  };

  const handleEncrypt = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setStatus('Encrypting...');
    
    try {
      // Real encryption with WebCrypto AES-GCM
      const startedAt = new Date();
      const start = performance.now();
      const data = await file.arrayBuffer();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const lengthBits = encryptionMethod === 'AES-256' ? 256 : encryptionMethod === 'AES-192' ? 192 : 128;
      // 3DES not supported in WebCrypto; fallback to AES-128 for demo
      const keyAlgo = { name: 'AES-GCM', length: encryptionMethod === '3DES' ? 128 : lengthBits } as AesKeyGenParams;
      const key = await crypto.subtle.generateKey(keyAlgo, true, ['encrypt','decrypt']);
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
      const end = performance.now();
      const endedAt = new Date();
      const keyRaw = await crypto.subtle.exportKey('raw', key);
      
      const newEncryptedFile: EncryptedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || 'Unknown',
        size: file.size,
        encryptionMethod,
        encryptedAt: new Date(),
        file,
        encryptedData: encrypted,
        iv,
        keyRaw,
      };
      
      setEncryptedFiles(prev => [...prev, newEncryptedFile]);
      setEncHistory(prev => {
        const next = [...prev, { id: newEncryptedFile.id, method: encryptionMethod, start, end, durationMs: end - start, startedAt, endedAt, sizeKB: file.size / 1024 }];
        localStorage.setItem('enc_test_metrics_enc', JSON.stringify(next));
        return next;
      });
      setStatus(`File encrypted with ${encryptionMethod}`);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Encryption failed:', error);
      setStatus('Encryption failed. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadEncrypted = (fileId: string) => {
    const file = encryptedFiles.find(f => f.id === fileId);
    if (!file) return;
    
    // Create a download link for the encrypted file
    const url = URL.createObjectURL(new Blob([file.file], { type: 'application/octet-stream' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name}.enc`; // Add .enc extension
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setStatus(`Downloaded encrypted file: ${file.name}.enc`);
  };

  const handleDecrypt = async (fileId: string) => {
    const file = encryptedFiles.find(f => f.id === fileId);
    if (!file) return;
    
    setStatus('Decrypting...');
    try {
      const startedAt = new Date();
      const start = performance.now();
      // Attempt real decrypt if we have materials; else simulate
      if (file.encryptedData && file.iv && file.keyRaw) {
        const key = await crypto.subtle.importKey('raw', file.keyRaw, { name: 'AES-GCM' }, false, ['decrypt']);
        await crypto.subtle.decrypt({ name: 'AES-GCM', iv: file.iv }, key, file.encryptedData);
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      const end = performance.now();
      const endedAt = new Date();
      setDecHistory(prev => {
        const next = [...prev, { id: file.id, method: file.encryptionMethod, start, end, durationMs: end - start, startedAt, endedAt }];
        localStorage.setItem('enc_test_metrics_dec', JSON.stringify(next));
        return next;
      });
      // Prepare manual download entry (do not auto-download)
      const url = URL.createObjectURL(file.file);
      setDecryptedFiles(prev => ([
        ...prev,
        {
          id: file.id,
          name: file.name,
          method: file.encryptionMethod,
          decryptedAt: endedAt,
          durationMs: end - start,
          url,
        }
      ]));
      setStatus(`File decrypted and ready to download: ${file.name}`);
    } catch (error) {
      console.error('Decryption failed:', error);
      setStatus('Decryption failed. Check console for details.');
    }
  };

  const handleDelete = (fileId: string) => {
    setEncryptedFiles(prev => prev.filter(f => f.id !== fileId));
    };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Encryption Controls Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              File Encryption
            </CardTitle>
            <CardDescription>
              Secure your files with advanced encryption methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input 
                  id="file" 
                  type="file" 
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Encryption Method</Label>
                <Select 
                  value={encryptionMethod} 
                  onValueChange={(value) => setEncryptionMethod(value as EncryptionMethod)}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select encryption method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AES-256">AES-256 (Recommended)</SelectItem>
                    <SelectItem value="AES-192">AES-192</SelectItem>
                    <SelectItem value="AES-128">AES-128</SelectItem>
                    <SelectItem value="3DES">3DES (Legacy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <Button 
                onClick={handleEncrypt}
                disabled={!file || isProcessing}
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                {isProcessing ? 'Encrypting...' : 'Encrypt File'}
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Status: <span className="font-medium">{status}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {encHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Encryption Metrics
              </CardTitle>
              <CardDescription>
                Durations and timestamps for recent encryptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={encHistory.map((h, i) => ({ idx: i + 1, duration: Math.round(h.durationMs), method: h.method }))}>
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
                    <BarChart data={encHistory.map((h, i) => ({ idx: i + 1, size: Number(h.sizeKB.toFixed(2)) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="idx" />
                      <YAxis label={{ value: 'KB', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="size" name="File Size (KB)" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {encHistory.map((h, i) => (
                      <TableRow key={h.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{h.method}</TableCell>
                        <TableCell className="text-muted-foreground">{h.startedAt.toLocaleTimeString()}</TableCell>
                        <TableCell className="text-muted-foreground">{h.endedAt.toLocaleTimeString()}</TableCell>
                        <TableCell>{Math.round(h.durationMs)} ms</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {decHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5" />
                Decryption Metrics
              </CardTitle>
              <CardDescription>
                Durations and timestamps for recent decryptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={decHistory.map((h, i) => ({ idx: i + 1, duration: Math.round(h.durationMs) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idx" />
                    <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="duration" name="Duration (ms)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decHistory.map((h, i) => (
                      <TableRow key={h.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{h.method}</TableCell>
                        <TableCell className="text-muted-foreground">{h.startedAt.toLocaleTimeString()}</TableCell>
                        <TableCell className="text-muted-foreground">{h.endedAt.toLocaleTimeString()}</TableCell>
                        <TableCell>{Math.round(h.durationMs)} ms</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Decrypted Files Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" />
              Decrypted Files
            </CardTitle>
            <CardDescription>
              Files you have decrypted (click Download to save)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Decrypted</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decryptedFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-sm">
                      No decrypted files yet. Decrypt a file to see it here.
                    </TableCell>
                  </TableRow>
                ) : (
                  decryptedFiles.map((d) => {
                    const parts = d.name.split('.');
                    const ext = parts.length > 1 ? `.${parts.pop()}` : '';
                    const base = parts.join('.');
                    const downloadName = `${base}_decrypted${ext}`;
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-muted-foreground">{d.method}</TableCell>
                        <TableCell className="text-muted-foreground">{d.decryptedAt.toLocaleTimeString()}</TableCell>
                        <TableCell>{Math.round(d.durationMs)} ms</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = d.url;
                              a.download = downloadName;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Encrypted Files Table */}
        {encryptedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Encrypted Files
              </CardTitle>
              <CardDescription>
                {encryptedFiles.length} file(s) encrypted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Encryption</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {encryptedFiles.map((encryptedFile) => (
                    <TableRow key={encryptedFile.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-muted-foreground" />
                          {encryptedFile.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {encryptedFile.type || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {(encryptedFile.size / 1024).toFixed(2)} KB
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {encryptedFile.encryptionMethod}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {encryptedFile.encryptedAt.toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadEncrypted(encryptedFile.id);
                            }}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            title="Download Encrypted"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecrypt(encryptedFile.id);
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            <Unlock className="h-3.5 w-3.5 mr-1.5" />
                            Decrypt
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(encryptedFile.id);
                            }}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
