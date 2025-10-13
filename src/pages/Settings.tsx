import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Key,
  Database,
  Shield,
  Bell,
  HardDrive,
} from "lucide-react";

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure P.R.I.S.M. and manage your preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="docker">Docker</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="workspace">Workspace Directory</Label>
                <div className="flex gap-2">
                  <Input
                    id="workspace"
                    value="/home/user/.prism/workspace"
                    readOnly
                  />
                  <Button variant="secondary">Browse</Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save report progress
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Terminal Output</Label>
                  <p className="text-sm text-muted-foreground">
                    Display live tool output by default
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Security & Encryption
              </CardTitle>
              <CardDescription>
                Manage encryption keys and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Master Password</Label>
                <Button variant="secondary" className="w-full justify-start">
                  Change Master Password
                </Button>
                <p className="text-xs text-muted-foreground">
                  Used to derive AES-256 encryption keys
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-lock on Idle</Label>
                  <p className="text-sm text-muted-foreground">
                    Lock application after 15 minutes of inactivity
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Encrypt All Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically encrypt generated reports
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-4 border-t border-border">
                <Button variant="destructive" className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Clear All Encryption Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle>Tool Configuration</CardTitle>
              <CardDescription>
                Configure paths and settings for pentesting tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Nmap", path: "/usr/bin/nmap" },
                { name: "ZAP", path: "/opt/zaproxy/zap.sh" },
                { name: "SQLMap", path: "/usr/bin/sqlmap" },
                { name: "Hydra", path: "/usr/bin/hydra" },
              ].map((tool) => (
                <div key={tool.name} className="space-y-2">
                  <Label>{tool.name} Path</Label>
                  <div className="flex gap-2">
                    <Input value={tool.path} readOnly />
                    <Button variant="secondary">Browse</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docker" className="space-y-4">
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Docker Configuration
              </CardTitle>
              <CardDescription>
                Manage Docker settings and resource limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Docker Socket</Label>
                <Input value="/var/run/docker.sock" readOnly />
              </div>

              <div className="space-y-2">
                <Label>Memory Limit (MB)</Label>
                <Input type="number" defaultValue="2048" />
              </div>

              <div className="space-y-2">
                <Label>CPU Cores</Label>
                <Input type="number" defaultValue="2" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-start Containers</Label>
                  <p className="text-sm text-muted-foreground">
                    Start DVWA and other containers automatically
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Scan Completion</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when scans complete
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Critical Findings</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert on critical severity findings
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Docker, backend, and tool status notifications
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for notifications
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
