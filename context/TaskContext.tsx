import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Category, Task } from "@/types";

interface TaskContextType {
  categories: Category[];
  tasks: Task[];
  addCategory: (title: string) => Promise<void>;
  addTask: (categoryId: string, title: string, isDaily: boolean) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  reorderTasks: (categoryId: string, tasks: Task[]) => Promise<void>;
  reorderCategories: (categories: Category[]) => Promise<void>;
  loadData: () => Promise<void>;
  syncData: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Check for daily reset
  useEffect(() => {
    checkDailyReset();
  }, [tasks]);

  const loadData = async () => {
    try {
      const [categoriesData, tasksData] = await Promise.all([
        AsyncStorage.getItem("categories"),
        AsyncStorage.getItem("tasks"),
      ]);

      if (categoriesData) setCategories(JSON.parse(categoriesData));
      if (tasksData) setTasks(JSON.parse(tasksData));
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const saveData = async (newCategories: Category[], newTasks: Task[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem("categories", JSON.stringify(newCategories)),
        AsyncStorage.setItem("tasks", JSON.stringify(newTasks)),
      ]);
      setCategories(newCategories);
      setTasks(newTasks);
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const checkDailyReset = async () => {
    try {
      const lastResetDate = await AsyncStorage.getItem("lastResetDate");
      const today = new Date().toDateString();

      if (lastResetDate !== today) {
        // Reset daily tasks
        const resetTasks = tasks.map((task) => {
          if (task.isDaily) {
            return {
              ...task,
              isCompleted: false,
              lastCompletedDate: new Date(),
            };
          }
          return task;
        });

        setTasks(resetTasks);
        await Promise.all([
          AsyncStorage.setItem("tasks", JSON.stringify(resetTasks)),
          AsyncStorage.setItem("lastResetDate", today),
        ]);
      }
    } catch (error) {
      console.error("Error checking daily reset:", error);
    }
  };

  const addCategory = async (title: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      userId: "local",
      title,
      orderIndex: categories.length,
      createdAt: new Date(),
    };

    const newCategories = [...categories, newCategory];
    await saveData(newCategories, tasks);
  };

  const addTask = async (categoryId: string, title: string, isDaily: boolean) => {
    const newTask: Task = {
      id: Date.now().toString(),
      userId: "local",
      categoryId,
      title,
      isCompleted: false,
      isDaily,
      createdAt: new Date(),
    };

    const newTasks = [...tasks, newTask];
    await saveData(categories, newTasks);
  };

  const toggleTask = async (taskId: string) => {
    const newTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          isCompleted: !task.isCompleted,
          lastCompletedDate: !task.isCompleted ? new Date() : task.lastCompletedDate,
        };
      }
      return task;
    });

    await saveData(categories, newTasks);
  };

  const deleteTask = async (taskId: string) => {
    const newTasks = tasks.filter((task) => task.id !== taskId);
    await saveData(categories, newTasks);
  };

  const deleteCategory = async (categoryId: string) => {
    const newCategories = categories.filter((cat) => cat.id !== categoryId);
    const newTasks = tasks.filter((task) => task.categoryId !== categoryId);
    await saveData(newCategories, newTasks);
  };

  const reorderTasks = async (categoryId: string, reorderedTasks: Task[]) => {
    const newTasks = tasks.map((task) => {
      const reordered = reorderedTasks.find((t) => t.id === task.id);
      return reordered || task;
    });

    await saveData(categories, newTasks);
  };

  const reorderCategories = async (reorderedCategories: Category[]) => {
    await saveData(reorderedCategories, tasks);
  };

  const syncData = async () => {
    // Placeholder for backend sync
    console.log("Syncing data with backend...");
  };

  return (
    <TaskContext.Provider
      value={{
        categories,
        tasks,
        addCategory,
        addTask,
        toggleTask,
        deleteTask,
        deleteCategory,
        reorderTasks,
        reorderCategories,
        loadData,
        syncData,
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
