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
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useTaskContext, Task, Category } from "@/context/TaskContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TodosScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { categories, tasks, addCategory, addTask, updateTask, toggleTask, deleteTask, deleteCategory, syncData, reorderTasks, reorderCategories, loading } = useTaskContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDaily, setIsDaily] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [isDraggingCategories, setIsDraggingCategories] = useState(false);

  const accentColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const textSecondary = Colors[colorScheme ?? "light"].textSecondary;
  const surfaceColor = Colors[colorScheme ?? "light"].surface;
  const dangerColor = Colors[colorScheme ?? "light"].danger;
  const colors = Colors[colorScheme ?? "light"];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await syncData();
    setRefreshing(false);
  }, [syncData]);

  const toggleCategoryExpanded = useCallback((categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addCategory(newCategoryTitle);
      setNewCategoryTitle("");
    }
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim() && selectedCategory) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addTask(selectedCategory, newTaskTitle, isDaily);
      setNewTaskTitle("");
      setSelectedCategory(null);
      setIsDaily(false);
      setShowAddModal(false);
    }
  };

  const handleEditTask = async () => {
    if (editTaskTitle.trim() && editingTask) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateTask(editingTask.id, editTaskTitle);
      setEditTaskTitle("");
      setEditingTask(null);
      setShowEditModal(false);
    }
  };

  const handleDeleteCategory = (categoryId: string, categoryTitle: string) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${categoryTitle}"? This will also delete all tasks in this category.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteCategory(categoryId);
          },
        },
      ]
    );
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setShowEditModal(true);
  };

  const getCategoryTasks = (categoryId: string) => {
    return tasks.filter((task) => task.categoryId === categoryId);
  };

  const handleDragEndCategories = useCallback(async (data: Category[]) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await reorderCategories(data);
    setIsDraggingCategories(false);
  }, [reorderCategories]);

  const handleDragEndTasks = useCallback(async (categoryId: string, data: Task[]) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await reorderTasks(categoryId, data);
  }, [reorderTasks]);

  const renderCategoryHeader = (category: Category, drag?: () => void, isActive?: boolean) => {
    const categoryTasks = getCategoryTasks(category.id);
    const completedCount = categoryTasks.filter((t) => t.isCompleted).length;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <Pressable
        key={category.id}
        onPress={() => toggleCategoryExpanded(category.id)}
        onLongPress={drag}
        disabled={isActive}
        style={[
          styles.categoryHeader,
          {
            backgroundColor: isActive ? colors.card : colors.surface,
            borderBottomColor: colors.divider,
            opacity: isActive ? 0.8 : 1,
          },
        ]}
      >
        <MaterialIcons 
          name="drag-indicator" 
          size={24} 
          color={textSecondary} 
          style={{ marginRight: Spacing.sm }}
        />
        <View style={styles.categoryInfo}>
          <ThemedText type="subtitle" style={{ fontSize: 18 }}>
            {category.title}
          </ThemedText>
          <ThemedText type="default" style={{ color: textSecondary, fontSize: 12 }}>
            {completedCount}/{categoryTasks.length} completed
          </ThemedText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteCategory(category.id, category.title);
            }}
            style={styles.categoryDeleteButton}
            data-testid={`category-delete-${category.id}`}
          >
            <MaterialIcons name="delete-outline" size={20} color={dangerColor} />
          </Pressable>
          <MaterialIcons
            name={isExpanded ? "expand-less" : "expand-more"}
            size={24}
            color={accentColor}
          />
        </View>
      </Pressable>
    );
  };

  const renderTaskItem = (task: Task, drag?: () => void, isActive?: boolean) => {
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
              opacity: isActive ? 0.8 : 1,
            },
          ]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await toggleTask(task.id);
          }}
          onLongPress={drag}
          disabled={isActive}
          data-testid={`task-item-${task.id}`}
        >
          <MaterialIcons 
            name="drag-indicator" 
            size={20} 
            color={textSecondary} 
            style={{ marginRight: Spacing.sm }}
          />
          
          <Pressable
            style={[
              styles.checkbox,
              {
                borderColor: task.isCompleted ? colors.success || "#34C759" : accentColor,
                backgroundColor: task.isCompleted ? colors.success || "#34C759" : "transparent",
              },
            ]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await toggleTask(task.id);
            }}
            data-testid={`task-checkbox-${task.id}`}
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
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openEditModal(task);
            }}
            style={styles.editButton}
            data-testid={`task-edit-${task.id}`}
          >
            <MaterialIcons name="edit" size={18} color={accentColor} />
          </Pressable>

          <Pressable
            onPress={async () => {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteTask(task.id);
            }}
            style={styles.deleteButton}
            data-testid={`task-delete-${task.id}`}
          >
            <MaterialIcons name="close" size={20} color={dangerColor} />
          </Pressable>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            <Pressable
              onPress={() => setIsDraggingCategories(!isDraggingCategories)}
              style={[
                styles.reorderButton,
                { 
                  backgroundColor: isDraggingCategories ? accentColor : colors.surface,
                  borderColor: accentColor,
                  borderWidth: 1,
                }
              ]}
            >
              <MaterialIcons 
                name="reorder" 
                size={20} 
                color={isDraggingCategories ? "#fff" : accentColor} 
              />
            </Pressable>
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={[styles.addButton, { backgroundColor: accentColor }]}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>

        {categories.length === 0 ? (
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={accentColor}
              />
            }
          >
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={48} color={textSecondary} />
              <ThemedText type="subtitle" style={{ marginTop: Spacing.lg }}>
                No categories yet
              </ThemedText>
              <ThemedText type="default" style={{ color: textSecondary, marginTop: Spacing.sm }}>
                Add a category to get started
              </ThemedText>
            </View>
          </ScrollView>
        ) : (
          <DraggableFlatList
            data={categories}
            onDragEnd={({ data }) => handleDragEndCategories(data)}
            keyExtractor={(item) => item.id}
            onDragBegin={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            scrollEnabled={true}
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={accentColor}
              />
            }
            renderItem={({ item: category, drag, isActive }: RenderItemParams<Category>) => {
              const isExpanded = expandedCategories.has(category.id);
              const categoryTasks = getCategoryTasks(category.id);

              return (
                <ScaleDecorator>
                  <View key={category.id}>
                    {renderCategoryHeader(category, isDraggingCategories ? drag : undefined, isActive)}
                    {isExpanded && categoryTasks.length > 0 && (
                      <View style={{ backgroundColor: colors.background }}>
                        <DraggableFlatList
                          data={categoryTasks}
                          onDragEnd={({ data }) => handleDragEndTasks(category.id, data)}
                          keyExtractor={(item) => item.id}
                          onDragBegin={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                          nestedScrollEnabled={true}
                          scrollEnabled={true}
                          renderItem={({ item: task, drag: dragTask, isActive: isTaskActive }: RenderItemParams<Task>) => (
                            <ScaleDecorator>
                              {renderTaskItem(task, dragTask, isTaskActive)}
                            </ScaleDecorator>
                          )}
                        />
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
                </ScaleDecorator>
              );
            }}
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

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
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
                Edit Task
              </ThemedText>
              <Pressable onPress={() => setShowEditModal(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <ThemedText type="default" style={{ marginTop: Spacing.lg }}>
                Task Title
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.divider,
                    color: textColor,
                    backgroundColor: colors.surface,
                    marginTop: Spacing.md,
                  },
                ]}
                placeholder="Task title"
                placeholderTextColor={textSecondary}
                value={editTaskTitle}
                onChangeText={setEditTaskTitle}
                autoFocus
              />

              <Pressable
                onPress={handleEditTask}
                disabled={!editTaskTitle.trim()}
                style={[
                  styles.button,
                  {
                    backgroundColor: accentColor,
                    opacity: !editTaskTitle.trim() ? 0.5 : 1,
                  },
                ]}
              >
                <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                  Save Changes
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </ThemedView>
      </Modal>
    </ThemedView>
    </GestureHandlerRootView>
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
  reorderButton: {
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
  editButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  categoryDeleteButton: {
    padding: Spacing.xs,
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
