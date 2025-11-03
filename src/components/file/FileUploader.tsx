import { useCallback, useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUp, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEncryption } from '@/hooks/useEncryption';

export interface FileUploaderProps {
  onFileProcessed?: (file: File, encryptedData?: Uint8Array) => void;
  className?: string;
  accept?: string;
  multiple?: boolean;
  label?: string;
}

export function FileUploader({
  onFileProcessed,
  className,
  accept = '*/*',
  multiple = false,
  label = 'Drag & drop files here or click to browse',
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { encryptFile, progress: encryptionProgress } = useEncryption();

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = multiple ? e.dataTransfer.files[0] : e.dataTransfer.files;
      handleFiles(file);
      e.dataTransfer.clearData();
    }
  }, [multiple]);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = multiple ? e.target.files : e.target.files[0];
      if (file) {
        void handleFiles(file);
        // Reset the input value to allow selecting the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  }, [multiple, handleFiles]);

  const handleFiles = useCallback(async (files: FileList | File) => {
    try {
      const file = files instanceof FileList ? files[0] : files;
      if (!file) {
        console.error('No file selected');
        return;
      }
      
      setSelectedFile(file);
      
      // First, just pass the file to the parent without encryption
      onFileProcessed?.(file);
      
      // Then handle encryption in the background if needed
      try {
        const result = await encryptFile(file);
        if (result.success && result.data) {
          onFileProcessed?.(file, result.data);
        } else {
          console.error('Encryption failed:', result.message);
        }
      } catch (error) {
        console.error('Encryption error:', error);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setProgress(0);
    }
  }, [encryptFile, onFileProcessed]);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setProgress(0);
  }, []);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Update progress when encryption progress changes
  useEffect(() => {
    if (encryptionProgress) {
      setProgress(encryptionProgress.percentage);
    }
  }, [encryptionProgress]);

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25',
          selectedFile && 'border-primary/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept={accept}
          multiple={multiple}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <UploadCloud className={cn(
            'h-10 w-10 mb-2',
            isDragging ? 'text-primary' : 'text-muted-foreground'
          )} />
          
          {selectedFile ? (
            <div className="flex items-center gap-2">
              <FileUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium truncate max-w-xs">
                {selectedFile.name}
              </span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {label}
              </p>
              <p className="text-xs text-muted-foreground">
                {accept === '*/*' ? 'Any file type' : `Supported: ${accept}`}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => e.stopPropagation()}
              >
                Select File
              </Button>
            </>
          )}
        </div>
      </div>
      
      {(progress > 0 && progress < 100) && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}
