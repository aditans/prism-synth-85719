import { Button } from '@/components/ui/button';
import { Download, FileDown, Loader2 } from 'lucide-react';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { downloadFile } from '@/lib/file-utils';

// Helper function to format file size
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export interface FileDownloaderProps {
  file: File | Uint8Array | null;
  fileName?: string;
  label?: string;
  className?: string;
  isLoading?: boolean;
  onDownload?: () => void;
}

export function FileDownloader({
  file,
  fileName = 'downloaded_file',
  label = 'Download File',
  className,
  isLoading = false,
  onDownload,
}: FileDownloaderProps) {
  const handleDownload = useCallback(() => {
    if (!file) return;
    
    let downloadName = fileName;
    
    try {
      // Handle different file types
      if (file instanceof File) {
        downloadName = file.name;
        downloadFile(file, downloadName, file.type);
      } else if (file instanceof Uint8Array) {
        if (!downloadName.endsWith('.enc')) {
          downloadName += '.enc';
        }
        // Pass the Uint8Array directly - downloadFile will handle it
        downloadFile(file, downloadName, 'application/octet-stream');
      } else {
        console.error('Unsupported file type for download');
        return;
      }

      // Call the onDownload callback if provided
      onDownload?.();
    } catch (error) {
      console.error('Error during download:', error);
    }
  }, [file, fileName, onDownload]);

  const getFileInfo = useCallback(() => {
    if (!file) return null;
    
    if (file instanceof File) {
      return {
        name: file.name,
        size: formatSize(file.size),
        type: file.type || 'Unknown',
      };
    } else if (file instanceof Uint8Array) {
      return {
        name: fileName,
        size: formatSize(file.byteLength),
        type: 'Encrypted Data',
      };
    }
    return null;
  }, [file, fileName]);

  const fileInfo = getFileInfo();

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {fileInfo && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center space-x-3">
            <FileDown className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-medium truncate max-w-[200px]">
                {fileInfo.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {fileInfo.size} • {fileInfo.type}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isLoading || !file}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {label}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
