import CryptoJS from 'crypto-js';
import { EncryptionResult, FileMetadata, EncryptionProgress } from './types';

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for large files

export type EncryptionAlgorithm = 'AES-256' | 'AES-192' | 'AES-128' | '3DES';

const getKeyAndIV = (key: string, algorithm: EncryptionAlgorithm) => {
  // Convert key to WordArray
  const keyHash = CryptoJS.SHA256(key);
  const keyHex = keyHash.toString(CryptoJS.enc.Hex);
  
  switch (algorithm) {
    case 'AES-256':
      return {
        key: CryptoJS.enc.Hex.parse(keyHex),
        iv: CryptoJS.enc.Hex.parse(keyHex.substring(0, 32)), // 16 bytes for AES
        keySize: 256 / 32,
        ivSize: 128 / 32,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      };
    case 'AES-192':
      return {
        key: CryptoJS.enc.Hex.parse(keyHex.substring(0, 48)), // 192 bits
        iv: CryptoJS.enc.Hex.parse(keyHex.substring(0, 32)),
        keySize: 192 / 32,
        ivSize: 128 / 32,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      };
    case 'AES-128':
      return {
        key: CryptoJS.enc.Hex.parse(keyHex.substring(0, 32)), // 128 bits
        iv: CryptoJS.enc.Hex.parse(keyHex.substring(0, 32)),
        keySize: 128 / 32,
        ivSize: 128 / 32,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      };
    case '3DES':
      return {
        key: CryptoJS.enc.Hex.parse(keyHex.substring(0, 48)), // 192 bits for 3DES
        iv: CryptoJS.enc.Hex.parse(keyHex.substring(0, 16)), // 64 bits for 3DES IV
        keySize: 192 / 32,
        ivSize: 64 / 32,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      };
    default:
      throw new Error('Unsupported encryption algorithm');
  }
};

export type { EncryptionResult, FileMetadata, EncryptionProgress } from './types';

export class EncryptionService {
  private key: string;
  private algorithm: EncryptionAlgorithm;
  private progressCallback?: (progress: EncryptionProgress) => void;

  constructor(
    key: string, 
    algorithm: EncryptionAlgorithm = 'AES-256',
    progressCallback?: (progress: EncryptionProgress) => void
  ) {
    this.key = key;
    this.algorithm = algorithm;
    this.progressCallback = progressCallback;
  }

  private updateProgress(progress: Partial<EncryptionProgress>): void {
    if (this.progressCallback) {
      this.progressCallback({
        processedBytes: 0,
        totalBytes: 0,
        percentage: 0,
        status: 'idle',
        ...progress
      });
    }
  }

  private async processFile(
    file: File,
    processFn: (chunk: ArrayBuffer) => Promise<ArrayBuffer | Uint8Array | ArrayBufferLike>,
    operation: 'encrypting' | 'decrypting' = 'encrypting'
  ): Promise<ArrayBuffer> {
    const fileSize = file.size;
    const chunks: (ArrayBuffer | Uint8Array | ArrayBufferLike)[] = [];
    let processedBytes = 0;

    this.updateProgress({
      status: 'encrypting',
      currentFile: file.name,
      totalBytes: fileSize,
    });

    for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
      const chunk = await this.readFileChunk(file, offset, CHUNK_SIZE);
      const processedChunk = await processFn(chunk);
      chunks.push(processedChunk);
      
      processedBytes += chunk.byteLength;
      const percentage = Math.min(100, Math.round((processedBytes / fileSize) * 100));
      
      this.updateProgress({
        processedBytes,
        percentage,
      });
    }

