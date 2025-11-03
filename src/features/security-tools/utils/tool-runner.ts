import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, any>;
}

export abstract class ToolRunner {
  protected async executeCommand(command: string, args: string[] = []): Promise<ToolResult> {
    try {
      const { stdout, stderr } = await execAsync(`${command} ${args.join(' ')}`);
      return {
        success: true,
        output: stdout,
        error: stderr
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
        metadata: {
          code: error.code,
          signal: error.signal
        }
      };
    }
  }

  // Helper to parse common Nmap output formats
  protected parseNmapOutput(output: string): any {
    // Basic parsing - can be enhanced based on specific needs
    const lines = output.split('\n');
    const result: any = {
      hosts: [],
      ports: [],
      services: []
    };

    let currentHost: any = null;

    for (const line of lines) {
      if (line.includes('Nmap scan report for')) {
        currentHost = {
          address: line.replace('Nmap scan report for', '').trim(),
          ports: []
        };
        result.hosts.push(currentHost);
      } else if (line.includes('open') && line.includes('/tcp')) {
        const portMatch = line.match(/(\d+)\/tcp\s+(\w+)\s+(.*)/);
        if (portMatch && currentHost) {
          currentHost.ports.push({
            port: parseInt(portMatch[1], 10),
            state: 'open',
            service: portMatch[2],
            version: portMatch[3].trim()
          });
        }
      }
    }

    return result;
  }
}
