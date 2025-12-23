import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useNoteContext } from "@/context/NoteContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { notes, addNote, deleteNote, updateNote } = useNoteContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const accentColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const textSecondary = Colors[colorScheme ?? "light"].textSecondary;
  const dangerColor = Colors[colorScheme ?? "light"].danger;
  const colors = Colors[colorScheme ?? "light"];

  const handleAddNote = async () => {
    if (newNoteContent.trim()) {
      if (editingNoteId) {
        await updateNote(editingNoteId, newNoteContent);
        setEditingNoteId(null);
      } else {
        await addNote(newNoteContent);
      }
      setNewNoteContent("");
      setShowAddModal(false);
    }
  };

  const handleEditNote = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setNewNoteContent(content);
    setShowAddModal(true);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  const renderNoteItem = ({ item: note }: { item: any }) => {
    const preview = note.content.split("\n")[0].substring(0, 100);

    return (
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <Pressable
          style={[
            styles.noteCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.divider,
            },
          ]}
          onPress={() => handleEditNote(note.id, note.content)}
        >
          <View style={styles.noteContent}>
            <ThemedText type="defaultSemiBold" numberOfLines={2}>
              {preview}
            </ThemedText>
            <ThemedText
              type="default"
              style={{ color: textSecondary, marginTop: Spacing.sm, fontSize: 12 }}
            >
              {formatDate(note.createdAt)}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => deleteNote(note.id)}
            style={styles.deleteButton}
          >
            <MaterialIcons name="close" size={20} color={dangerColor} />
          </Pressable>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Spacing.lg),
          paddingBottom: Math.max(insets.bottom, Spacing.lg),
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText type="title" style={{ fontSize: 28 }}>
          Notes
        </ThemedText>
        <Pressable
          onPress={() => {
            setEditingNoteId(null);
            setNewNoteContent("");
            setShowAddModal(true);
          }}
          style={[styles.addButton, { backgroundColor: accentColor }]}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="note" size={48} color={textSecondary} />
          <ThemedText type="subtitle" style={{ marginTop: Spacing.lg }}>
            No notes yet
          </ThemedText>
          <ThemedText type="default" style={{ color: textSecondary, marginTop: Spacing.sm }}>
            Create a note to get started
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              {
                paddingTop: Math.max(insets.top, Spacing.lg),
                paddingBottom: Math.max(insets.bottom, Spacing.lg),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={{ fontSize: 24 }}>
                {editingNoteId ? "Edit Note" : "New Note"}
              </ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.noteInput,
                {
                  borderColor: colors.divider,
                  color: textColor,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholder="Write your note here..."
              placeholderTextColor={textSecondary}
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <Pressable
              onPress={handleAddNote}
              disabled={!newNoteContent.trim()}
              style={[
                styles.button,
                {
                  backgroundColor: accentColor,
                  opacity: !newNoteContent.trim() ? 0.5 : 1,
                },
              ]}
            >
              <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                {editingNoteId ? "Update Note" : "Save Note"}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  noteCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteContent: {
    flex: 1,
  },
  deleteButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    fontSize: 16,
    minHeight: 200,
  },
  button: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
  },
});