    return this.concatArrayBuffers(chunks);
  }

  private readFileChunk(file: File, offset: number, length: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const blob = file.slice(offset, offset + length);
      
      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file chunk'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file chunk'));
      reader.readAsArrayBuffer(blob);
    });
  }

  private concatArrayBuffers(buffers: (ArrayBuffer | Uint8Array | ArrayBufferLike)[]): ArrayBuffer {
    const totalLength = buffers.reduce((acc, buffer) => {
      return acc + (buffer instanceof Uint8Array ? buffer.length : buffer.byteLength);
    }, 0);
    
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const buffer of buffers) {
      const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      result.set(bytes, offset);
      offset += bytes.length;
    }
    
    return result.buffer;
  }

  public async encryptFile(file: File): Promise<EncryptionResult<Uint8Array>> {
    try {
      const { key, iv, ...options } = getKeyAndIV(this.key, this.algorithm);
      
      const encryptedData = await this.processFile(
        file,
        async (chunk) => {
          const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(chunk));
          let encrypted;
          
          if (this.algorithm === '3DES') {
            encrypted = CryptoJS.TripleDES.encrypt(
              wordArray,
              key,
              { ...options, iv }
            );
          } else {
            encrypted = CryptoJS.AES.encrypt(
              wordArray,
              key,
              { ...options, iv }
            );
          }
          
          // Include algorithm and IV in the encrypted data
          const encryptedData = {
            algorithm: this.algorithm,
            iv: iv.toString(CryptoJS.enc.Hex),
            data: encrypted.toString()
          };
          
          const encryptedStr = JSON.stringify(encryptedData);
          const uint8Array = this.stringToUint8Array(encryptedStr);
          return uint8Array.buffer;
        },
        'encrypting'
      );

      return {
        success: true,
        message: `File encrypted successfully with ${this.algorithm}`,
        data: new Uint8Array(encryptedData),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Encryption failed',
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  public async decryptFile(encryptedData: ArrayBuffer): Promise<EncryptionResult<Uint8Array>> {
    try {
      const decrypted = await this.processFile(
        new File([encryptedData], 'encrypted'),
        async (chunk) => {
          const encryptedText = new TextDecoder().decode(chunk);
          let encryptedData;
          
          try {
            encryptedData = JSON.parse(encryptedText);
          } catch (e) {
            throw new Error('Invalid encrypted data format');
          }
          
          if (!encryptedData.algorithm || !encryptedData.iv || !encryptedData.data) {
            throw new Error('Invalid encrypted data structure');
          }
          
          const { key, iv, ...options } = getKeyAndIV(this.key, encryptedData.algorithm);
          let decrypted;
          
          if (encryptedData.algorithm === '3DES') {
            decrypted = CryptoJS.TripleDES.decrypt(
              encryptedData.data,
              key,
              { ...options, iv: CryptoJS.enc.Hex.parse(encryptedData.iv) }
            );
          } else {
            decrypted = CryptoJS.AES.decrypt(
              encryptedData.data,
              key,
              { ...options, iv: CryptoJS.enc.Hex.parse(encryptedData.iv) }
            );
          }
          
          // Convert WordArray to Uint8Array
          const decryptedWordArray = CryptoJS.enc.Utf8.stringify(decrypted);
          const uint8Array = this.stringToUint8Array(decryptedWordArray);
          return uint8Array.buffer;
        },
        'decrypting'
      );

      return {
        success: true,
        message: 'File decrypted successfully',
        data: new Uint8Array(decrypted),
      };
    } catch (error) {
      console.error('Decryption error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Decryption failed',
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  private stringToUint8Array(str: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }
  
  private wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray | string): Uint8Array {
    let wordArrayObj: CryptoJS.lib.WordArray;
    
    if (typeof wordArray === 'string') {
      wordArrayObj = CryptoJS.enc.Base64.parse(wordArray);
    } else {
      wordArrayObj = wordArray;
    }
    
    // Convert WordArray to string and then to Uint8Array
    const str = wordArrayObj.toString(CryptoJS.enc.Latin1);
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i);
    }
    return arr;
  }

  public static generateKey(algorithm: EncryptionAlgorithm = 'AES-256'): string {
    let keyLength: number;
    
    switch (algorithm) {
      case 'AES-256': keyLength = 32; break;
      case 'AES-192': keyLength = 24; break;
      case 'AES-128': keyLength = 16; break;
      case '3DES': keyLength = 24; break; // 3DES uses 192-bit keys
      default: keyLength = 32;
    }
    
    return CryptoJS.lib.WordArray.random(keyLength).toString();
  }

  public static getFileMetadata(file: File): FileMetadata {
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      isEncrypted: false, // This would be determined by file content/extension in a real implementation
    };
  }
}

export default EncryptionService;
