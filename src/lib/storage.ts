import * as DocumentPicker from "expo-document-picker";
import { supabase } from "./supabase";

/**
 * Pick a document using the system file picker.
 */
export async function pickDocument() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0];
}

/**
 * Upload a file to Supabase Storage.
 * Returns the public/signed URL of the uploaded file.
 */
export async function uploadFile(
  bucket: string,
  path: string,
  uri: string,
  contentType: string
): Promise<string> {
  // Fetch file as blob
  const response = await fetch(uri);
  const blob = await response.blob();

  // Convert blob to arraybuffer
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  // Get public URL for public buckets, signed URL for private
  if (bucket === "avatars" || bucket === "logos") {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  }

  // For private buckets, return the path (we'll generate signed URLs on demand)
  return path;
}

/**
 * Generate a signed URL for a private file (valid for 1 hour).
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * Generate a unique file path for storage.
 */
export function generateFilePath(
  prefix: string,
  fileName: string,
  userId: string
): string {
  const timestamp = Date.now();
  const ext = fileName.split(".").pop() ?? "pdf";
  return `${prefix}/${userId}/${timestamp}.${ext}`;
}
