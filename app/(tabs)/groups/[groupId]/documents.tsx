import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Upload,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  Shield,
  Clock,
  File,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button, Badge, EmptyState } from "../../../../src/components/ui";
import { useToast } from "../../../../src/components/ui/Toast";
import { Colors, Shadows } from "../../../../src/constants/colors";
import { useGroupStore } from "../../../../src/stores/groupStore";
import { useAuthStore } from "../../../../src/stores/authStore";
import { useDocuments, type DocumentWithStatus } from "../../../../src/hooks/useDocuments";
import { pickDocument } from "../../../../src/lib/storage";
import type { DocumentCategory } from "../../../../src/types/database.types";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  general: "General",
  waiver: "Waiver",
  rules: "Rules",
  contract: "Contract",
  medical: "Medical",
  other: "Other",
};

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  general: Colors.primary.DEFAULT,
  waiver: Colors.danger.DEFAULT,
  rules: Colors.warning.dark,
  contract: Colors.secondary.DEFAULT,
  medical: Colors.accent.DEFAULT,
  other: Colors.text.secondary,
};

function DocumentRow({
  doc,
  isOrganizer,
  onView,
  onAcknowledge,
  onDelete,
}: {
  doc: DocumentWithStatus;
  isOrganizer: boolean;
  onView: () => void;
  onAcknowledge: () => void;
  onDelete: () => void;
}) {
  const catColor = CATEGORY_COLORS[doc.category];

  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: catColor + "15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={22} color={catColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 16, fontWeight: "600", color: Colors.text.primary }}
            >
              {doc.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Badge label={CATEGORY_LABELS[doc.category]} variant="neutral" />
              {doc.is_required && <Badge label="Required" variant="danger" />}
            </View>
          </View>
          {doc.acknowledged && (
            <CheckCircle size={20} color={Colors.secondary.DEFAULT} />
          )}
        </View>

        {doc.description && (
          <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
            {doc.description}
          </Text>
        )}

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={onView}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: Colors.primary.light + "20",
            }}
          >
            <Download size={14} color={Colors.primary.DEFAULT} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.primary.DEFAULT }}>
              View
            </Text>
          </TouchableOpacity>

          {!doc.acknowledged && !isOrganizer && (
            <TouchableOpacity
              onPress={onAcknowledge}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: Colors.secondary.DEFAULT + "20",
              }}
            >
              <CheckCircle size={14} color={Colors.secondary.DEFAULT} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.secondary.DEFAULT }}>
                Acknowledge
              </Text>
            </TouchableOpacity>
          )}

          {isOrganizer && (
            <TouchableOpacity
              onPress={onDelete}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: Colors.danger.DEFAULT + "15",
              }}
            >
              <Trash2 size={14} color={Colors.danger.DEFAULT} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.danger.DEFAULT }}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

export default function DocumentsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { groups } = useGroupStore();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const group = groups.find((g) => g.id === groupId);
  const isOrganizer = profile?.role === "organizer";

  const {
    documents,
    isLoading,
    uploadDocument,
    removeDocument,
    acknowledgeDocument,
    getDocumentUrl,
  } = useDocuments(groupId, profile?.id);

  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!profile) return;

    const file = await pickDocument();
    if (!file) return;

    setUploading(true);
    try {
      await uploadDocument(
        file.name.replace(/\.[^.]+$/, ""), // title from filename
        null, // description
        "general",
        false, // is_required
        file.uri,
        file.name,
        file.size ?? null,
        file.mimeType ?? null,
        profile.id
      );
      toast.show("Document uploaded successfully");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      Alert.alert("Error", msg);
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (doc: DocumentWithStatus) => {
    try {
      const url = await getDocumentUrl(doc.file_url);
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Could not open document.");
    }
  };

  const handleDelete = (doc: DocumentWithStatus) => {
    Alert.alert("Delete Document", `Remove "${doc.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeDocument(doc.id, doc.file_url);
            toast.show("Document deleted");
          } catch {
            Alert.alert("Error", "Failed to delete.");
          }
        },
      },
    ]);
  };

  const handleAcknowledge = async (doc: DocumentWithStatus) => {
    if (!profile) return;
    try {
      await acknowledgeDocument(doc.id, profile.id);
      toast.show("Document acknowledged");
    } catch {
      Alert.alert("Error", "Failed to acknowledge.");
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          gap: 14,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}>
            Documents
          </Text>
          <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
            {group?.name}
          </Text>
        </View>
        {isOrganizer && (
          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploading}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: Colors.primary.DEFAULT,
              alignItems: "center",
              justifyContent: "center",
              opacity: uploading ? 0.5 : 1,
              ...Shadows.button,
            }}
          >
            <Upload size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
          ...(documents.length === 0 ? { flex: 1 } : {}),
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <DocumentRow
            doc={item}
            isOrganizer={isOrganizer ?? false}
            onView={() => handleView(item)}
            onAcknowledge={() => handleAcknowledge(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={<File size={36} color={Colors.primary.DEFAULT} strokeWidth={1.5} />}
              title="No documents yet"
              description={
                isOrganizer
                  ? "Upload waivers, rules, or other files for your group."
                  : "No documents have been shared with this group yet."
              }
              actionLabel={isOrganizer ? "Upload Document" : undefined}
              onAction={isOrganizer ? handleUpload : undefined}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
