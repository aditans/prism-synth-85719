import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { command, args = [] } = await request.json();

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    // For security, validate the command is allowed
    const allowedCommands = ['nmap', 'ping', 'tcpdump', 'hydra'];
    if (!allowedCommands.some(cmd => command.includes(cmd))) {
      return NextResponse.json(
        { error: 'Command not allowed' },
        { status: 403 }
      );
    }

    console.log(`Executing: ${command} ${args.join(' ')}`);
    
    const { stdout, stderr } = await execAsync(`${command} ${args.join(' ')}`);
    
    return NextResponse.json({
      success: true,
      command: `${command} ${args.join(' ')}`,
      stdout,
      stderr
    });

  } catch (error) {
    console.error('Error executing command:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message
      },
      { status: 500 }
    );
  }
}

// Add this to handle preflight requests (CORS)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
