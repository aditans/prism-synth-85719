export default function StatusPage() {
  // This would be replaced with actual status checking logic
  const tools = [
    { name: 'Nmap', status: 'online', lastChecked: new Date().toISOString() },
    { name: 'Hydra', status: 'offline', lastChecked: new Date().toISOString() },
    { name: 'Metasploit', status: 'offline', lastChecked: new Date().toISOString() },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tools Status</h1>
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg ${
                tool.status === 'online' ? 'bg-green-900/30' : 'bg-red-900/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{tool.name}</h3>
                <span 
                  className={`inline-block w-3 h-3 rounded-full ${
                    tool.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Status: {tool.status}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Last checked: {new Date(tool.lastChecked).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
