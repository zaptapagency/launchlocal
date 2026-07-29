import { env } from '@/lib/config';

/**
 * Storage adapter for file uploads
 */
export interface StorageAdapter {
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

/**
 * R2 (Cloudflare) adapter for production
 */
export const r2Adapter: StorageAdapter = {
  async uploadFile(_key: string, _buffer: Buffer, _contentType: string): Promise<string> {
    // TODO: Implement R2 upload
    throw new Error('R2 adapter not implemented yet');
  },

  async deleteFile(_key: string): Promise<void> {
    // TODO: Implement R2 delete
    throw new Error('R2 adapter not implemented yet');
  },

  getPublicUrl(key: string): string {
    if (!env.R2_PUBLIC_URL) {
      throw new Error('R2_PUBLIC_URL not configured');
    }
    return `${env.R2_PUBLIC_URL}/${key}`;
  },
};

/**
 * Local disk adapter for development
 */
export const localStorageAdapter: StorageAdapter = {
  async uploadFile(key: string, _buffer: Buffer, _contentType: string): Promise<string> {
    // In real implementation, write to local disk
    console.log('MOCK: Upload to local storage:', key);
    // Return a mock URL that will work in development
    return `http://localhost:3000/api/files/${key}`;
  },

  async deleteFile(key: string): Promise<void> {
    console.log('MOCK: Delete from local storage:', key);
    // In real implementation, delete from disk
  },

  getPublicUrl(key: string): string {
    return `http://localhost:3000/api/files/${key}`;
  },
};

/**
 * Get storage adapter based on environment
 */
export function getStorageAdapter(): StorageAdapter {
  return env.MOCK_MODE ? localStorageAdapter : r2Adapter;
}
