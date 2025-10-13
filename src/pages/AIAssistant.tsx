import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Terminal,
  Shield,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestedCommand?: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your AI pentesting assistant. I can help you with tool recommendations, command generation, vulnerability analysis, and more. How can I assist you today?",
    timestamp: new Date(),
  },
];

const suggestions = [
  "Suggest an Nmap scan for web server enumeration",
  "Explain SQL injection vulnerabilities",
  "How do I use Hydra for SSH brute force?",
  "Analyze this vulnerability finding",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Based on your target, I recommend running a comprehensive Nmap scan with version detection and OS fingerprinting. This will help identify open ports and services.",
        timestamp: new Date(),
        suggestedCommand: "nmap -sV -O -p- --min-rate 1000 10.0.2.15",
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="p-6 h-[calc(100vh-3.5rem)]">
      <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-2 gradient-card flex flex-col h-full">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>AI Assistant</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Powered by Lovable AI
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.role === "user"
                          ? "bg-primary"
                          : "bg-gradient-primary"
                      }`}
                    >
                      {message.role === "user" ? (
                        <Shield className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                    <div
                      className={`flex-1 space-y-2 ${
                        message.role === "user" ? "items-end" : ""
                      }`}
                    >
                      <div
                        className={`inline-block p-3 rounded-lg max-w-[85%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-secondary"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>

                      {message.suggestedCommand && (
                        <div className="space-y-2 max-w-[85%]">
                          <Badge variant="outline" className="text-xs">
                            <Terminal className="w-3 h-3 mr-1" />
                            Suggested Command
                          </Badge>
                          <div className="terminal-text p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                            <code>{message.suggestedCommand}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  message.suggestedCommand || ""
                                );
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="default">
                              Execute Command
                            </Button>
                            <Button size="sm" variant="secondary">
                              Edit & Run
                            </Button>
                          </div>
                        </div>
                      )}

                      {message.role === "assistant" && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about tools, commands, vulnerabilities..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Suggestions */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Quick Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="secondary"
                  className="w-full justify-start text-left h-auto py-3 px-3"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="text-xs">{suggestion}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-base">AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Terminal className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Command Generation</p>
                  <p className="text-xs text-muted-foreground">
                    Generate safe, validated tool commands
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Vulnerability Analysis</p>
                  <p className="text-xs text-muted-foreground">
                    Decode output and recommend exploits
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tool Recommendations</p>
                  <p className="text-xs text-muted-foreground">
                    Suggest appropriate tools for tasks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Context */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-base">Current Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Target:</span>
                <span className="font-mono">10.0.2.15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Running Scans:</span>
                <Badge variant="outline">1</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Tool:</span>
                <span>Nmap</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
