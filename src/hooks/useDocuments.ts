import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { uploadFile, getSignedUrl, deleteFile, generateFilePath } from "../lib/storage";
import type { Document, DocumentCategory, DocumentAcknowledgement } from "../types/database.types";

export interface DocumentWithStatus extends Document {
  acknowledged?: boolean;
  signedUrl?: string;
}

interface UseDocumentsReturn {
  documents: DocumentWithStatus[];
  isLoading: boolean;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (
    title: string,
    description: string | null,
    category: DocumentCategory,
    isRequired: boolean,
    fileUri: string,
    fileName: string,
    fileSize: number | null,
    fileType: string | null,
    userId: string
  ) => Promise<Document>;
  removeDocument: (docId: string, fileUrl: string) => Promise<void>;
  acknowledgeDocument: (docId: string, userId: string) => Promise<void>;
  getDocumentUrl: (fileUrl: string) => Promise<string>;
}

export function useDocuments(groupId: string, profileId?: string): UseDocumentsReturn {
  const [documents, setDocuments] = useState<DocumentWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const docs = (data as Document[]) ?? [];

      // Check acknowledgements if we have a profile
      if (profileId) {
        const { data: acks } = await supabase
          .from("document_acknowledgements")
          .select("document_id")
          .eq("profile_id", profileId);

        const ackedSet = new Set(
          (acks ?? []).map((a: { document_id: string }) => a.document_id)
        );

        setDocuments(
          docs.map((d) => ({ ...d, acknowledged: ackedSet.has(d.id) }))
        );
      } else {
        setDocuments(docs);
      }
    } catch (error) {
      console.error("Fetch documents error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, profileId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (
    title: string,
    description: string | null,
    category: DocumentCategory,
    isRequired: boolean,
    fileUri: string,
    fileName: string,
    fileSize: number | null,
    fileType: string | null,
    userId: string
  ) => {
    // Upload file to storage
    const storagePath = generateFilePath("group-docs", fileName, groupId);
    const fileUrl = await uploadFile(
      "documents",
      storagePath,
      fileUri,
      fileType ?? "application/pdf"
    );

    // Create document record
    const { data, error } = await supabase
      .from("documents")
      .insert({
        group_id: groupId,
        uploaded_by: userId,
        title,
        description,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        category,
        is_required: isRequired,
      })
      .select()
      .single();

    if (error) throw error;

    const newDoc = data as Document;
    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  };

  const removeDocument = async (docId: string, fileUrl: string) => {
    // Delete from storage
    try {
      await deleteFile("documents", fileUrl);
    } catch {
      // File might not exist, continue with DB deletion
    }

    // Delete from DB
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) throw error;

    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const acknowledgeDocument = async (docId: string, userId: string) => {
    const { error } = await supabase.from("document_acknowledgements").insert({
      document_id: docId,
      profile_id: userId,
    });
    if (error) throw error;

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, acknowledged: true } : d))
    );
  };

  const getDocumentUrl = async (fileUrl: string) => {
    return getSignedUrl("documents", fileUrl);
  };

  return {
    documents,
    isLoading,
    fetchDocuments,
    uploadDocument,
    removeDocument,
    acknowledgeDocument,
    getDocumentUrl,
  };
}
