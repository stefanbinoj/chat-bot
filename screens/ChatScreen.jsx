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
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiWithHeaders } from "../utils/tokenHandler";
import { Ionicons, Feather, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import OnlineIndicator from "../components/onlineIndicator";

const ChatScreen = ({ route, navigation }) => {
  const { coach } = route.params;
  console.log("Coach:", coach);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Conversation management
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isConversationsVisible, setIsConversationsVisible] = useState(false);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  //Drawer
  const { width } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const safeAreaHeight = insets.top + insets.bottom;

  const [menuAnimation] = useState(new Animated.Value(-300));
  const drawerWidth = width * 0.8; // Width of the drawer

  const openConversationsDrawer = () => {
    setIsConversationsVisible(true);
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeConversationsDrawer = () => {
    Animated.timing(menuAnimation, {
      toValue: -drawerWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsConversationsVisible(false));
  };

  const handleLogout = async () => {
    try {
      await apiWithHeaders.get("/api/session/session-logout");
      await removeToken();
      await refreshSession();
    } catch (error) {
      console.error("Logout error:", error);
      await removeToken(); // Ensure token is removed even if API call fails
      await refreshSession();
    }
  };

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
    setSending(true);

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
      setSending(false);
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
          <Text style={[styles.timestamp, isUser && { color: "white" }]}>
            {formatDate(item.timestamp)}
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
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    const time = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${month} ${day}, ${time}`;
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
          {/* {item.title || "Untitled Chat"} */}
          {getConversationPreview(item)}
        </Text>

        <Text style={styles.conversationDate}>
          {formatDate(getConversationDate(item))}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleProfilePress = () => {
    // Close the drawer first
    closeConversationsDrawer();

    // Navigate to profile screen or show profile modal
    // For now, just alert with user info
    Alert.alert("Profile", "Profile settings will be available soon!", [
      { text: "OK" },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={openConversationsDrawer}
        >
          <Ionicons name="menu-outline" size={26} color="#333" />{" "}
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image src={coach.profileImage} style={styles.coachAvatar} />
            <View style={{ flexDirection: "column", marginLeft: 10 }}>
              <Text style={styles.headerTitle}>
                {coach.title || coach.name || "AI Coach"}
              </Text>
              <OnlineIndicator />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="users" size={24} color="gray" />
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
                <Ionicons
                  name="chatbubbles-outline"
                  size={50}
                  color="#20c883"
                />
                <Text style={styles.emptyChatText}>
                  No messages yet. Start the conversation!
                </Text>
              </View>
            )}
          />
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isFocused && { borderColor: "#1cb08e" }]}
            placeholder={`Message ${coach.title}..`}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onFocus={() => setIsFocused(true)} // Detect focus
            onBlur={() => setIsFocused(false)} // Detect blur
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && !sending && styles.disabledSendButton,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <FontAwesome5 name="stop-circle" size={24} color="white" />
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
      {/* Side Drawer for Conversations */}
      {isConversationsVisible && (
        <View style={[styles.drawerOverlay]}>
          <TouchableOpacity
            style={[styles.overlayTouchable]}
            activeOpacity={1}
            onPress={closeConversationsDrawer}
          >
            <Animated.View
              style={[
                styles.drawerContent,
                { transform: [{ translateX: menuAnimation }] },
              ]}
            >
              <View style={styles.drawerContentInner}>
                {/* Changed from TouchableOpacity to View */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}> Conversations</Text>
                  <TouchableOpacity onPress={closeConversationsDrawer}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                  }}
                >
                  <TouchableOpacity
                    style={[styles.newConversationButton, { flexGrow: 1 }]}
                    onPress={() => {
                      handleStartNewConversation();
                      closeConversationsDrawer();
                    }}
                  >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.newConversationButtonText}>
                      New Conversation
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.newChatButton,
                      { marginLeft: 10, marginTop: 5 },
                    ]}
                    onPress={() => navigation.goBack()}
                  >
                    <Feather name="users" size={28} color="gray" />
                  </TouchableOpacity>
                </View>
                {/* Add a debug text to see if conversations are loaded */}
                <Text style={{ padding: 5, color: "#666" }}>
                  {conversations.length > 0
                    ? `${conversations.length} conversations`
                    : "No conversations found"}
                </Text>
                <FlatList
                  data={conversations.sort(
                    (a, b) =>
                      new Date(getConversationDate(b)) -
                      new Date(getConversationDate(a))
                  )}
                  keyExtractor={(item, index) => item._id || index.toString()}
                  renderItem={renderConversationItem}
                  style={styles.flatListContainer}
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
            </Animated.View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 50,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "flex-start",
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
    backgroundColor: "rgb(249, 250, 251)",
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
    width: 35,
    height: 35,
    borderRadius: 25,
    marginRight: 8,
    alignSelf: "flex-end",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  messageContent: {
    borderRadius: 20,
    padding: 12,
    maxWidth: "100%",
  },
  userMessageContent: {
    backgroundColor: "#20c883",
    borderBottomRightRadius: 5,
    shadowColor: "#1cb08e",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  coachMessageContent: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    height: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: "100%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sendButton: {
    backgroundColor: "#1cb08e",
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
    bottom: 90,
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
    marginTop: 20,
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
    backgroundColor: "#20c883",
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
    backgroundColor: "#e7f9f2",
    borderWidth: 2,
    borderColor: "#1cb08e",
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
  coachAvatar: {
    width: 40,
    height: 40,
    marginLeft: 20,
    padding: 5,
    shadowColor: "#fffff",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    borderRadius: 20,
  },
  // Add to your styles
  // Add/update these styles

  drawerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  overlayTouchable: {
    flex: 1,
  },
  drawerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "80%",
    height: "100%",
    backgroundColor: "white",
    zIndex: 1001,
  },
  drawerContentInner: {
    flex: 1, // Important for full height
    padding: 20,
    marginTop: 40, // Adjust to your needs
    height: "100%", // Ensure full height
  },
  flatListContainer: {
    flex: 1, // Critical for proper FlatList rendering
    marginTop: 10,
    height: "100%",
  },
  conversationList: {
    paddingBottom: 20,
  },
  conversationItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0", // Add border to make items more visible
  },
  conversationTitle: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
    color: "#333", // Ensure text color is visible
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
});

export default ChatScreen;
