import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Search,
  Download,
  Lock,
  Trash2,
  Eye,
  Edit,
  FileDown,
  Calendar,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Report {
  id: string;
  title: string;
  target: string;
  date: string;
  findings: number;
  status: "draft" | "completed" | "encrypted";
  template: "student" | "professional";
}

const mockReports: Report[] = [
  {
    id: "1",
    title: "Web Application Security Assessment",
    target: "dvwa.local",
    date: "2024-01-15",
    findings: 23,
    status: "encrypted",
    template: "professional",
  },
  {
    id: "2",
    title: "Network Vulnerability Scan",
    target: "10.0.2.0/24",
    date: "2024-01-14",
    findings: 12,
    status: "completed",
    template: "professional",
  },
  {
    id: "3",
    title: "Practice Lab Assessment",
    target: "192.168.1.100",
    date: "2024-01-13",
    findings: 8,
    status: "draft",
    template: "student",
  },
];

export default function Reports() {
  const [reports] = useState<Report[]>(mockReports);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "encrypted":
        return "default";
      case "completed":
        return "secondary";
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Reports</h1>
          <p className="text-muted-foreground">
            Build, manage, and export pentesting reports
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Start building a new pentesting report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input id="title" placeholder="Web Application Security Assessment" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target</Label>
                <Input id="target" placeholder="Target system or network" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select defaultValue="professional">
                  <SelectTrigger id="template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student / Practice</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Executive summary or notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                <FileText className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search reports..." className="pl-9" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Encrypted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">2</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">6</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">3</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card
            key={report.id}
            className="glass-panel hover:border-primary/50 transition-colors"
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <Badge variant={getStatusColor(report.status)}>
                  {report.status === "encrypted" && (
                    <Lock className="w-3 h-3 mr-1" />
                  )}
                  {report.status}
                </Badge>
              </div>
              <CardTitle className="text-base line-clamp-2">
                {report.title}
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                Target: {report.target}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {report.date}
                </div>
                <Badge variant="outline">{report.findings} findings</Badge>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded bg-secondary/50">
                  {report.template}
                </span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="default" className="flex-1">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="secondary">
                  <Eye className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="secondary">
                  <FileDown className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Options */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Options
          </CardTitle>
          <CardDescription>
            Choose format and encryption for report export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="secondary" className="h-20 flex flex-col gap-2">
              <FileDown className="w-6 h-6" />
              <span>PDF Export</span>
            </Button>
            <Button variant="secondary" className="h-20 flex flex-col gap-2">
              <FileText className="w-6 h-6" />
              <span>Markdown Export</span>
            </Button>
            <Button variant="secondary" className="h-20 flex flex-col gap-2">
              <Lock className="w-6 h-6" />
              <span>Encrypted .prism</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

