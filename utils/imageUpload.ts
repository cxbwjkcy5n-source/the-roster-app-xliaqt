
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { EncodingType } from 'expo-file-system';
import { BACKEND_URL } from './api';
import { supabase } from '@/lib/supabase';
import { addToUploadQueue, removeFromUploadQueue, incrementUploadRetry, logUploadError, getUploadQueue } from './storage';

// Get the Bearer token using the same auth system as the rest of the app (Supabase)
async function getBearerToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      console.log('[ImageUpload] Got Bearer token from Supabase session');
      return session.access_token;
    }
    console.warn('[ImageUpload] No active Supabase session found');
    return null;
  } catch (error) {
    console.error('[ImageUpload] Error retrieving session token:', error);
    return null;
  }
}

const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 1000;
const JPEG_QUALITY = 0.7;
const MAX_RETRY_ATTEMPTS = 3;
const UPLOAD_TIMEOUT_MS = 30000;

export interface UploadResult {
  url: string;
  key: string;
}

// Compress, resize, and convert image to base64 data URL
async function compressAndEncodeImage(uri: string): Promise<string> {
  try {
    console.log('[ImageUpload] Compressing image:', uri);

    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_HEIGHT } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log('[ImageUpload] Reading compressed image as base64...');
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: EncodingType.Base64,
    });

    const dataUrl = `data:image/jpeg;base64,${base64}`;
    console.log('[ImageUpload] Base64 encoded, length:', dataUrl.length);
    return dataUrl;
  } catch (error) {
    console.error('[ImageUpload] Compression/encoding failed:', error);
    // Fall back to reading original as base64
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (fallbackError) {
      console.error('[ImageUpload] Fallback encoding also failed:', fallbackError);
      // Last resort: return the URI as-is (works for remote URLs)
      return uri;
    }
  }
}

// Upload base64 image data as JSON
async function uploadWithRetry(
  imageData: string,
  endpoint: string,
  retryCount: number = 0
): Promise<UploadResult> {
  try {
    console.log('[ImageUpload] Upload attempt', retryCount + 1, 'of', MAX_RETRY_ATTEMPTS);
    console.log('[ImageUpload] Uploading to:', `${BACKEND_URL}${endpoint}`);

    const token = await getBearerToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('[ImageUpload] Upload successful:', result.url?.substring(0, 60) + '...');

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

    if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
      const delayMs = Math.min(1000 * Math.pow(2, retryCount), 8000);
      console.log('[ImageUpload] Retrying in', delayMs, 'ms...');
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return uploadWithRetry(imageData, endpoint, retryCount + 1);
    }

    const errorMessage = `Upload failed after ${MAX_RETRY_ATTEMPTS} attempts: ${error.message}`;
    await logUploadError(errorMessage);
    throw new Error(errorMessage);
  }
}

// Main upload function — compresses to base64 and POSTs as JSON
export async function uploadImage(
  uri: string,
  type: 'profile' | 'roster' = 'profile'
): Promise<UploadResult> {
  try {
    console.log('[ImageUpload] Starting upload process for type:', type, 'uri:', uri);

    // If it's already a remote URL, send it directly
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      console.log('[ImageUpload] URI is already a remote URL, sending as-is');
      const endpoint = type === 'roster' ? '/api/upload/roster-image' : '/api/upload/profile-image';
      return await uploadWithRetry(uri, endpoint);
    }

    // Compress and encode to base64 data URL
    const imageData = await compressAndEncodeImage(uri);

    const endpoint = type === 'roster'
      ? '/api/upload/roster-image'
      : '/api/upload/profile-image';

    console.log('[ImageUpload] Using endpoint:', endpoint);
    const result = await uploadWithRetry(imageData, endpoint);

    console.log('[ImageUpload] Upload complete');
    return result;
  } catch (error: any) {
    console.error('[ImageUpload] Upload failed:', error);

    await addToUploadQueue({ uri, type });
    throw error;
  }
}

// Process queued uploads (call on app startup or network reconnect)
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
      await uploadImage(upload.uri, upload.type);
      await removeFromUploadQueue(upload.id);
      console.log('[ImageUpload] Queued upload successful:', upload.id);
    } catch (error) {
      console.error('[ImageUpload] Queued upload failed:', upload.id, error);
      await incrementUploadRetry(upload.id);
      if (upload.retryCount >= MAX_RETRY_ATTEMPTS - 1) {
        console.log('[ImageUpload] Max retries exceeded, removing from queue:', upload.id);
        await removeFromUploadQueue(upload.id);
      }
    }
  }
}
