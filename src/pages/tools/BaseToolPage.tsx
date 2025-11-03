import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ToolStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error';

interface BaseToolPageProps {
  title: string;
  description: string;
  status: ToolStatus;
  error?: string;
  onStart: () => void;
  onStop: () => void;
  children?: React.ReactNode;
  docsLink?: string;
  docsLabel?: string;
}

export function BaseToolPage({
  title,
  description,
  status,
  error,
  onStart,
  onStop,
  children,
  docsLink,
  docsLabel = "Documentation"
}: BaseToolPageProps) {
  const isRunning = status === 'running';
  const isLoading = status === 'starting' || status === 'stopping';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-2">
          {docsLink && (
            <Button variant="outline" asChild>
              <a href={docsLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {docsLabel}
              </a>
            </Button>
          )}
          {isRunning ? (
            <Button variant="destructive" onClick={onStop} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Stopping...
                </>
              ) : (
                'Stop'
              )}
            </Button>
          ) : (
            <Button onClick={onStart} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start'
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {children || (
          <Card>
            <CardHeader>
              <CardTitle>No configuration needed</CardTitle>
              <CardDescription>
                Click the Start button to begin using this tool.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
