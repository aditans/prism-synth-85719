import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ status: 'Server is running!' });});

app.post('/api/scan-network', (req, res) => {
    const handleError = (error) => {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    };

    try {
        const { command, args = [] } = req.body;
        
        if (!command) {
            return res.status(400).json({ 
                success: false, 
                error: 'Command is required' 
            });
        }
        
        // If it's an nmap command, run it directly
        if (command === 'nmap') {
            const nmapCommand = `nmap ${args.join(' ')}`;
            console.log('Executing command:', nmapCommand);
            
            exec(nmapCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                try {
                    console.log('Command output:', { stdout, stderr, error });
                    
                    if (error) {
                        console.error('Command error:', error);
                        return res.status(500).json({ 
                            success: false, 
                            error: error.message,
                            stderr: stderr || 'No error output',
                            stdout: stdout || 'No output'
                        });
                    }
                    
                    res.json({ 
                        success: true, 
                        stdout: stdout || 'No output',
                        stderr: stderr || ''
                    });
                } catch (err) {
                    handleError(err);
                }
            });
        } else {
            // Fallback to the Python script for other commands
            const scriptPath = path.join(__dirname, '../scripts/network_scanner.py');
            console.log('Executing script at:', scriptPath);
            
            exec(`python3 ${scriptPath}`, (error, stdout, stderr) => {
                try {
                    console.log('Script output:', { stdout, stderr, error });
                    
                    if (error) {
                        console.error('Script error:', error);
                        return res.status(500).json({ 
                            success: false, 
                            error: error.message,
                            stderr: stderr || 'No error output',
                            stdout: stdout || 'No output'
                        });
                    }
                    
                    res.json({ 
                        success: true, 
                        stdout: stdout || 'No output',
                        stderr: stderr || ''
                    });
                } catch (err) {
                    handleError(err);
                }
            });
        }
    } catch (error) {
        handleError(error);
    }
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    }
});
