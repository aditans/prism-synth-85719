import { useState, useCallback, useEffect } from 'react';
import EncryptionService, { type EncryptionAlgorithm } from '@/lib/encryption/encryptionService';
import { createFile, getBaseFilename } from '@/lib/encryption/utils';
import type { 
  EncryptionResult, 
  FileMetadata, 
  EncryptionProgress 
} from '@/lib/encryption/types';

export const useEncryption = (algorithm: EncryptionAlgorithm = 'AES-256') => {
  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [progress, setProgress] = useState<EncryptionProgress>({
    processedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    status: 'idle',
  });
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<EncryptionAlgorithm>(algorithm);

  // Initialize with a default key if needed
  useEffect(() => {
    const storedKey = localStorage.getItem(`encryptionKey-${currentAlgorithm}`) || 
                     localStorage.getItem('encryptionKey');
    
    if (!storedKey) {
      const newKey = EncryptionService.generateKey(currentAlgorithm);
      localStorage.setItem(`encryptionKey-${currentAlgorithm}`, newKey);
      setEncryptionKey(newKey);
    } else {
      setEncryptionKey(storedKey);
    }
  }, [currentAlgorithm]);

  const updateKey = useCallback((newKey: string) => {
    setEncryptionKey(newKey);
    localStorage.setItem(`encryptionKey-${currentAlgorithm}`, newKey);
  }, [currentAlgorithm]);

  const updateAlgorithm = useCallback((algorithm: EncryptionAlgorithm) => {
    setCurrentAlgorithm(algorithm);
  }, []);

  const encryptFile = useCallback(async (file: File, algorithm: EncryptionAlgorithm = currentAlgorithm): Promise<EncryptionResult<Uint8Array>> => {
    if (!encryptionKey) {
      return {
        success: false,
        message: 'Encryption key is not set',
      };
    }

    setIsEncrypting(true);
    const service = new EncryptionService(encryptionKey, algorithm, (progress) => {
      setProgress(progress);
    });

    try {
      const result = await service.encryptFile(file);
      return result;
    } finally {
      setIsEncrypting(false);
      setProgress({
        processedBytes: 0,
        totalBytes: 0,
        percentage: 0,
        status: 'idle',
      });
    }
  }, [encryptionKey, currentAlgorithm]);

  const decryptFile = useCallback(async (encryptedData: ArrayBuffer, fileName: string): Promise<EncryptionResult<File>> => {
    if (!encryptionKey) {
      return {
        success: false,
        message: 'Encryption key is not set',
      };
    }

    setIsDecrypting(true);
    // Note: The algorithm is determined from the encrypted data
    const service = new EncryptionService(encryptionKey, 'AES-256', (progress) => {
      setProgress(progress);
    });

    try {
      const result = await service.decryptFile(encryptedData);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          message: result.message || 'Decryption failed',
          error: result.error,
        };
      }
      
      // Create a File from the decrypted data
      const decryptedFile = createFile(
        result.data,
        getBaseFilename(fileName),
        { type: 'application/octet-stream' }
      );
      
      return {
        success: true,
        message: 'File decrypted successfully',
        data: decryptedFile,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Decryption failed',
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    } finally {
      setIsDecrypting(false);
      setProgress({
        processedBytes: 0,
        totalBytes: 0,
        percentage: 0,
        status: 'idle',
      });
    }
  }, [encryptionKey]);

  const getFileMetadata = useCallback((file: File): FileMetadata => {
    return EncryptionService.getFileMetadata(file);
  }, []);

  const generateNewKey = useCallback((algorithm: EncryptionAlgorithm = currentAlgorithm): string => {
    const newKey = EncryptionService.generateKey(algorithm);
    setEncryptionKey(newKey);
    localStorage.setItem(`encryptionKey-${algorithm}`, newKey);
    return newKey;
  }, [currentAlgorithm]);

  return {
    encryptFile,
    decryptFile,
    getFileMetadata,
    generateNewKey,
    encryptionKey,
    setEncryptionKey: updateKey,
    updateAlgorithm,
    currentAlgorithm,
    progress,
    isEncrypting,
    isDecrypting,
  };
};

export default useEncryption;
