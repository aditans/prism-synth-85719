import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Plus,
  Search,
  Play,
  Edit,
  Trash2,
  Globe,
  Server,
  Activity,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TargetData {
  id: string;
  name: string;
  host: string;
  type: "ip" | "domain";
  status: "active" | "inactive";
  lastScan?: string;
  findings?: number;
}

const mockTargets: TargetData[] = [
 
];

export default function Targets() {
  const [targets] = useState<TargetData[]>(mockTargets);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Targets</h1>
          <p className="text-muted-foreground">
            Manage your pentesting targets and hosts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Target
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Target</DialogTitle>
              <DialogDescription>
                Create a new target for pentesting operations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Target Name</Label>
                <Input id="name" placeholder="Internal Web Server" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Host (IP or Domain)</Label>
                <Input id="host" placeholder="10.0.2.15 or example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional notes about this target..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                <Target className="w-4 h-4 mr-2" />
                Create Target
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search targets..." className="pl-9" />
      </div>

      {/* Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {targets.map((target) => (
          <Card key={target.id} className="glass-panel hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {target.type === "ip" ? (
                      <Server className="w-5 h-5 text-primary" />
                    ) : (
                      <Globe className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{target.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {target.host}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant={target.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {target.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  Last scan: {target.lastScan || "Never"}
                </div>
                <div className="font-medium">
                  {target.findings || 0} findings
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Play className="w-3 h-3 mr-1" />
                  Scan
                </Button>
                <Button size="sm" variant="secondary">
                  <Edit className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {targets.length === 0 && (
        <Card className="glass-panel">
          <CardContent className="py-16 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No targets yet</h3>
            <p className="text-muted-foreground mb-4">
              Add a host or spin up DVWA to practice
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Target
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
