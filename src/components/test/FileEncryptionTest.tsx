import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, FileDown, Lock, Unlock } from 'lucide-react';
import { useEncryption } from '@/hooks/useEncryption';
import { FileUploader } from '../file/FileUploader';
import { FileDownloader } from '../file/FileDownloader';

export function FileEncryptionTest() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [encryptedData, setEncryptedData] = useState<Uint8Array | null>(null);
  const [decryptedFile, setDecryptedFile] = useState<File | null>(null);
  const { encryptFile, decryptFile } = useEncryption();

  const handleFileSelect = useCallback((file: File) => {
    setOriginalFile(file);
    setEncryptedData(null);
    setDecryptedFile(null);
  }, []);

  const handleEncrypt = useCallback(async () => {
    if (!originalFile) return;
    
    try {
      const result = await encryptFile(originalFile);
      if (result.success && result.data) {
        setEncryptedData(result.data);
      } else {
        console.error('Encryption failed:', result.message);
      }
    } catch (error) {
      console.error('Error during encryption:', error);
    }
  }, [originalFile, encryptFile]);

  const handleDecrypt = useCallback(async () => {
    if (!encryptedData || !originalFile) return;
    
    try {
      // Create a new ArrayBuffer from the Uint8Array
      const arrayBuffer = new ArrayBuffer(encryptedData.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(encryptedData);
      
      const result = await decryptFile(arrayBuffer, originalFile.name);
      if (result.success && result.data) {
        setDecryptedFile(result.data);
      } else {
        console.error('Decryption failed:', result.message);
      }
    } catch (error) {
      console.error('Error during decryption:', error);
    }
  }, [encryptedData, originalFile, decryptFile]);

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">File Encryption Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">1. Select a file</h2>
        <FileUploader onFileProcessed={handleFileSelect} />
        
        {originalFile && (
          <div className="mt-4 p-4 border rounded-md bg-muted/50">
            <p><strong>Selected File:</strong> {originalFile.name}</p>
            <p><strong>Size:</strong> {(originalFile.size / 1024).toFixed(2)} KB</p>
            <p><strong>Type:</strong> {originalFile.type || 'Unknown'}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">2. Encrypt the file</h2>
        <Button 
          onClick={handleEncrypt} 
          disabled={!originalFile}
          className="gap-2"
        >
          <Lock className="h-4 w-4" />
          Encrypt File
        </Button>
        
        {encryptedData && (
          <div className="mt-4 p-4 border rounded-md bg-muted/50">
            <p className="text-green-600">File encrypted successfully!</p>
            <p><strong>Encrypted Size:</strong> {(encryptedData.byteLength / 1024).toFixed(2)} KB</p>
            
            <div className="mt-4">
              <FileDownloader 
                file={encryptedData} 
                fileName={`${originalFile?.name}.enc`}
                label="Download Encrypted File"
                className="mt-2"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">3. Decrypt the file</h2>
        <Button 
          onClick={handleDecrypt} 
          disabled={!encryptedData}
          variant="outline"
          className="gap-2"
        >
          <Unlock className="h-4 w-4" />
          Decrypt File
        </Button>
        
        {decryptedFile && (
          <div className="mt-4 p-4 border rounded-md bg-muted/50">
            <p className="text-green-600">File decrypted successfully!</p>
            <p><strong>Original Name:</strong> {decryptedFile.name}</p>
            <p><strong>Size:</strong> {(decryptedFile.size / 1024).toFixed(2)} KB</p>
            
            <div className="mt-4">
              <FileDownloader 
                file={decryptedFile} 
                fileName={`decrypted_${decryptedFile.name}`}
                label="Download Decrypted File"
                className="mt-2"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileEncryptionTest;
