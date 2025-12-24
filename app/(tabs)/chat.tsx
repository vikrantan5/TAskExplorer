import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  Image,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useChatContext, Message } from "@/context/ChatContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { authService } from "@/lib/supabase-auth";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const flatListRef = useRef<FlatList>(null);
  const { messages, loading, sendMessage, sendFile, deleteMessageForMe, deleteMessageForEveryone, isMessageDeletedForMe } = useChatContext();
  const [messageText, setMessageText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const accentColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const textSecondary = Colors[colorScheme ?? "light"].textSecondary;
  const colors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await sendMessage(messageText);
      setMessageText("");
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
    }
  };

  const handleSendFile = async (type: 'image' | 'document') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sendFile(type);
    } catch (error) {
      // Error already handled in context
    }
  };

  const handleLongPressMessage = (message: Message) => {
    if (message.isDeletedForEveryone) return;
    if (isMessageDeletedForMe(message.id)) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(message);
    setShowDeleteModal(true);
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await deleteMessageForMe(selectedMessage.id);
      setShowDeleteModal(false);
      setSelectedMessage(null);
    } catch (error) {
      Alert.alert("Error", "Failed to delete message");
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await deleteMessageForEveryone(selectedMessage.id);
      setShowDeleteModal(false);
      setSelectedMessage(null);
    } catch (error) {
      Alert.alert("Error", "Failed to delete message");
    }
  };

  const addEmoji = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.userId === currentUserId;
    const isDeleted = item.isDeletedForEveryone || isMessageDeletedForMe(item.id);

    if (isDeleted && item.isDeletedForEveryone) {
      return (
        <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
          <View
            style={[
              styles.messageBubble,
              { backgroundColor: colors.surface },
              styles.deletedMessage,
            ]}
          >
            <ThemedText style={[styles.deletedText, { color: textSecondary }]}>
              <MaterialIcons name="block" size={12} color={textSecondary} /> This message was deleted
            </ThemedText>
          </View>
        </View>
      );
    }

    if (isDeleted && isMessageDeletedForMe(item.id)) {
      return null; // Don't show messages deleted for me
    }

    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}
      >
        {!isMyMessage && (
          <ThemedText style={[styles.senderName, { color: accentColor }]}>
            {item.userName}
          </ThemedText>
        )}
        <Pressable
          onLongPress={() => handleLongPressMessage(item)}
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMyMessage ? accentColor : colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {item.messageType === 'image' && item.fileUrl && (
            <Pressable onPress={() => Linking.openURL(item.fileUrl!)}>
              <Image
                source={{ uri: item.fileUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </Pressable>
          )}
          {item.messageType === 'file' && item.fileUrl && (
            <Pressable
              onPress={() => Linking.openURL(item.fileUrl!)}
              style={styles.fileContainer}
            >
              <MaterialIcons name="insert-drive-file" size={24} color={isMyMessage ? "#fff" : accentColor} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <ThemedText
                  style={[styles.fileName, { color: isMyMessage ? "#fff" : textColor }]}
                  numberOfLines={1}
                >
                  {item.fileName}
                </ThemedText>
                {item.fileSize && (
                  <ThemedText
                    style={[styles.fileSize, { color: isMyMessage ? "rgba(255,255,255,0.8)" : textSecondary }]}
                  >
                    {(item.fileSize / 1024).toFixed(2)} KB
                  </ThemedText>
                )}
              </View>
              <MaterialIcons name="download" size={20} color={isMyMessage ? "#fff" : accentColor} />
            </Pressable>
          )}
          {item.messageType === 'text' && (
            <ThemedText
              style={[styles.messageText, { color: isMyMessage ? "#fff" : textColor }]}
            >
              {item.content}
            </ThemedText>
          )}
          <ThemedText
            style={[styles.messageTime, { color: isMyMessage ? "rgba(255,255,255,0.7)" : textSecondary }]}
          >
            {formatTime(item.createdAt)}
          </ThemedText>
        </Pressable>
      </Animated.View>
    );
  };

  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '✨', '👏', '🙏', '💯', '🎯', '✅'];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ThemedView
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, Spacing.lg),
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <MaterialIcons name="groups" size={32} color={accentColor} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <ThemedText type="title" style={{ fontSize: 20 }}>Group Chat</ThemedText>
            <ThemedText type="default" style={{ fontSize: 12, color: textSecondary }}>Everyone</ThemedText>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={true}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {showEmojiPicker && (
          <View style={[styles.emojiPicker, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
            <FlatList
              data={emojis}
              horizontal
              renderItem={({ item }) => (
                <Pressable onPress={() => addEmoji(item)} style={styles.emojiButton}>
                  <ThemedText style={{ fontSize: 28 }}>{item}</ThemedText>
                </Pressable>
              )}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.divider,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
          ]}
        >
          <Pressable
            onPress={() => handleSendFile('document')}
            style={styles.iconButton}
            data-testid="attach-file-button"
          >
            <MaterialIcons name="attach-file" size={24} color={accentColor} />
          </Pressable>

          <Pressable
            onPress={() => handleSendFile('image')}
            style={styles.iconButton}
            data-testid="attach-image-button"
          >
            <MaterialIcons name="image" size={24} color={accentColor} />
          </Pressable>

          <Pressable
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            style={styles.iconButton}
            data-testid="emoji-button"
          >
            <MaterialIcons name="emoji-emotions" size={24} color={showEmojiPicker ? accentColor : textSecondary} />
          </Pressable>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: textColor,
                borderColor: colors.divider,
              },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            data-testid="message-input"
          />

          <Pressable
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor: messageText.trim() ? accentColor : colors.divider,
              },
            ]}
            data-testid="send-button"
          >
            <MaterialIcons name="send" size={20} color="#fff" />
          </Pressable>
        </View>

        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowDeleteModal(false)}>
            <View
              style={[styles.deleteModal, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              <ThemedText type="subtitle" style={{ marginBottom: Spacing.lg }}>
                Delete Message
              </ThemedText>

              <Pressable
                onPress={handleDeleteForMe}
                style={[styles.deleteOption, { borderBottomColor: colors.divider }]}
                data-testid="delete-for-me-button"
              >
                <MaterialIcons name="delete-outline" size={24} color={textColor} />
                <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                  <ThemedText type="defaultSemiBold">Delete for me</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: textSecondary }}>
                    Remove this message from your view
                  </ThemedText>
                </View>
              </Pressable>

              {selectedMessage?.userId === currentUserId && (
                <Pressable
                  onPress={handleDeleteForEveryone}
                  style={[styles.deleteOption, { borderBottomColor: colors.divider }]}
                  data-testid="delete-for-everyone-button"
                >
                  <MaterialIcons name="delete-forever" size={24} color={colors.danger} />
                  <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                    <ThemedText type="defaultSemiBold" style={{ color: colors.danger }}>
                      Delete for everyone
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, color: textSecondary }}>
                      Remove for all participants
                    </ThemedText>
                  </View>
                </Pressable>
              )}

              <Pressable
                onPress={() => setShowDeleteModal(false)}
                style={[styles.cancelButton, { backgroundColor: colors.surface }]}
              >
                <ThemedText type="defaultSemiBold">Cancel</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: Spacing.md,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  messageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minWidth: 60,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  deletedMessage: {
    opacity: 0.6,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  iconButton: {
    padding: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPicker: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
  },
  emojiButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModal: {
    width: '85%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  deleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  cancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});
