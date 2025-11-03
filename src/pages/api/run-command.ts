import { exec } from 'child_process';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { command, args = [] } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  try {
    const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      exec(`${command} ${args.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
          return reject({ stdout, stderr, error });
        }
        resolve({ stdout, stderr });
      });
    });

    res.status(200).json({ success: true, stdout, stderr });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });
  }
}
