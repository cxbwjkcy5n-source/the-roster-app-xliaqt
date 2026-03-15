import { randomUUID } from 'crypto';
import { supabase, isSupabaseConfigured } from './supabase.js';

/**
 * Ensure a storage bucket exists (ignore errors if it already exists)
 */
export async function ensureBucketExists(bucketName: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  try {
    await supabase.storage.createBucket(bucketName, { public: true });
  } catch (error: any) {
    // Ignore errors - bucket might already exist
    if (!error.message?.includes('already exists')) {
      console.warn(`Warning: Could not create bucket ${bucketName}:`, error.message);
    }
  }
}

/**
 * Convert base64 or HTTPS image to Buffer
 */
export async function imageToBuffer(image: string): Promise<Buffer> {
  // Handle data URL (base64)
  if (image.startsWith('data:')) {
    // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64Part = image.split(',')[1];
    if (!base64Part) {
      throw new Error('Invalid base64 data URL format');
    }
    return Buffer.from(base64Part, 'base64');
  }

  // Handle HTTPS URL
  if (image.startsWith('https://')) {
    const response = await fetch(image);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error('Image must be a data URL or HTTPS URL');
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  bucket: string,
  image: string,
): Promise<{ url: string; key: string }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  // Ensure bucket exists
  await ensureBucketExists(bucket);

  // Convert image to buffer
  const buffer = await imageToBuffer(image);

  // Generate unique filename
  const filename = `${randomUUID()}.jpg`;
  const key = `${bucket}/${filename}`;

  // Upload to Supabase Storage
  const { error } = await supabase.storage.from(bucket).upload(filename, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filename);

  return {
    url: publicUrlData.publicUrl,
    key,
  };
}
