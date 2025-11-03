import dynamic from 'next/dynamic';

// Use dynamic import to avoid SSR issues
const NmapScanner = dynamic(
  () => import('@/features/security-tools/nmap/NmapScanner'),
  { ssr: false }
);

export default function NmapPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Nmap Network Scanner</h1>
      <NmapScanner />
    </div>
  );
}
