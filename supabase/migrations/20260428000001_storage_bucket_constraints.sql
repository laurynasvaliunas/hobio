-- Server-side enforcement for file uploads. The client also validates in
-- src/lib/storage.ts, but a malicious client could bypass that — these
-- bucket-level constraints make Supabase reject oversized or wrong-type
-- uploads at the storage layer.

-- 10 MB cap, jpeg/png/heic/webp/pdf only.
UPDATE storage.buckets
   SET file_size_limit = 10485760,  -- 10 MB
       allowed_mime_types = ARRAY[
         'image/jpeg',
         'image/jpg',
         'image/png',
         'image/heic',
         'image/heif',
         'image/webp',
         'application/pdf'
       ]
 WHERE id IN ('avatars', 'logos', 'documents', 'contracts');
