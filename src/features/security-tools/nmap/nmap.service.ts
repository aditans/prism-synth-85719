import { ToolRunner, type ToolResult } from '../utils/tool-runner';

export interface NmapOptions {
  ports?: string;
  serviceVersion?: boolean;
  osDetection?: boolean;
  script?: string;
  timing?: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
  outputFormats?: {
    normal?: boolean;
    xml?: boolean;
    grepable?: boolean;
  };
  outputFile?: string;
}

export class NmapService extends ToolRunner {
  private formatOutputFile(path: string, format: string): string {
    return path ? `-o${format}:${path}` : '';
  }

  async scanHost(target: string, options: NmapOptions = {}): Promise<ToolResult> {
    const args = [target];

    // Basic scan options
    if (options.ports) args.push(`-p ${options.ports}`);
    if (options.serviceVersion) args.push('-sV');
    if (options.osDetection) args.push('-O');
    if (options.script) args.push(`--script=${options.script}`);
    if (options.timing) args.push(`-${options.timing}`);

    // Output formats
    if (options.outputFormats?.normal && options.outputFile) {
      args.push(this.formatOutputFile(options.outputFile, 'N'));
    }
    if (options.outputFormats?.xml && options.outputFile) {
      args.push(this.formatOutputFile(options.outputFile.replace(/\.\w+$/, '.xml'), 'X'));
    }

    const result = await this.executeCommand('nmap', args);
    
    // Only parse if successful and not writing to file
    if (result.success && !options.outputFile) {
      result.metadata = this.parseNmapOutput(result.output);
    }

    return result;
  }

  async quickScan(target: string): Promise<ToolResult> {
    return this.scanHost(target, { 
      ports: '1-1024',
      serviceVersion: true,
      timing: 'T4'
    });
  }

  async fullScan(target: string): Promise<ToolResult> {
    return this.scanHost(target, {
      serviceVersion: true,
      osDetection: true,
      timing: 'T4'
    });
  }

  async vulnScan(target: string): Promise<ToolResult> {
    return this.scanHost(target, {
      script: 'vuln',
      serviceVersion: true,
      timing: 'T4'
    });
  }
}
