import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function JohnTool() {
  const [hashFile, setHashFile] = useState('');
  const [wordlist, setWordlist] = useState('');
  const [format, setFormat] = useState('');
  const [rules, setRules] = useState(false);
  const [extra, setExtra] = useState('');
  const [command, setCommand] = useState('');
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickPassword, setQuickPassword] = useState('');
  const [quickFormat, setQuickFormat] = useState<'raw-md5'|'raw-sha1'|'raw-sha256'|'raw-sha512'>('raw-md5');
  const [makingHash, setMakingHash] = useState(false);
  const [wordlists, setWordlists] = useState<Array<{name: string; path: string}>>([]);

  React.useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch('http://localhost:3001/api/wordlists');
        const data = await res.json();
        if (!aborted && Array.isArray(data?.wordlists)) setWordlists(data.wordlists);
      } catch {
        // ignore if endpoint not available
      }
    })();
    return () => { aborted = true; };
  }, []);

  const runJohn = async () => {
    setLoading(true);
    setStdout('');
    setStderr('');
    try {
      const res = await fetch('http://localhost:3001/api/john', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashFile, wordlist, format, rules, extra }),
      });
      const data = await res.json();
      setCommand(data.command || '');
      if (data.success) {
        setStdout(data.stdout || '');
        setStderr(data.stderr || '');
      } else {
        setStderr(data.error || 'Unknown error');
      }
    } catch (e: any) {
      setStderr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const makeHash = async () => {
    if (!quickPassword) { setStderr('Please enter a password to hash.'); return; }
    try {
      setMakingHash(true);
      setStderr('');
      const res = await fetch('http://localhost:3001/api/john/make-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: quickPassword, format: quickFormat }),
      });
      const data = await res.json();
      if (data?.success) {
        setHashFile(data.path || '');
        setFormat(data.format || quickFormat);
        setStdout(`Generated ${data.format} hash: ${data.hash}\nSaved to: ${data.path}`);
      } else {
        setStderr(data?.error || 'Failed to create hash file');
      }
    } catch (e: any) {
      setStderr(e?.message || String(e));
    } finally {
      setMakingHash(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>John the Ripper</CardTitle>
          <CardDescription>Password cracking utility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick test: create hash file from password */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Label>Quick test password</Label>
              <Input type="password" placeholder="Enter password" value={quickPassword} onChange={e => setQuickPassword(e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <Label>Hash format</Label>
              <select
                className="border rounded px-2 py-2 w-full bg-background"
                value={quickFormat}
                onChange={(e) => setQuickFormat(e.target.value as any)}
              >
                <option value="raw-md5">raw-md5</option>
                <option value="raw-sha1">raw-sha1</option>
                <option value="raw-sha256">raw-sha256</option>
                <option value="raw-sha512">raw-sha512</option>
              </select>
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button onClick={makeHash} disabled={makingHash || !quickPassword} className="w-full">{makingHash ? 'Generating...' : 'Generate hash file'}</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Hash file path</Label>
              <Input placeholder="/path/to/hashes.txt" value={hashFile} onChange={e => setHashFile(e.target.value)} />
            </div>
            <div>
              <Label>Wordlist (optional)</Label>
              {wordlists.length > 0 && (
                <div className="mb-2">
                  <select
                    className="border rounded px-2 py-2 w-full bg-background"
                    value={wordlist}
                    onChange={(e) => setWordlist(e.target.value)}
                  >
                    <option value="">Select from discovered wordlists</option>
                    {wordlists.map(w => (
                      <option key={w.path} value={w.path}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <Input placeholder="/usr/share/wordlists/rockyou.txt" value={wordlist} onChange={e => setWordlist(e.target.value)} />
            </div>
            <div>
              <Label>Format (optional)</Label>
              <Input placeholder="raw-md5, sha512crypt, zip, ..." value={format} onChange={e => setFormat(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input id="rules" type="checkbox" checked={rules} onChange={e => setRules(e.target.checked)} />
              <Label htmlFor="rules">Apply --rules</Label>
            </div>
            <div className="md:col-span-2">
              <Label>Extra args (optional, e.g. --fork=4)</Label>
              <Input placeholder="--fork=4" value={extra} onChange={e => setExtra(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={runJohn} disabled={loading || !hashFile}>{loading ? 'Running...' : 'Run'}</Button>
            <Button variant="outline" onClick={() => { setStdout(''); setStderr(''); }}>Clear Output</Button>
          </div>
          {command && (
            <div>
              <Label>Command</Label>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto">{command}</pre>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Stdout</Label>
              <Textarea className="min-h-[200px]" value={stdout} readOnly />
            </div>
            <div>
              <Label>Stderr</Label>
              <Textarea className="min-h-[200px]" value={stderr} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
