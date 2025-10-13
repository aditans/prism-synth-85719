import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Github,
  BookOpen,
  Lock,
  Server,
  Terminal,
  Zap,
  Box,
  ExternalLink,
} from "lucide-react";

export default function About() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center animate-glow">
          <Shield className="w-12 h-12 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">P.R.I.S.M.</h1>
          <p className="text-xl text-muted-foreground">
            Pentesting Reconnaissance & Integrated Security Manager
          </p>
          <Badge variant="outline" className="mt-2">
            Version 1.0.0
          </Badge>
        </div>
      </div>

      {/* Description */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle>About P.R.I.S.M.</CardTitle>
          <CardDescription>
            Offline-first pentesting orchestration suite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            P.R.I.S.M. is a comprehensive desktop application designed for security professionals
            and students to orchestrate pentesting tools in an offline-first environment.
            Built with security and privacy in mind, all sensitive data is encrypted with
            AES-256 encryption before storage.
          </p>
          <p className="text-sm leading-relaxed">
            The platform integrates industry-standard tools like Nmap, OWASP ZAP, Burp Suite,
            Hydra, SQLMap, Ettercap, and MSFvenom into a unified workflow, with AI-powered
            assistance for command generation and vulnerability analysis.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass-panel">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-base">Integrated Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Seven industry-standard pentesting tools orchestrated through a unified interface
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-base">AES-256 Encryption</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All sensitive outputs and reports encrypted with military-grade encryption
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-base">Offline-First</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Works completely offline with no external API dependencies
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-base">Live Output</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stream tool outputs in real-time with syntax highlighting and filtering
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-base">AI Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Local AI for command suggestions, vulnerability analysis, and recommendations
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Box className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-base">Practice Sandbox</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Docker containers with vulnerable applications for safe practice
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tech Stack */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">Frontend</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Electron</li>
                <li>• React + TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Shadcn UI</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Backend</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Node.js</li>
                <li>• Express</li>
                <li>• SQLite</li>
                <li>• Docker API</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Security</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• AES-256 Encryption</li>
                <li>• Master Password</li>
                <li>• Secure IPC</li>
                <li>• Input Validation</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Tools</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Nmap</li>
                <li>• OWASP ZAP</li>
                <li>• Burp Suite</li>
                <li>• SQLMap + more</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="secondary" className="justify-start">
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
            <Button variant="secondary" className="justify-start">
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
            <Button variant="secondary" className="justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Report Security Issue
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>© 2024 P.R.I.S.M. All rights reserved.</p>
        <p className="mt-1">
          Built with ❤️ for the security community • Licensed under MIT
        </p>
      </div>
    </div>
  );
}
