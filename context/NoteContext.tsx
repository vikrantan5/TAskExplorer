import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Note } from "@/types";

interface NoteContextType {
  notes: Note[];
  addNote: (content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  updateNote: (noteId: string, content: string) => Promise<void>;
  loadNotes: () => Promise<void>;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const notesData = await AsyncStorage.getItem("notes");
      if (notesData) {
        setNotes(JSON.parse(notesData));
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const saveNotes = async (newNotes: Note[]) => {
    try {
      await AsyncStorage.setItem("notes", JSON.stringify(newNotes));
      setNotes(newNotes);
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  const addNote = async (content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      userId: "local",
      content,
      createdAt: new Date(),
    };

    const newNotes = [newNote, ...notes];
    await saveNotes(newNotes);
  };

  const deleteNote = async (noteId: string) => {
    const newNotes = notes.filter((note) => note.id !== noteId);
    await saveNotes(newNotes);
  };

  const updateNote = async (noteId: string, content: string) => {
    const newNotes = notes.map((note) => {
      if (note.id === noteId) {
        return { ...note, content };
      }
      return note;
    });

    await saveNotes(newNotes);
  };

  return (
    <NoteContext.Provider
      value={{
        notes,
        addNote,
        deleteNote,
        updateNote,
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
