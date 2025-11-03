import { NetworkScanner } from '@/components/NetworkScanner';

export default function NetworkScanPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Network Tools</h1>
      <NetworkScanner />
    </div>
  );
}
