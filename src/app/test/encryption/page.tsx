'use client';

import { FileEncryptionTest } from '@/components/test/FileEncryptionTest';
import { useEffect } from 'react';
import { useEncryption } from '@/hooks/useEncryption';

// Default test key - in a real app, this should be handled more securely
const DEFAULT_TEST_KEY = 'test-encryption-key-123';

function EncryptionTestWrapper() {
  const { setEncryptionKey } = useEncryption();

  // Set default test key when component mounts
  useEffect(() => {
    setEncryptionKey(DEFAULT_TEST_KEY);
  }, [setEncryptionKey]);

  return <FileEncryptionTest />;
}

export default function EncryptionTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">File Encryption Test</h1>
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="font-medium text-blue-800">Using test encryption key: <code className="bg-blue-100 px-2 py-1 rounded">{DEFAULT_TEST_KEY}</code></p>
          <p className="mt-2 text-sm text-blue-600">This is a test key. In a production environment, use a strong, unique key.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <EncryptionTestWrapper />
        </div>
      </div>
    </div>
  );
}
