import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fetch from 'node-fetch';

const execPromise = promisify(exec);

// Default ZAP paths (update these according to your ZAP installation)
const ZAP_PATH = process.env.ZAP_PATH || '/usr/share/zaproxy/zap.sh';
const ZAP_PORT = process.env.ZAP_PORT || 8090;
const ZAP_API_KEY = process.env.ZAP_API_KEY || '';

let zapProcess = null;

// Start ZAP server
const startZAP = async () => {
  try {
    if (zapProcess) {
      return { success: true, message: 'ZAP is already running' };
    }

    // If no API key is provided, disable the API key requirement
    const configParams = ZAP_API_KEY 
      ? `-config api.key=${ZAP_API_KEY}` 
      : '-config api.disablekey=true';
      
    const command = `${ZAP_PATH} -daemon -port ${ZAP_PORT} ${configParams}`;
    
    zapProcess = exec(command, { detached: true });
    
    // Log output for debugging
    zapProcess.stdout.on('data', (data) => {
      console.log(`ZAP: ${data}`);
    });
    
    zapProcess.stderr.on('data', (data) => {
      console.error(`ZAP Error: ${data}`);
    });
    
    zapProcess.on('close', (code) => {
      console.log(`ZAP process exited with code ${code}`);
      zapProcess = null;
    });

    // Wait for ZAP to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return { success: true, message: 'ZAP started successfully' };
  } catch (error) {
    console.error('Error starting ZAP:', error);
    return { success: false, error: error.message };
  }
};

// Stop ZAP server
const stopZAP = async () => {
  try {
    if (!zapProcess) {
      return { success: true, message: 'ZAP is not running' };
    }

    // Try to shut down gracefully first
    try {
      const response = await fetch(`http://localhost:${ZAP_PORT}/JSON/core/action/shutdown/`, {
        method: 'GET',
        headers: ZAP_API_KEY ? { 'X-ZAP-API-Key': ZAP_API_KEY } : {}
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await response.text(); // Read the response to avoid memory leaks
    } catch (e) {
      console.log('Graceful shutdown failed, forcing...', e);
      if (zapProcess && zapProcess.pid) {
        process.kill(-zapProcess.pid); // Kill the process group
      }
    }
    
    zapProcess = null;
    return { success: true, message: 'ZAP stopped successfully' };
  } catch (error) {
    console.error('Error stopping ZAP:', error);
    return { success: false, error: error.message };
  }
};

// Check ZAP status
const checkStatus = async () => {
  try {
    if (!zapProcess) {
      return { running: false };
    }

    // Try to get version info from ZAP API
    const response = await fetch(`http://localhost:${ZAP_PORT}/JSON/core/view/version/`, {
      headers: ZAP_API_KEY ? { 'X-ZAP-API-Key': ZAP_API_KEY } : {}
    });
    
    if (!response.ok) {
      console.error('ZAP API error:', response.status, response.statusText);
      return { running: false };
    }
    
    const data = await response.json();
    if (!data || !data.version) {
      console.error('Invalid ZAP API response:', data);
      return { running: false };
    }
    return { 
      running: true, 
      version: data.version 
    };
    
  } catch (error) {
    return { running: false };
  }
};

export { startZAP, stopZAP, checkStatus };
