import { Search, Lock, Unlock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export function Topbar() {
  const [isLocked, setIsLocked] = useState(true);

  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center gap-4">
      <div className="flex-1 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search targets, scans, findings..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium">Backend Connected</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsLocked(!isLocked)}
          className="relative"
        >
          {isLocked ? (
            <Lock className="w-4 h-4 text-destructive" />
          ) : (
            <Unlock className="w-4 h-4 text-success" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[10px]">
            3
          </Badge>
        </Button>
      </div>
    </header>
  );
}
