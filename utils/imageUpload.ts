
import * as ImageManipulator from 'expo-image-manipulator';
import { BACKEND_URL } from './api';
import { supabase } from '@/lib/supabase';
import { addToUploadQueue, removeFromUploadQueue, incrementUploadRetry, logUploadError, getUploadQueue } from './storage';

const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 1600;
const JPEG_QUALITY = 0.8;
const MAX_RETRY_ATTEMPTS = 5;
const UPLOAD_TIMEOUT_MS = 30000; // 30 seconds

export interface UploadResult {
  url: string;
  key: string;
}

// Compress and resize image before upload
async function compressImage(uri: string): Promise<string> {
  try {
    console.log('[ImageUpload] Compressing image:', uri);
    
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: MAX_IMAGE_WIDTH,
            height: MAX_IMAGE_HEIGHT,
          },
        },
      ],
      {
        compress: JPEG_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    console.log('[ImageUpload] Image compressed successfully');
    return manipResult.uri;
  } catch (error) {
    console.error('[ImageUpload] Compression failed:', error);
    // Return original URI if compression fails
    return uri;
  }
}

// Upload with retry and exponential backoff
async function uploadWithRetry(
  uri: string,
  endpoint: string,
  retryCount: number = 0
): Promise<UploadResult> {
  try {
    console.log('[ImageUpload] Upload attempt', retryCount + 1, 'of', MAX_RETRY_ATTEMPTS);
    console.log('[ImageUpload] Uploading to:', `${BACKEND_URL}${endpoint}`);
    
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }
    
    // Prepare form data
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[ImageUpload] Upload successful:', result.url);
      
      return {
        url: result.url,
        key: result.key || '',
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Upload timeout - please check your connection');
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[ImageUpload] Upload attempt failed:', error.message);
    
    // Retry with exponential backoff
    if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
      const delayMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
      console.log('[ImageUpload] Retrying in', delayMs, 'ms...');
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return uploadWithRetry(uri, endpoint, retryCount + 1);
    }
    
    // Max retries exceeded
    const errorMessage = `Upload failed after ${MAX_RETRY_ATTEMPTS} attempts: ${error.message}`;
    await logUploadError(errorMessage);
    throw new Error(errorMessage);
  }
}

// Main upload function with compression and retry
export async function uploadImage(
  uri: string,
  type: 'profile' | 'roster' = 'profile'
): Promise<UploadResult> {
  try {
    console.log('[ImageUpload] Starting upload process for:', type);
    
    // Step 1: Compress image
    const compressedUri = await compressImage(uri);
    
    // Step 2: Choose correct endpoint based on type
    const endpoint = type === 'roster'
      ? '/api/upload/roster-image'
      : '/api/upload/profile-image';
    
    const result = await uploadWithRetry(compressedUri, endpoint);
    
    console.log('[ImageUpload] Upload complete:', result.url);
    return result;
  } catch (error: any) {
    console.error('[ImageUpload] Upload failed:', error);
    
    // Add to queue for later retry
    await addToUploadQueue({
      uri,
      type,
    });
    
    throw error;
  }
}

// Process queued uploads (call this on app startup or network reconnect)
export async function processUploadQueue(): Promise<void> {
  const queue = await getUploadQueue();
  
  if (queue.length === 0) {
    console.log('[ImageUpload] No queued uploads');
    return;
  }
  
  console.log('[ImageUpload] Processing', queue.length, 'queued uploads');
  
  for (const upload of queue) {
    try {
      console.log('[ImageUpload] Processing queued upload:', upload.id);
      
      const result = await uploadImage(upload.uri, upload.type);
      
      // Upload successful - remove from queue
      await removeFromUploadQueue(upload.id);
      console.log('[ImageUpload] Queued upload successful:', upload.id);
      
      // TODO: Update the profile/roster with the new image URL
      // This would require additional context about which profile to update
    } catch (error) {
      console.error('[ImageUpload] Queued upload failed:', upload.id, error);
      
      // Increment retry count
      await incrementUploadRetry(upload.id);
      
      // Remove from queue if max retries exceeded
      if (upload.retryCount >= MAX_RETRY_ATTEMPTS - 1) {
        console.log('[ImageUpload] Max retries exceeded, removing from queue:', upload.id);
        await removeFromUploadQueue(upload.id);
      }
    }
  }
}
