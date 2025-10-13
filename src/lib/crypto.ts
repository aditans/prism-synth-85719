import CryptoJS from 'crypto-js';

export interface EncryptedData {
  ciphertext: string;
  timestamp: string;
}

export const encryptLog = (data: string, password: string): EncryptedData => {
  const ciphertext = CryptoJS.AES.encrypt(data, password).toString();
  return {
    ciphertext,
    timestamp: new Date().toISOString(),
  };
};

export const decryptLog = (encryptedData: EncryptedData, password: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData.ciphertext, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

const STORAGE_KEY = 'cypted_logs';

export const saveEncryptedLog = (encryptedData: EncryptedData): void => {
  const existing = getEncryptedLogs();
  existing.push(encryptedData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const getEncryptedLogs = (): EncryptedData[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearEncryptedLogs = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
