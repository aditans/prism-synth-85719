'use client';

import { useState } from 'react';
import { Terminal, Shield, Lock, Zap, Wifi, Bug } from 'lucide-react';

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  command: string;
  args?: string[];
  color: string;
};

export default function ToolsPage() {
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});
  const [output, setOutput] = useState<Record<string, string>>({});

  const runCommand = async (toolId: string, command: string, args: string[] = []) => {
    setIsRunning(prev => ({ ...prev, [toolId]: true }));
    setOutput(prev => ({ ...prev, [toolId]: `$ ${command} ${args.join(' ')}\nRunning...` }));

    try {
      // Use the full URL in development to avoid CORS issues
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8080' 
        : '';

      const response = await fetch(`${baseUrl}/api/run-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, args }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOutput(prev => ({
          ...prev,
          [toolId]: `$ ${command} ${args.join(' ')}\n${result.stdout || ''}\n${result.stderr || ''}`.trim()
        }));
      } else {
        setOutput(prev => ({
          ...prev,
          [toolId]: `Error: ${result.error || 'Unknown error'}\n${result.stderr || ''}`.trim()
        }));
      }
    } catch (error) {
      setOutput(prev => ({
        ...prev,
        [toolId]: `Error executing command: ${error.message}`
      }));
    } finally {
      setIsRunning(prev => ({ ...prev, [toolId]: false }));
    }
  };

  const tools: Tool[] = [
    {
      id: 'nmap',
      name: 'Nmap Quick Scan',
      description: 'Quick network scan of common ports',
      icon: <Terminal className="w-6 h-6" />,
      command: 'nmap',
      args: ['-T4', '-F', '192.168.1.0/24'],
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'nmap-full',
      name: 'Nmap Full Scan',
      description: 'Comprehensive network scan',
      icon: <Terminal className="w-6 h-6" />,
      command: 'nmap',
      args: ['-T4', '-A', '-v', '192.168.1.0/24'],
      color: 'bg-blue-700 hover:bg-blue-800',
    },
    {
      id: 'hydra-ssh',
      name: 'SSH Brute Force',
      description: 'Brute force SSH login',
      icon: <Lock className="w-6 h-6" />,
      command: 'hydra',
      args: ['-l', 'root', '-P', '/usr/share/wordlists/rockyou.txt', 'ssh://192.168.1.1'],
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: 'vulnscan',
      name: 'Vulnerability Scan',
      description: 'Scan for common vulnerabilities',
      icon: <Shield className="w-6 h-6" />,
      command: 'nmap',
      args: ['-sV', '--script=vuln', '192.168.1.1'],
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      id: 'network-monitor',
      name: 'Network Monitor',
      description: 'Monitor network traffic',
      icon: <Wifi className="w-6 h-6" />,
      command: 'tcpdump',
      args: ['-i', 'any', '-n'],
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Security Tools</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`${tool.color} text-white rounded-lg shadow-lg overflow-hidden`}
          >
            <div className="p-4">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-white/20 rounded-full mr-3">
                  {tool.icon}
                </div>
                <h2 className="text-xl font-semibold">{tool.name}</h2>
              </div>
              <p className="text-white/80 text-sm mb-4">{tool.description}</p>
              <button
                onClick={() => runCommand(tool.id, tool.command, tool.args)}
                disabled={isRunning[tool.id]}
                className={`px-4 py-2 rounded ${
                  isRunning[tool.id]
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-white/20 hover:bg-white/30'
                } text-sm font-medium`}
              >
                {isRunning[tool.id] ? 'Running...' : 'Run Tool'}
              </button>
            </div>
            {output[tool.id] && (
              <div className="bg-black/30 p-4 text-xs font-mono overflow-auto max-h-48">
                <pre className="whitespace-pre-wrap break-words">
                  {output[tool.id]}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
