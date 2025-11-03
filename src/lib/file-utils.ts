/**
 * Converts various data types to a Blob for file creation
 */
export const toBlob = (data: unknown, type = 'application/octet-stream'): Blob => {
  if (data instanceof Blob) {
    return data;
  }
  
  if (data instanceof ArrayBuffer) {
    return new Blob([new Uint8Array(data)], { type });
  }
  
  if (ArrayBuffer.isView(data)) {
    // Handle TypedArray or DataView
    return new Blob([data as BlobPart], { type });
  }
  
  if (typeof data === 'string') {
    return new Blob([data], { type: 'text/plain' });
  }
  
  // For any other type, try to stringify it
  try {
    return new Blob([JSON.stringify(data)], { type: 'application/json' });
  } catch (error) {
    console.error('Failed to convert data to Blob:', error);
    return new Blob([String(data)], { type: 'text/plain' });
  }
};

/**
 * Creates a File object from data with the given filename
 */
export const createFile = (
  data: unknown, 
  filename: string, 
  options?: FilePropertyBag
): File => {
  const blob = toBlob(data, options?.type);
  return new File([blob], filename, {
    type: options?.type || 'application/octet-stream',
    lastModified: options?.lastModified || Date.now(),
  });
};

/**
 * Formats file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Extracts the base filename without extension
 */
export const getBaseFilename = (filename: string): string => {
  return filename.replace(/\.[^/.]+$/, ''); // Remove file extension
};

/**
 * Checks if a filename has a specific extension (case insensitive)
 */
export const hasExtension = (filename: string, extension: string): boolean => {
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;
  const regex = new RegExp(`\\.${ext}$`, 'i');
  return regex.test(filename);
};

/**
 * Downloads a file to the user's computer
 */
export const downloadFile = (
  data: unknown,
  filename: string,
  type = 'application/octet-stream'
): void => {
  let blob: Blob;
  
  if (data instanceof Blob) {
    // If it's already a Blob, use it directly
    blob = data;
  } else if (data instanceof ArrayBuffer) {
    // Handle ArrayBuffer
    blob = new Blob([new Uint8Array(data)], { type });
  } else if (ArrayBuffer.isView(data)) {
    // Handle TypedArray (Uint8Array, etc.)
    // Create a new ArrayBuffer with just the data we need
    const arrayBuffer = new ArrayBuffer(data.byteLength);
    const view = new Uint8Array(arrayBuffer);
    view.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), 0);
    blob = new Blob([arrayBuffer], { type });
  } else if (typeof data === 'string') {
    // Handle string data
    blob = new Blob([data], { type: type || 'text/plain' });
  } else if (Array.isArray(data)) {
    // Handle array of BlobParts
    blob = new Blob(data as BlobPart[], { type });
  } else {
    // For any other type, try to stringify it
    try {
      blob = new Blob([JSON.stringify(data)], { type: type || 'application/json' });
    } catch (error) {
      console.error('Failed to create Blob from data:', error);
      return;
    }
  }
    
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};
