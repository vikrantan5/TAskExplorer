import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Switch,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useTaskContext } from "@/context/TaskContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TodosScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { categories, tasks, addCategory, addTask, toggleTask, deleteTask } = useTaskContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDaily, setIsDaily] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const accentColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const textSecondary = Colors[colorScheme ?? "light"].textSecondary;
  const surfaceColor = Colors[colorScheme ?? "light"].surface;
  const dangerColor = Colors[colorScheme ?? "light"].danger;
  const colors = Colors[colorScheme ?? "light"];

  const toggleCategoryExpanded = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const handleAddCategory = async () => {
    if (newCategoryTitle.trim()) {
      await addCategory(newCategoryTitle);
      setNewCategoryTitle("");
    }
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim() && selectedCategory) {
      await addTask(selectedCategory, newTaskTitle, isDaily);
      setNewTaskTitle("");
      setSelectedCategory(null);
      setIsDaily(false);
      setShowAddModal(false);
    }
  };

  const getCategoryTasks = (categoryId: string) => {
    return tasks.filter((task) => task.categoryId === categoryId);
  };

  const renderCategoryHeader = (category: any) => {
    const categoryTasks = getCategoryTasks(category.id);
    const completedCount = categoryTasks.filter((t) => t.isCompleted).length;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <Pressable
        key={category.id}
        onPress={() => toggleCategoryExpanded(category.id)}
        style={[
          styles.categoryHeader,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <View style={styles.categoryInfo}>
          <ThemedText type="subtitle" style={{ fontSize: 18 }}>
            {category.title}
          </ThemedText>
          <ThemedText type="default" style={{ color: textSecondary, fontSize: 12 }}>
            {completedCount}/{categoryTasks.length} completed
          </ThemedText>
        </View>
        <MaterialIcons
          name={isExpanded ? "expand-less" : "expand-more"}
          size={24}
          color={accentColor}
        />
      </Pressable>
    );
  };

  const renderTaskItem = (task: any) => {
    return (
      <Animated.View key={task.id} entering={FadeIn} exiting={FadeOut}>
        <Pressable
          style={[
            styles.taskItem,
            {
              backgroundColor: task.isCompleted ? colors.surface : colors.card,
              borderLeftColor: task.isDaily ? colors.warning : accentColor,
              borderColor: colors.cardBorder,
              borderWidth: 1,
              borderLeftWidth: 4,
            },
          ]}
          onPress={() => toggleTask(task.id)}
        >
          <Pressable
            style={[
              styles.checkbox,
              {
                borderColor: task.isCompleted ? colors.success || "#34C759" : accentColor,
                backgroundColor: task.isCompleted ? colors.success || "#34C759" : "transparent",
              },
            ]}
            onPress={() => toggleTask(task.id)}
          >
            {task.isCompleted && (
              <MaterialIcons name="check" size={16} color="#fff" />
            )}
          </Pressable>

          <View style={styles.taskContent}>
            <ThemedText
              type="default"
              style={[
                {
                  textDecorationLine: task.isCompleted ? "line-through" : "none",
                  opacity: task.isCompleted ? 0.6 : 1,
                },
              ]}
            >
              {task.title}
            </ThemedText>
            {task.isDaily && (
              <ThemedText type="default" style={{ fontSize: 12, color: colors.warning }}>
                🔁 Resets daily at midnight
              </ThemedText>
            )}
          </View>

          <Pressable
            onPress={() => deleteTask(task.id)}
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
          Tasks
        </ThemedText>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={[styles.addButton, { backgroundColor: accentColor }]}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={48} color={textSecondary} />
            <ThemedText type="subtitle" style={{ marginTop: Spacing.lg }}>
              No categories yet
            </ThemedText>
            <ThemedText type="default" style={{ color: textSecondary, marginTop: Spacing.sm }}>
              Add a category to get started
            </ThemedText>
          </View>
        ) : (
          categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const categoryTasks = getCategoryTasks(category.id);

            return (
              <View key={category.id}>
                {renderCategoryHeader(category)}
                {isExpanded && categoryTasks.length > 0 && (
                  <View style={{ backgroundColor: colors.background }}>
                    {categoryTasks.map((task) => renderTaskItem(task))}
                  </View>
                )}
                {isExpanded && categoryTasks.length === 0 && (
                  <View style={[styles.emptyCategory, { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.divider }]}>
                    <ThemedText type="default" style={{ color: textSecondary }}>
                      No tasks in this category
                    </ThemedText>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

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
                Add New
              </ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <ThemedText type="subtitle" style={{ marginTop: Spacing.lg }}>
                New Category
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.divider,
                    color: textColor,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholder="Category name (e.g., AI/ML, Gym)"
                placeholderTextColor={textSecondary}
                value={newCategoryTitle}
                onChangeText={setNewCategoryTitle}
              />
              <Pressable
                onPress={handleAddCategory}
                style={[styles.button, { backgroundColor: accentColor }]}
              >
                <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                  Create Category
                </ThemedText>
              </Pressable>

              <ThemedText type="subtitle" style={{ marginTop: Spacing.xl }}>
                New Task
              </ThemedText>

              {categories.length > 0 && (
                <>
                  <ThemedText type="default" style={{ marginTop: Spacing.lg }}>
                    Select Category
                  </ThemedText>
                  <View style={styles.categorySelector}>
                    {categories.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedCategory(cat.id)}
                        style={[
                          styles.categoryOption,
                          {
                            backgroundColor:
                              selectedCategory === cat.id ? accentColor : colors.surface,
                            borderColor: colors.divider,
                          },
                        ]}
                      >
                        <ThemedText
                          type="default"
                          style={{
                            color: selectedCategory === cat.id ? "#fff" : textColor,
                          }}
                        >
                          {cat.title}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.divider,
                        color: textColor,
                        backgroundColor: colors.surface,
                        marginTop: Spacing.lg,
                      },
                    ]}
                    placeholder="Task title"
                    placeholderTextColor={textSecondary}
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                  />

                  <View style={[styles.dailyToggle, { marginTop: Spacing.lg }]}>
                    <ThemedText type="default">Daily Recurring Task</ThemedText>
                    <Switch
                      value={isDaily}
                      onValueChange={setIsDaily}
                      trackColor={{ false: colors.divider, true: accentColor }}
                    />
                  </View>

                  <Pressable
                    onPress={handleAddTask}
                    disabled={!newTaskTitle.trim() || !selectedCategory}
                    style={[
                      styles.button,
                      {
                        backgroundColor: accentColor,
                        opacity: !newTaskTitle.trim() || !selectedCategory ? 0.5 : 1,
                      },
                    ]}
                  >
                    <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                      Add Task
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </ScrollView>
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
  content: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderLeftWidth: 4,
    marginBottom: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  taskContent: {
    flex: 1,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyCategory: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
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
  modalForm: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    fontSize: 16,
  },
  button: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  categorySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  categoryOption: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dailyToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
