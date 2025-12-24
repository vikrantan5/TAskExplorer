import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { authService } from "@/lib/supabase-auth";
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export interface Message {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  content: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: Date;
  deletedAt: Date | null;
  isDeletedForEveryone: boolean;
}

export interface MessageDeletion {
  messageId: string;
  userId: string;
}

interface ChatContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string) => Promise<void>;
  sendFile: (type: 'image' | 'document') => Promise<void>;
  deleteMessageForMe: (messageId: string) => Promise<void>;
  deleteMessageForEveryone: (messageId: string) => Promise<void>;
  loadMessages: () => Promise<void>;
  isMessageDeletedForMe: (messageId: string) => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      loadMessages();
      subscribeToMessages();
      loadDeletedMessages();
    }
  }, [userId]);

  const initializeAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserId(user.id);
        setUserName(user.name || user.email || 'Anonymous');
        setUserEmail(user.email);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error initializing auth:", error);
      setLoading(false);
    }

    const subscription = authService.onAuthStateChange(async (user) => {
      if (user) {
        setUserId(user.id);
        setUserName(user.name || user.email || 'Anonymous');
        setUserEmail(user.email);
      } else {
        setUserId(null);
        setMessages([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadMessages = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      const mappedMessages: Message[] = (messagesData || []).map((msg: any) => ({
        id: msg.id,
        userId: msg.user_id,
        userName: msg.user_name,
        userEmail: msg.user_email,
        content: msg.content,
        messageType: msg.message_type,
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileSize: msg.file_size,
        createdAt: new Date(msg.created_at),
        deletedAt: msg.deleted_at ? new Date(msg.deleted_at) : null,
        isDeletedForEveryone: msg.is_deleted_for_everyone || false,
      }));

      setMessages(mappedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeletedMessages = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("message_deletions")
        .select("message_id")
        .eq("user_id", userId);

      if (error) throw error;

      const deletedIds = new Set((data || []).map((d: any) => d.message_id));
      setDeletedMessageIds(deletedIds);
    } catch (error) {
      console.error("Error loading deleted messages:", error);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage: Message = {
              id: payload.new.id,
              userId: payload.new.user_id,
              userName: payload.new.user_name,
              userEmail: payload.new.user_email,
              content: payload.new.content,
              messageType: payload.new.message_type,
              fileUrl: payload.new.file_url,
              fileName: payload.new.file_name,
              fileSize: payload.new.file_size,
              createdAt: new Date(payload.new.created_at),
              deletedAt: null,
              isDeletedForEveryone: false,
            };
            setMessages((prev) => [...prev, newMessage]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id
                  ? {
                      ...msg,
                      deletedAt: payload.new.deleted_at ? new Date(payload.new.deleted_at) : null,
                      isDeletedForEveryone: payload.new.is_deleted_for_everyone || false,
                    }
                  : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async (content: string) => {
    if (!userId || !content.trim()) return;

    try {
      const { error } = await supabase.from("messages").insert({
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        content: content.trim(),
        message_type: 'text',
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const sendFile = async (type: 'image' | 'document') => {
    if (!userId) return;

    try {
      let result;
      
      if (type === 'image') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          alert('Permission to access media library is required!');
          return;
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          copyToCacheDirectory: true,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size && file.size > maxSize) {
        alert('File size exceeds 10MB limit');
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name?.split('.').pop() || 'file';
      const fileName = `${Date.now()}_${userId}.${fileExt}`;
      const filePath = `chat-files/${fileName}`;

      // Read file as base64
      const fileData = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob
      const response = await fetch(`data:${file.mimeType};base64,${fileData}`);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, blob, {
          contentType: file.mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      // Insert message
      const { error: messageError } = await supabase.from("messages").insert({
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        content: file.name || 'File',
        message_type: type === 'image' ? 'image' : 'file',
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
      });

      if (messageError) throw messageError;
    } catch (error) {
      console.error("Error sending file:", error);
      alert('Failed to send file. Please try again.');
      throw error;
    }
  };

  const deleteMessageForMe = async (messageId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from("message_deletions").insert({
        message_id: messageId,
        user_id: userId,
      });

      if (error) throw error;

      setDeletedMessageIds((prev) => new Set([...prev, messageId]));
    } catch (error) {
      console.error("Error deleting message for me:", error);
      throw error;
    }
  };

  const deleteMessageForEveryone = async (messageId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({
          is_deleted_for_everyone: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .eq("user_id", userId); // Only allow deletion if user is the sender

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting message for everyone:", error);
      throw error;
    }
  };

  const isMessageDeletedForMe = (messageId: string) => {
    return deletedMessageIds.has(messageId);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        sendMessage,
        sendFile,
        deleteMessageForMe,
        deleteMessageForEveryone,
        loadMessages,
        isMessageDeletedForMe,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
