/**
 * Converts various data types to a Blob for file creation
 */
export const toBlob = (data: unknown): Blob => {
  if (data instanceof Blob) {
    return data;
  }
  
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return new Blob([data], { type: 'application/octet-stream' });
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
export const createFile = (data: unknown, filename: string, options?: FilePropertyBag): File => {
  const blob = toBlob(data);
  return new File([blob], filename, {
    type: options?.type || 'application/octet-stream',
    lastModified: options?.lastModified || Date.now(),
  });
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
  const regex = new RegExp(`\.${ext}$`, 'i');
  return regex.test(filename);
};
