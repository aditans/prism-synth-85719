import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { File, Lock, Unlock, Trash2, Download } from 'lucide-react';

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
}

export default function EncryptionTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('Ready');
  const [isProcessing, setIsProcessing] = useState(false);
  const [encryptionMethod, setEncryptionMethod] = useState<EncryptionMethod>('AES-256');
  const [encryptedFiles, setEncryptedFiles] = useState<EncryptedFile[]>([]);

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
      // Simulate encryption delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newEncryptedFile: EncryptedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || 'Unknown',
        size: file.size,
        encryptionMethod,
        encryptedAt: new Date(),
        file,
      };
      
      setEncryptedFiles(prev => [...prev, newEncryptedFile]);
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
      // Simulate decryption delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create a download link for the decrypted file
      const url = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = url;
      
      // Add _decrypted before the file extension
      const fileNameParts = file.name.split('.');
      const extension = fileNameParts.length > 1 ? `.${fileNameParts.pop()}` : '';
      const baseName = fileNameParts.join('.');
      link.download = `${baseName}_decrypted${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Remove from the list after download
      setEncryptedFiles(prev => prev.filter(f => f.id !== fileId));
      setStatus(`File decrypted and downloaded: ${link.download}`);
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
