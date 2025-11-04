"use client";

import { useState, useEffect } from 'react';
import fs from 'fs/promises';
import path from 'path';

export default function HydraPage() {
  const [formData, setFormData] = useState({
    target: '',
    port: '22',
    service: 'ssh',
    username: 'root',
    wordlist: '',
    customWordlist: '',
    threads: '4'
  });
  
  const [wordlists, setWordlists] = useState<{name: string, path: string}[]>([]);
  const [isLoadingWordlists, setIsLoadingWordlists] = useState(true);
  
  // Fetch available wordlists
  useEffect(() => {
    const loadWordlists = async () => {
      try {
        // Get built-in wordlists
        const builtInWordlists = [
          { name: 'Common Passwords (Small)', path: '/wordlists/common-passwords.txt' },
          { name: 'RockYou (Large)', path: '/usr/share/wordlists/rockyou.txt' },
          { name: 'Dirb Common (Medium)', path: '/usr/share/wordlists/dirb/common.txt' },
          { name: 'Dirbuster Medium Directories', path: '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt' }
        ];
        
        // Filter out wordlists that don't exist
        const existingWordlists = await Promise.all(
          builtInWordlists.map(async (wordlist) => {
            try {
              // For the project's wordlist, we'll check if it exists in the public directory
              if (wordlist.path.startsWith('/wordlists/')) {
                const res = await fetch(wordlist.path);
                if (res.ok) return wordlist;
                return null;
              }
              // For system wordlists, we'll assume they exist
              return wordlist;
            } catch (e) {
              return null;
            }
          })
        );
        
        const validWordlists = existingWordlists.filter(Boolean);
        
        // Add custom wordlist option
        validWordlists.push({ name: 'Custom Path...', path: 'custom' });
        
        setWordlists(validWordlists);
        
        // Set default wordlist if available
        if (validWordlists.length > 0) {
          setFormData(prev => ({
            ...prev,
            wordlist: validWordlists[0].path === 'custom' ? '' : validWordlists[0].path
          }));
        }
      } catch (error) {
        console.error('Error loading wordlists:', error);
      } finally {
        setIsLoadingWordlists(false);
      }
    };
    
    loadWordlists();
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If wordlist dropdown changes, update the form data
    if (name === 'wordlist') {
      setFormData(prev => ({
        ...prev,
        wordlist: value,
        customWordlist: value === 'custom' ? prev.customWordlist : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use custom wordlist if selected
      const wordlistPath = formData.wordlist === 'custom' 
        ? formData.customWordlist 
        : formData.wordlist;
      
      if (!wordlistPath) {
        throw new Error('Please select a wordlist or provide a custom path');
      }

      const response = await fetch('/api/hydra', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          wordlist: wordlistPath,
          threads: parseInt(formData.threads, 10)
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute Hydra command');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred while executing the Hydra command');
    } finally {
      setIsLoading(false);
    }
  };

  const commonServices = [
    { value: 'ssh', label: 'SSH' },
    { value: 'ftp', label: 'FTP' },
    { value: 'http-get', label: 'HTTP GET' },
    { value: 'http-post-form', label: 'HTTP POST Form' },
    { value: 'https', label: 'HTTPS' },
    { value: 'rdp', label: 'RDP' },
    { value: 'smb', label: 'SMB' },
    { value: 'smtp', label: 'SMTP' },
    { value: 'telnet', label: 'Telnet' },
    { value: 'vnc', label: 'VNC' },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Hydra Password Cracker</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="bg-gray-900 p-6 rounded-lg lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target IP/Hostname</label>
              <input
                type="text"
                name="target"
                value={formData.target}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="e.g., 192.168.1.1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Port</label>
              <input
                type="number"
                name="port"
                value={formData.port}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                min="1"
                max="65535"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Service</label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                required
              >
                {commonServices.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label} ({service.value})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="e.g., admin"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Wordlist</label>
              {isLoadingWordlists ? (
                <div className="animate-pulse bg-gray-800 h-10 rounded"></div>
              ) : (
                <>
                  <select
                    name="wordlist"
                    value={formData.wordlist}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-2"
                    required
                  >
                    {wordlists.map((wl) => (
                      <option key={wl.path} value={wl.path}>
                        {wl.name} {wl.path === 'custom' ? '' : `(${wl.path})`}
                      </option>
                    ))}
                  </select>
                  
                  {formData.wordlist === 'custom' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        name="customWordlist"
                        value={formData.customWordlist}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                        placeholder="Enter full path to wordlist"
                        required={formData.wordlist === 'custom'}
                      />
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.wordlist && formData.wordlist !== 'custom' ? (
                      <span>Selected: <span className="text-blue-400">{formData.wordlist}</span></span>
                    ) : formData.wordlist === 'custom' ? (
                      'Enter the full path to your custom wordlist'
                    ) : (
                      'Select a wordlist or choose "Custom Path..."'
                    )}
                  </p>
                </>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Threads</label>
              <input
                type="number"
                name="threads"
                value={formData.threads}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                min="1"
                max="64"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Number of parallel connections (be careful with high values)</p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-md font-medium ${
                isLoading
                  ? 'bg-blue-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isLoading ? 'Running...' : 'Start Attack'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        
        {/* Results Section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 p-6 rounded-lg h-full">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="bg-black p-4 rounded font-mono text-sm overflow-x-auto">
                  <div className="text-green-400">$ {result.command}</div>
                  <pre className="mt-2 text-gray-300 whitespace-pre-wrap">
                    {result.output}
                    {result.errorOutput && (
                      <div className="text-red-400">
                        {result.errorOutput}
                      </div>
                    )}
                  </pre>
                </div>
                
                {result.success && (
                  <div className="p-4 bg-green-900/30 border border-green-800 rounded">
                    <h3 className="font-medium text-green-400">Attack completed successfully!</h3>
                    <p className="text-sm text-gray-300 mt-1">
                      Check the output above for the results.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p>Run an attack to see the results here</p>
                <p className="text-sm mt-2">Results will appear in real-time as they are discovered</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
