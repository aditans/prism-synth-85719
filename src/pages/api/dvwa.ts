import { exec } from 'child_process';
import { NextApiRequest, NextApiResponse } from 'next';

const runCommand = (command: string): Promise<{success: boolean; output: string; error?: string}> => {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, output: stderr || error.message });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // Check if we can access DVWA login page
      try {
        // Try with a short timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('http://127.0.0.1/dvwa/login.php', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return res.status(200).json({ 
          isRunning: response.ok,
          url: 'http://127.0.0.1/dvwa'
        });
      } catch (error) {
        // If we can't access DVWA, check if services are running
        const apacheStatus = await runCommand('systemctl is-active apache2');
        const mariadbStatus = await runCommand('systemctl is-active mariadb');
        
        // If mariadb service doesn't exist, it might be called mysql in some installations
        let dbStatus = mariadbStatus;
        if (!mariadbStatus.success) {
          dbStatus = await runCommand('systemctl is-active mysql');
        }
        
        return res.status(200).json({ 
          isRunning: false,
          services: {
            apache: apacheStatus.success ? 'running' : 'stopped',
            database: dbStatus.success ? 'running' : 'stopped'
          }
        });
      }
    } 
    
    if (req.method === 'POST') {
      // Start services
      const startApache = await runCommand('sudo systemctl start apache2');
      if (!startApache.success) {
        return res.status(500).json({ 
          success: false, 
          error: `Failed to start Apache: ${startApache.output}`
        });
      }

      // Try to start MariaDB (or MySQL if MariaDB isn't available)
      let startDb = await runCommand('sudo systemctl start mariadb');
      if (!startDb.success) {
        // Fall back to mysql service name if mariadb service doesn't exist
        startDb = await runCommand('sudo systemctl start mysql');
        if (!startDb.success) {
          return res.status(500).json({ 
            success: false, 
            error: `Failed to start database service. Tried both mariadb and mysql.\nError: ${startDb.output}`
          });
        }
      }

      return res.status(200).json({ 
        success: true,
        message: 'DVWA services started successfully',
        url: 'http://127.0.0.1/dvwa',
        nextSteps: [
          'Wait a few seconds for services to fully start',
          'Click the "Open DVWA" button to access the application',
          'Use default credentials: admin/password'
        ]
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
    
  } catch (error) {
    console.error('DVWA API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
  }
}
