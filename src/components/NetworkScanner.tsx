import { useState } from 'react';

export function NetworkScanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleScan = async () => {
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('http://localhost:3001/api/scan-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.output);
      } else {
        setError(data.error || 'An error occurred during the scan');
      }
    } catch (err) {
      setError('Failed to connect to the server. Make sure the server is running.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Network Scanner</h2>
      <button
        onClick={handleScan}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isLoading ? 'Scanning...' : 'Start Network Scan'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Scan Results:</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
