import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
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
  const { notes, addNote, deleteNote, updateNote, loadNotes } = useNoteContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const accentColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const textSecondary = Colors[colorScheme ?? "light"].textSecondary;
  const dangerColor = Colors[colorScheme ?? "light"].danger;
  const colors = Colors[colorScheme ?? "light"];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNote = async () => {
    if (newNoteContent.trim()) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingNoteId(noteId);
    setNewNoteContent(content);
    setShowAddModal(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await deleteNote(noteId);
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  const renderRightActions = (noteId: string) => {
    return (
      <Pressable
        style={[styles.deleteSwipeAction, { backgroundColor: dangerColor }]}
        onPress={() => handleDeleteNote(noteId)}
        data-testid={`note-swipe-delete-${noteId}`}
      >
        <MaterialIcons name="delete" size={24} color="#fff" />
        <ThemedText type="defaultSemiBold" style={{ color: "#fff", marginTop: 4 }}>
          Delete
        </ThemedText>
      </Pressable>
    );
  };

  const renderNoteItem = ({ item: note }: { item: any }) => {
    const preview = note.content.split("\n")[0].substring(0, 100);

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(note.id)}
        overshootRight={false}
      >
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
            data-testid={`note-item-${note.id}`}
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
              onPress={() => handleDeleteNote(note.id)}
              style={styles.deleteButton}
              data-testid={`note-delete-${note.id}`}
            >
              <MaterialIcons name="close" size={20} color={dangerColor} />
            </Pressable>
          </Pressable>
        </Animated.View>
      </Swipeable>
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setEditingNoteId(null);
            setNewNoteContent("");
            setShowAddModal(true);
          }}
          style={[styles.addButton, { backgroundColor: accentColor }]}
          data-testid="add-note-button"
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Search Bar */}
      {notes.length > 0 && (
        <View style={[styles.searchContainer, { paddingHorizontal: Spacing.lg }]}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surface,
                borderColor: colors.divider,
              },
            ]}
          >
            <MaterialIcons name="search" size={20} color={textSecondary} />
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: textColor,
                },
              ]}
              placeholder="Search notes..."
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              data-testid="notes-search-input"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSearchQuery("");
                }}
                data-testid="notes-search-clear"
              >
                <MaterialIcons name="close" size={20} color={textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {filteredNotes.length === 0 && searchQuery.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="note" size={48} color={textSecondary} />
          <ThemedText type="subtitle" style={{ marginTop: Spacing.lg }}>
            No notes yet
          </ThemedText>
          <ThemedText type="default" style={{ color: textSecondary, marginTop: Spacing.sm }}>
            Create a note to get started
          </ThemedText>
        </View>
      ) : filteredNotes.length === 0 && searchQuery.length > 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="search-off" size={48} color={textSecondary} />
          <ThemedText type="subtitle" style={{ marginTop: Spacing.lg }}>
            No results found
          </ThemedText>
          <ThemedText type="default" style={{ color: textSecondary, marginTop: Spacing.sm }}>
            Try a different search term
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
            />
          }
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
              data-testid="save-note-button"
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
    marginBottom: Spacing.md,
  },
  searchContainer: {
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
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
  deleteSwipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginLeft: Spacing.sm,
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
