import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, Category as SupabaseCategory, Task as SupabaseTask } from "@/lib/supabase";
import { authService } from "@/lib/supabase-auth";

export interface Category {
  id: string;
  userId: string;
  title: string;
  orderIndex: number;
  createdAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  isCompleted: boolean;
  isDaily: boolean;
  lastCompletedDate?: Date;
  createdAt: Date;
}

interface TaskContextType {
  categories: Category[];
  tasks: Task[];
  loading: boolean;
  addCategory: (title: string) => Promise<void>;
  addTask: (categoryId: string, title: string, isDaily: boolean) => Promise<void>;
  updateTask: (taskId: string, title: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  reorderTasks: (categoryId: string, tasks: Task[]) => Promise<void>;
  reorderCategories: (categories: Category[]) => Promise<void>;
  loadData: () => Promise<void>;
  syncData: () => Promise<void>;
  checkAndResetDailyTasks: () => Promise<void>;
  saveDailyAnalytics: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize and load data
  useEffect(() => {
    initializeAuth();
  }, []);

  // Check for daily reset on mount and when tasks change
  useEffect(() => {
    if (userId) {
      checkAndResetDailyTasks();
    }
  }, [userId]);

  const initializeAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserId(user.id);
        await loadData(user.id);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error initializing auth:", error);
      setLoading(false);
    }

    // Listen to auth changes
    const subscription = authService.onAuthStateChange(async (user) => {
      if (user) {
        setUserId(user.id);
        await loadData(user.id);
      } else {
        setUserId(null);
        setCategories([]);
        setTasks([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadData = async (uid?: string) => {
    const currentUserId = uid || userId;
    if (!currentUserId) return;

    try {
      setLoading(true);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", currentUserId)
        .order("order_index", { ascending: true });

      if (categoriesError) throw categoriesError;

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: true });

      if (tasksError) throw tasksError;

      // Convert to app format
      const mappedCategories: Category[] = (categoriesData || []).map((cat: any) => ({
        id: cat.id,
        userId: cat.user_id,
        title: cat.title,
        orderIndex: cat.order_index,
        createdAt: new Date(cat.created_at),
      }));

      const mappedTasks: Task[] = (tasksData || []).map((task: any) => ({
        id: task.id,
        userId: task.user_id,
        categoryId: task.category_id,
        title: task.title,
        isCompleted: task.is_completed,
        isDaily: task.is_daily,
        lastCompletedDate: task.last_completed_date ? new Date(task.last_completed_date) : undefined,
        createdAt: new Date(task.created_at),
      }));

      setCategories(mappedCategories);
      setTasks(mappedTasks);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndResetDailyTasks = async () => {
    if (!userId) return;

    try {
      // Client-side: Check if any daily tasks need reset
      const today = new Date().toDateString();
      const tasksToReset = tasks.filter(
        (task) =>
          task.isDaily &&
          task.lastCompletedDate &&
          new Date(task.lastCompletedDate).toDateString() !== today
      );

      if (tasksToReset.length > 0) {
        // Reset tasks in database
        const { error } = await supabase
          .from("tasks")
          .update({ is_completed: false })
          .eq("user_id", userId)
          .eq("is_daily", true)
          .lt("last_completed_date", new Date().toISOString().split('T')[0]);

        if (error) throw error;

        // Reload data
        await loadData();
      }

      // Server-side: Call the reset function (this ensures server-side reset as well)
      const { error: rpcError } = await supabase.rpc("reset_daily_tasks");
      if (rpcError) console.error("Server-side reset error:", rpcError);
    } catch (error) {
      console.error("Error checking daily reset:", error);
    }
  };

  const saveDailyAnalytics = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase.rpc("save_daily_analytics", {
        p_user_id: userId,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving daily analytics:", error);
    }
  };

  const addCategory = async (title: string) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          title,
          order_index: categories.length,
        })
        .select()
        .single();

      if (error) throw error;

      const newCategory: Category = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        orderIndex: data.order_index,
        createdAt: new Date(data.created_at),
      };

      setCategories([...categories, newCategory]);
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  };

  const addTask = async (categoryId: string, title: string, isDaily: boolean) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          category_id: categoryId,
          title,
          is_daily: isDaily,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        userId: data.user_id,
        categoryId: data.category_id,
        title: data.title,
        isCompleted: data.is_completed,
        isDaily: data.is_daily,
        lastCompletedDate: data.last_completed_date ? new Date(data.last_completed_date) : undefined,
        createdAt: new Date(data.created_at),
      };

      setTasks([...tasks, newTask]);
    } catch (error) {
      console.error("Error adding task:", error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, title: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ title })
        .eq("id", taskId);

      if (error) throw error;

      // Update local state
      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, title } : t
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!userId) return;

    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const newIsCompleted = !task.isCompleted;
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("tasks")
        .update({
          is_completed: newIsCompleted,
          last_completed_date: newIsCompleted ? now : task.lastCompletedDate?.toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;

      // Update local state
      setTasks(
        tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                isCompleted: newIsCompleted,
                lastCompletedDate: newIsCompleted ? new Date(now) : t.lastCompletedDate,
              }
            : t
        )
      );

      // Save analytics after task completion
      await saveDailyAnalytics();
    } catch (error) {
      console.error("Error toggling task:", error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;

      setTasks(tasks.filter((t) => t.id !== taskId));
      
      // Update analytics after deletion
      await saveDailyAnalytics();
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!userId) return;

    try {
      // Delete category (tasks will be deleted via CASCADE)
      const { error } = await supabase.from("categories").delete().eq("id", categoryId);

      if (error) throw error;

      setCategories(categories.filter((c) => c.id !== categoryId));
      setTasks(tasks.filter((t) => t.categoryId !== categoryId));
      
      // Update analytics after deletion
      await saveDailyAnalytics();
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  };

  const reorderTasks = async (categoryId: string, reorderedTasks: Task[]) => {
    // This is a simplified version - in production, you'd update order indices
    setTasks(
      tasks.map((task) => {
        const reordered = reorderedTasks.find((t) => t.id === task.id);
        return reordered || task;
      })
    );
  };

  const reorderCategories = async (reorderedCategories: Category[]) => {
    if (!userId) return;

    try {
      // Update order_index for each category
      const updates = reorderedCategories.map((cat, index) =>
        supabase
          .from("categories")
          .update({ order_index: index })
          .eq("id", cat.id)
      );

      await Promise.all(updates);
      setCategories(reorderedCategories);
    } catch (error) {
      console.error("Error reordering categories:", error);
      throw error;
    }
  };

  const syncData = async () => {
    await loadData();
  };

  return (
    <TaskContext.Provider
      value={{
        categories,
        tasks,
        loading,
        addCategory,
        addTask,
        updateTask,
        toggleTask,
        deleteTask,
        deleteCategory,
        reorderTasks,
        reorderCategories,
        loadData,
        syncData,
        checkAndResetDailyTasks,
        saveDailyAnalytics,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within TaskProvider");
  }
  return context;
}
