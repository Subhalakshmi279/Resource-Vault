import { supabase } from '../supabaseClient';

/**
 * Uploads a file (Blob or File) to the 'vault-files' storage bucket.
 * Routes files to 'images/' or 'documents/' folders depending on their MIME type.
 * Returns the relative storage path (e.g., 'images/unique-id.png').
 */
export async function uploadFileToStorage(file: Blob | File, customName?: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const fileType = file.type;
  const isImage = fileType.startsWith('image/');
  const folder = isImage ? 'images' : 'documents';
  
  // Generate a unique filename if not provided
  let fileName = customName || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  if (!customName) {
    const extension = isImage ? 'png' : fileType === 'application/pdf' ? 'pdf' : 'txt';
    fileName = `${fileName}.${extension}`;
  }

  const relativePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from('vault-files')
    .upload(relativePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw error;
  }

  return relativePath;
}

/**
 * Resolves a relative storage path (e.g. 'images/abc.png') to a runtime public URL.
 */
export function getStoragePublicUrl(relativePath: string): string {
  if (!supabase || !relativePath) return '';
  const { data } = supabase.storage.from('vault-files').getPublicUrl(relativePath);
  return data.publicUrl || '';
}

/**
 * Helper to convert Base64 data url (data:...;base64,...) to a binary Blob
 */
export function base64ToBlob(base64DataUrl: string): Blob {
  const parts = base64DataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Deletes a file from the 'vault-files' storage bucket given its relative path.
 */
export async function deleteFileFromStorage(relativePath: string): Promise<void> {
  if (!supabase || !relativePath || relativePath.startsWith('data:')) return;
  const { error } = await supabase.storage.from('vault-files').remove([relativePath]);
  if (error) throw error;
}
