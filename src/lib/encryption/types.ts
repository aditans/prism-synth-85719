export interface EncryptionResult<T = Uint8Array | string> {
  success: boolean;
  message: string;
  data?: T;
  error?: Error;
}

export interface FileMetadata {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  isEncrypted: boolean;
}

export interface EncryptionProgress {
  processedBytes: number;
  totalBytes: number;
  percentage: number;
  status: 'idle' | 'encrypting' | 'decrypting' | 'completed' | 'error';
  currentFile?: string;
}
