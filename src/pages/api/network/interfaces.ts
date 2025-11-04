import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function getNetworkInterfaces() {
  return new Promise<string[]>((resolve) => {
    // Try Linux/MacOS method first
    exec('ls /sys/class/net', (error, stdout, stderr) => {
      if (!error && stdout) {
        const interfaces = stdout.trim().split('\n').filter(iface => iface);
        if (interfaces.length > 0) {
          return resolve(interfaces);
        }
      }
      
      // Fallback to ifconfig (works on more systems)
      exec('ifconfig -l', (error, stdout) => {
        if (!error && stdout) {
          // Format: lo0 gif0 st...
          const interfaces = stdout.trim().split(/\s+/).filter(iface => iface);
          if (interfaces.length > 0) {
            return resolve(interfaces);
          }
        }
        
        // Final fallback to common interface names
        resolve(['eth0', 'wlan0', 'lo', 'en0', 'en1']);
      });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      error: `Method ${req.method} not allowed`,
      supportedMethods: ['GET']
    });
  }

  try {
    console.log('Fetching network interfaces...');
    const interfaces = await getNetworkInterfaces();
    console.log('Found interfaces:', interfaces);
    
    return res.status(200).json({ 
      success: true,
      interfaces,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in network interfaces API:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve network interfaces',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallbackInterfaces: ['eth0', 'wlan0', 'lo']
    });
  }
}
