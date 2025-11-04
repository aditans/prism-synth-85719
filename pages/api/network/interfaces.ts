import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get list of network interfaces
    const { stdout: interfacesOutput } = await execAsync('ls /sys/class/net');
    const interfaceNames = interfacesOutput.trim().split('\n').filter(iface => iface);

    // Get detailed interface information
    const interfaces = await Promise.all(interfaceNames.map(async (name) => {
      try {
        // Get interface IP address
        const { stdout: ipOutput } = await execAsync(`ip -o -4 addr show ${name} | awk '{print $4}' | cut -d'/' -f1`);
        const ip = ipOutput.trim();
        
        // Get interface status (up/down)
        const { stdout: operstate } = await execAsync(`cat /sys/class/net/${name}/operstate`);
        const isUp = operstate.trim() === 'up';
        
        // Get interface MAC address
        const { stdout: mac } = await execAsync(`cat /sys/class/net/${name}/address`);
        
        // Get interface speed
        let speed = 'N/A';
        try {
          const { stdout: speedRaw } = await execAsync(`cat /sys/class/net/${name}/speed 2>/dev/null`);
          if (speedRaw && !isNaN(parseInt(speedRaw))) {
            speed = `${speedRaw.trim()} Mbps`;
          }
        } catch (e) {
          // Ignore errors for interfaces that don't report speed
        }

        return {
          name,
          ip: ip || 'N/A',
          mac: mac.trim(),
          status: isUp ? 'up' : 'down',
          speed,
          description: `${name} (${isUp ? 'up' : 'down'})${ip ? ` - ${ip}` : ''}`
        };
      } catch (e) {
        console.error(`Error getting details for interface ${name}:`, e);
        return {
          name,
          ip: 'N/A',
          mac: 'N/A',
          status: 'unknown',
          speed: 'N/A',
          description: `${name} (unknown)`
        };
      }
    }));

    // Check if running as root
    const isRoot = process.getuid && process.getuid() === 0;

    res.status(200).json({
      interfaces,
      isRoot,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting network interfaces:', error);
    res.status(500).json({
      error: 'Failed to retrieve network interfaces',
      details: error.message
    });
  }
}
