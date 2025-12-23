import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, Note as SupabaseNote } from "@/lib/supabase";
import { authService } from "@/lib/supabase-auth";

export interface Note {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NoteContextType {
  notes: Note[];
  loading: boolean;
  addNote: (content: string) => Promise<void>;
  updateNote: (noteId: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  loadNotes: () => Promise<void>;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize and load data
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserId(user.id);
        await loadNotes(user.id);
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
        await loadNotes(user.id);
      } else {
        setUserId(null);
        setNotes([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadNotes = async (uid?: string) => {
    const currentUserId = uid || userId;
    if (!currentUserId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedNotes: Note[] = (data || []).map((note: any) => ({
        id: note.id,
        userId: note.user_id,
        content: note.content,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
      }));

      setNotes(mappedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (content: string) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: userId,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      const newNote: Note = {
        id: data.id,
        userId: data.user_id,
        content: data.content,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setNotes([newNote, ...notes]);
    } catch (error) {
      console.error("Error adding note:", error);
      throw error;
    }
  };

  const updateNote = async (noteId: string, content: string) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .update({ content })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      setNotes(
        notes.map((note) =>
          note.id === noteId
            ? {
                ...note,
                content: data.content,
                updatedAt: new Date(data.updated_at),
              }
            : note
        )
      );
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);

      if (error) throw error;

      setNotes(notes.filter((note) => note.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };

  return (
    <NoteContext.Provider
      value={{
        notes,
        loading,
        addNote,
        updateNote,
        deleteNote,
        loadNotes,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNoteContext() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error("useNoteContext must be used within NoteProvider");
  }
  return context;
}
