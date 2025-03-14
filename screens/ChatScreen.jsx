import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { apiWithHeaders } from "../utils/tokenHandler";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

const ChatScreen = ({ route, navigation }) => {
  const { coach } = route.params;
  console.log("Coach:", coach);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Conversation management
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isConversationsVisible, setIsConversationsVisible] = useState(false);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // Fetch initial data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchInitialData();
      return () => {};
    }, [])
  );

  const fetchInitialData = async () => {
    setInitialLoading(true);
    try {
      // Fetch conversations for this coach
      const conversationsResponse = await apiWithHeaders.get(
        `/api/messages/${coach._id}`
      );

      if (Array.isArray(conversationsResponse.data)) {
        setConversations(conversationsResponse.data);

        // Select the first conversation with messages if available
        const conversationsWithMessages = conversationsResponse.data.filter(
          (convo) => convo.messages && convo.messages.length > 0
        );

        if (conversationsWithMessages.length > 0) {
          const firstConvo = conversationsWithMessages[0];
          setSelectedConversation(firstConvo);
          setMessages(firstConvo.messages);
        } else {
          // Create a new conversation if none exist
          handleStartNewConversation();
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      // Create a new conversation on error
      handleStartNewConversation();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleStartNewConversation = async () => {
    try {
      const response = await apiWithHeaders.post(`/api/messages/start`, {
        title: "New Chat " + new Date().toLocaleTimeString(),
        messages: [],
        coachID: coach._id,
      });

      // Add new conversation to the beginning of the list
      setConversations([response.data, ...conversations]);
      setSelectedConversation(response.data);
      setMessages(response.data.messages || []);

      // Close conversation selector if open
      setIsConversationsVisible(false);
    } catch (error) {
      console.error("Error starting new conversation:", error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages(conversation.messages || []);
    setIsConversationsVisible(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedConversation) return;

    // Create a user message object
    const userMessage = {
      role: "user",
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Update UI immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    try {
      // Send message to API
      const response = await apiWithHeaders.post(`/api/messages`, {
        conversationId: selectedConversation._id,
        prompt: userMessage.content,
        coachID: coach._id || coach.id,
      });

      // Add AI response to messages
      setIsTyping(false);
      const assistantMessage = {
        role: "assistant",
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };

      const messagesWithResponse = [...updatedMessages, assistantMessage];
      setMessages(messagesWithResponse);

      // Update conversation in the conversations list
      const updatedConversation = {
        ...selectedConversation,
        messages: messagesWithResponse,
      };

      setSelectedConversation(updatedConversation);
      setConversations(
        conversations.map((convo) =>
          convo._id === selectedConversation._id ? updatedConversation : convo
        )
      );
    } catch (error) {
      setIsTyping(false);
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const renderMessageItem = ({ item }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.coachMessage,
        ]}
      >
        {!isUser && (
          <Image
            source={{
              uri: coach.profileImage,
            }}
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageContent,
            isUser ? styles.userMessageContent : styles.coachMessageContent,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.coachMessageText,
            ]}
          >
            {item.content || item.text}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  // Get a preview of the conversation for the list
  const getConversationPreview = (convo) => {
    if (!convo.messages || convo.messages.length === 0)
      return "New conversation";

    const messageForPreview =
      convo.messages.find((msg) => msg.role === "user") ||
      convo.messages.find((msg) => msg.role === "assistant") ||
      convo.messages[0];

    if (!messageForPreview || !messageForPreview.content)
      return "New conversation";

    const strippedContent = messageForPreview.content.replace(/[*#_~`]/g, "");
    return strippedContent.length > 30
      ? strippedContent.substring(0, 30) + "..."
      : strippedContent;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get the date of the last message in a conversation
  const getConversationDate = (convo) => {
    if (!convo.messages || convo.messages.length === 0)
      return convo.createdAt || new Date().toISOString();

    const lastMessage = convo.messages[convo.messages.length - 1];
    return lastMessage.timestamp || convo.updatedAt || new Date().toISOString();
  };

  // Render each conversation in the modal list
  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        selectedConversation?._id === item._id && styles.selectedConversation,
      ]}
      onPress={() => handleSelectConversation(item)}
    >
      <View style={styles.conversationContent}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title || "Untitled Chat"}
        </Text>
        <Text style={styles.conversationPreview} numberOfLines={1}>
          {getConversationPreview(item)}
        </Text>
        <Text style={styles.conversationDate}>
          {formatDate(getConversationDate(item))}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {coach.title || coach.name || "AI Coach"}
          </Text>
          <TouchableOpacity
            style={styles.conversationsButton}
            onPress={() => setIsConversationsVisible(true)}
          >
            <Text style={styles.conversationsButtonText}>
              {selectedConversation?.title || "Current Chat"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#4285F4" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.newChatButton}
          onPress={handleStartNewConversation}
        >
          <Ionicons name="add" size={24} color="#4285F4" />
        </TouchableOpacity>
      </View>

      {/* Main Chat Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubbles-outline" size={50} color="#ccc" />
                <Text style={styles.emptyChatText}>
                  No messages yet. Start the conversation!
                </Text>
              </View>
            )}
          />
        )}

        {/* Quick Prompt Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickPromptContainer}
        ></ScrollView>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.disabledSendButton,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>Coach is typing...</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Conversations Modal */}
      <Modal
        visible={isConversationsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsConversationsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Conversations</Text>
              <TouchableOpacity
                onPress={() => setIsConversationsVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.newConversationButton}
              onPress={handleStartNewConversation}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.newConversationButtonText}>
                New Conversation
              </Text>
            </TouchableOpacity>

            <FlatList
              data={conversations.sort(
                (a, b) =>
                  new Date(getConversationDate(b)) -
                  new Date(getConversationDate(a))
              )}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={renderConversationItem}
              contentContainerStyle={styles.conversationList}
              ListEmptyComponent={() => (
                <View style={styles.emptyConversations}>
                  <Text style={styles.emptyConversationsText}>
                    No conversations yet
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  conversationsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  conversationsButtonText: {
    fontSize: 14,
    color: "#4285F4",
  },
  newChatButton: {
    padding: 5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyChatText: {
    marginTop: 10,
    color: "#999",
    textAlign: "center",
  },
  messageList: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    flexGrow: 1,
  },
  messageBubble: {
    flexDirection: "row",
    marginBottom: 15,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  coachMessage: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    alignSelf: "flex-end",
  },
  messageContent: {
    borderRadius: 20,
    padding: 12,
    maxWidth: "100%",
  },
  userMessageContent: {
    backgroundColor: "#4285F4",
    borderBottomRightRadius: 5,
  },
  coachMessageContent: {
    backgroundColor: "#e0e0e0",
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: "white",
  },
  coachMessageText: {
    color: "#333",
  },
  timestamp: {
    fontSize: 10,
    color: "rgba(0, 0, 0, 0.5)",
    alignSelf: "flex-end",
    marginTop: 5,
  },
  quickPromptContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  quickPromptButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  quickPromptText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#4285F4",
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  disabledSendButton: {
    backgroundColor: "#a0a0a0",
  },
  typingIndicator: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    position: "absolute",
    bottom: 70,
    left: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  typingText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  newConversationButton: {
    backgroundColor: "#4285F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  newConversationButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  conversationList: {
    flexGrow: 1,
  },
  conversationItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  selectedConversation: {
    backgroundColor: "#e6f2ff",
    borderWidth: 2,
    borderColor: "#4285F4",
  },
  conversationContent: {},
  conversationTitle: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
  },
  conversationPreview: {
    color: "#666",
    fontSize: 14,
    marginBottom: 4,
  },
  conversationDate: {
    color: "#999",
    fontSize: 12,
    alignSelf: "flex-end",
  },
  emptyConversations: {
    padding: 40,
    alignItems: "center",
  },
  emptyConversationsText: {
    color: "#999",
    fontSize: 16,
  },
});

export default ChatScreen;
