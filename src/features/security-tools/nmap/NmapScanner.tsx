import { useState } from 'react';
import { NmapService, type NmapOptions } from './nmap.service';

type ScanType = 'quick' | 'full' | 'vuln' | 'custom';

export function NmapScanner() {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState<ScanType>('quick');
  const [options, setOptions] = useState<Partial<NmapOptions>>({
    ports: '',
    serviceVersion: true,
    osDetection: false,
    script: '',
  });
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!target) {
      setError('Please enter a target');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const nmap = new NmapService();
      let scanResult;

      switch (scanType) {
        case 'quick':
          scanResult = await nmap.quickScan(target);
          break;
        case 'full':
          scanResult = await nmap.fullScan(target);
          break;
        case 'vuln':
          scanResult = await nmap.vulnScan(target);
          break;
        case 'custom':
          scanResult = await nmap.scanHost(target, options);
          break;
      }

      if (scanResult.success) {
        setResult(scanResult);
      } else {
        setError(scanResult.error || 'Scan failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionChange = (key: keyof NmapOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Nmap Network Scanner</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Target (IP or hostname)</label>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="example.com or 192.168.1.1"
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Scan Type</label>
        <select
          value={scanType}
          onChange={(e) => setScanType(e.target.value as ScanType)}
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
        >
          <option value="quick">Quick Scan (Top 1000 ports)</option>
          <option value="full">Full Scan</option>
          <option value="vuln">Vulnerability Scan</option>
          <option value="custom">Custom Scan</option>
        </select>
      </div>

      {scanType === 'custom' && (
        <div className="mb-4 p-4 bg-gray-800 rounded">
          <h3 className="font-bold mb-2">Custom Options</h3>
          
          <div className="mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.serviceVersion}
                onChange={(e) => handleOptionChange('serviceVersion', e.target.checked)}
                className="mr-2"
              />
              Service Version Detection (-sV)
            </label>
          </div>
          
          <div className="mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.osDetection}
                onChange={(e) => handleOptionChange('osDetection', e.target.checked)}
                className="mr-2"
              />
              OS Detection (-O)
            </label>
          </div>

          <div className="mb-2">
            <label className="block mb-1">Ports (e.g., 80,443,8080 or 1-1024)</label>
            <input
              type="text"
              value={options.ports || ''}
              onChange={(e) => handleOptionChange('ports', e.target.value)}
              placeholder="Leave empty for default ports"
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          <div className="mb-2">
            <label className="block mb-1">NSE Script (optional)</label>
            <input
              type="text"
              value={options.script || ''}
              onChange={(e) => handleOptionChange('script', e.target.value)}
              placeholder="e.g., vuln,http-title,ssl-cert"
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>
        </div>
      )}

      <button
        onClick={handleScan}
        disabled={isLoading || !target}
        className={`px-4 py-2 rounded ${
          isLoading || !target
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Scanning...' : 'Start Scan'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-900 text-red-100 rounded">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Scan Results</h3>
          <div className="bg-gray-800 p-4 rounded overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap text-sm">
              {result.output || 'No output available'}
            </pre>
          </div>

          {result.metadata?.hosts && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Discovered Hosts</h4>
              <div className="space-y-4">
                {result.metadata.hosts.map((host: any, i: number) => (
                  <div key={i} className="bg-gray-800 p-3 rounded">
                    <div className="font-medium">{host.address}</div>
                    {host.ports?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-400">Open Ports:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
                          {host.ports.map((port: any, j: number) => (
                            <div key={j} className="bg-gray-700 p-2 rounded text-sm">
                              <div>Port: {port.port}/tcp</div>
                              <div>Service: {port.service}</div>
                              {port.version && <div>Version: {port.version}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NmapScanner;
