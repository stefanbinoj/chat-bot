import React, { useState, useEffect } from "react";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient"; // ✅ Use Expo's LinearGradient

import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { apiWithHeaders, removeToken } from "../utils/tokenHandler";
import { useAuth } from "../context/authContext";

const FirstLoginModalContent = ({
  name,
  setName,
  password,
  setPassword,
  updating,
  handleFirstLoginSubmit,
}) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={styles.modalContainer}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Welcome! Complete Your Profile</Text>

        <Text style={styles.inputLabel}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.inputLabel}>New Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleFirstLoginSubmit}
          disabled={updating}
        >
          <LinearGradient
            colors={["#20c883", "#1cb08e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update Profile</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  </KeyboardAvoidingView>
);

// Coach Card Component with enhanced UI
const CoachCard = ({ coach, onSelect, isSelected, handleChatButtonPress }) => {
  const firstLetter = coach.title ? coach.title.charAt(0).toUpperCase() : "C";

  return (
    <TouchableOpacity
      style={[styles.coachCard, isSelected && styles.selectedCoachCard]}
      onPress={() => onSelect(coach)}
      activeOpacity={0.7}
    >
      <View style={styles.coachCardInner}>
        {coach.profileImage ? (
          <Image
            source={{ uri: coach.profileImage }}
            style={styles.coachAvatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Text style={styles.placeholderText}>{firstLetter}</Text>
          </View>
        )}
        <View style={styles.coachInfo}>
          <Text style={styles.coachName}>{coach.title}</Text>
          <Text style={styles.coachBio} numberOfLines={1}>
            {coach.description}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleChatButtonPress(coach)}
        >
          <LinearGradient
            colors={["#20c883", "#1cb08e"]} // Gradient colors
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chatButton}
          >
            <Text style={styles.chatButtonText}>Chat Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Skeleton Loader for coaches
const CoachSkeletonLoader = () => {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonName} />
          <View style={styles.skeletonSpecialty} />
          <View style={styles.skeletonButton} />
        </View>
      ))}
    </View>
  );
};

const DashboardScreen = ({ navigation }) => {
  const { refreshSession } = useAuth();

  // Coach selection states
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isCoachesLoading, setIsCoachesLoading] = useState(true);

  // User verification states
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // Get user details
      const userResponse = await apiWithHeaders.get("/api/end-users/current");

      if (userResponse.data.status === "success") {
        setIsActive(userResponse.data.isActive);

        if (userResponse.data.endUser.isFirstLogin) {
          setShowFirstLoginModal(true);
        }

        // Check subscription status
        const subscriptionResponse = await apiWithHeaders.get(
          "/api/subscriptions/has-active-subscription"
        );
        setHasActiveSubscription(
          subscriptionResponse.data.hasActiveSubscription
        );

        // Only fetch coaches if everything is valid
        if (
          userResponse.data.isActive &&
          subscriptionResponse.data.hasActiveSubscription
        ) {
          fetchCoaches();
        }
      } else {
        console.log("User not active or request failed");
      }
    } catch (error) {
      console.error("Error occurred while fetching end user details:", error);
      Alert.alert(
        "Error",
        "Failed to load your account information. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    setIsCoachesLoading(true);
    try {
      const response = await apiWithHeaders.get("/api/coach");

      if (Array.isArray(response.data)) {
        setCoaches(response.data);
      } else if (response.data && Array.isArray(response.data.coaches)) {
        // In case the response is wrapped in an object with a 'coaches' array
        setCoaches(response.data.coaches);
      } else {
        console.error("Unexpected coaches data format:", response.data);
        setCoaches([]);
      }
    } catch (error) {
      console.error("Error fetching coaches:", error);
      Alert.alert("Error", "Failed to load coaches. Please try again later.");
      setCoaches([]);
    } finally {
      setIsCoachesLoading(false);
    }
  };

  const handleFirstLoginSubmit = async () => {
    if (!name || !password) {
      Alert.alert("Required Fields", "Please fill in both name and password.");
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Password Too Short",
        "Password must be at least 8 characters long."
      );
      return;
    }

    setUpdating(true);
    try {
      const response = await apiWithHeaders.post("/api/end-users/update", {
        name,
        password,
      });

      if (response.data.status === "success") {
        setShowFirstLoginModal(false);
        // Refresh coaches after profile update
        fetchCoaches();
      } else {
        Alert.alert(
          "Update Failed",
          response.data.message || "Failed to update profile."
        );
      }
    } catch (error) {
      console.error("Error updating user details:", error);
      Alert.alert(
        "Update Error",
        "Failed to update your profile. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleCoachSelect = (coach) => {
    setSelectedCoach(coach);
  };

  const handleChatButtonPress = (coach) => {
    navigation.navigate("Chat", { coach });
  };

  const handleRedirectToChat = () => {
    navigation.navigate("Chat", { coach: selectedCoach });
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

  const renderFirstLoginModal = () => (
    <Modal
      visible={showFirstLoginModal}
      transparent={true}
      animationType="fade" // Try "fade" instead of default "slide"
    >
      <FirstLoginModalContent
        name={name}
        setName={setName}
        password={password}
        setPassword={setPassword}
        updating={updating}
        handleFirstLoginSubmit={handleFirstLoginSubmit}
      />
    </Modal>
  );

  // Account Inactive Screen
  const AccountInactiveScreen = () => (
    <View style={styles.centeredContainer}>
      <View style={styles.messageBox}>
        <Text style={styles.messageTitle}>Account Inactive</Text>
        <Text style={styles.messageText}>
          Your account is currently inactive. Please contact your administrator
          for assistance.
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // No Subscription Screen
  const NoSubscriptionScreen = () => (
    <View style={styles.centeredContainer}>
      <View style={styles.messageBox}>
        <Text style={styles.messageTitle}>No Active Subscription</Text>
        <Text style={styles.messageText}>
          There is no active subscription for your account. Please contact your
          administrator.
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading Screen
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading your account...</Text>
      </View>
    );
  }

  // Account Status Screens
  if (!isActive) {
    return <AccountInactiveScreen />;
  }

  if (!hasActiveSubscription) {
    return <NoSubscriptionScreen />;
  }

  // Main Dashboard Screen with Coach Selection
  return (
    <View style={styles.container}>
      {showFirstLoginModal && renderFirstLoginModal()}
      <View style={styles.header}>
        <Text style={styles.title}>Select a Coach</Text>
        {!selectedCoach ? (
          <TouchableOpacity onPress={handleLogout}>
            <MaterialIcons
              name="logout"
              size={26}
              color="red"
              style={styles.logoutIcon}
            />
          </TouchableOpacity>
        ) : (
          <FontAwesome
            name="chevron-right"
            size={26}
            color="#20c883"
            onPress={handleRedirectToChat}
            style={styles.logoutIcon}
          />
        )}
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subtitle}>
          Choose a coach to start chatting with
        </Text>
      </View>

      {isCoachesLoading ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <CoachSkeletonLoader />
        </ScrollView>
      ) : coaches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>👨‍🏫</Text>
          </View>
          <Text style={styles.emptyTitle}>No coaches available</Text>
          <Text style={styles.emptyText}>
            Please check back later or contact support.
          </Text>
        </View>
      ) : (
        <FlatList
          data={coaches}
          keyExtractor={(item, index) =>
            // Use _id or id if available, otherwise fall back to index
            (item._id || item.id || `coach-${index}`).toString()
          }
          renderItem={({ item }) => (
            <CoachCard
              coach={item}
              onSelect={handleCoachSelect}
              handleChatButtonPress={handleChatButtonPress}
              isSelected={selectedCoach && selectedCoach._id === item._id}
            />
          )}
          contentContainerStyle={styles.coachList}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No coaches available</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 70 : 10,
    // paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  subtitle: {
    fontSize: 16,
    color: "rgb(163 174 208 )",
  },

  scrollContainer: {
    padding: 12,
  },
  coachList: {
    padding: 12,
  },
  // New coach card styles to match the web version
  coachCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginHorizontal: 20,
  },
  selectedCoachCard: {
    borderWidth: 2,
    borderColor: "#1cb08e",
  },
  coachCardInner: {
    padding: 16,
    alignItems: "center",
  },
  coachAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    shadowColor: "#000", // Shadow color
    shadowOffset: { width: 0, height: 2 }, // X, Y offset
    shadowOpacity: 0.3, // Opacity of shadow
    shadowRadius: 5, // Blur radius
    elevation: 4,
  },
  placeholderAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 36,
    color: "white",
    fontWeight: "bold",
  },
  coachInfo: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  coachName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },

  coachBio: {
    fontSize: 14,
    color: "rgb(163 174 208 )",
    textAlign: "center",
    marginBottom: 8,
    marginLeft: 40,
    marginRight: 40,
  },
  chatButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
    marginTop: 4,
  },
  chatButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  // Skeleton loader styles
  skeletonContainer: {
    flexDirection: "column",
  },
  skeletonCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  skeletonAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  skeletonName: {
    width: 120,
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSpecialty: {
    width: 180,
    height: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonButton: {
    width: 100,
    height: 36,
    backgroundColor: "#e0e0e0",
    borderRadius: 18,
    marginTop: 8,
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  // Existing styles (keep these)
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  messageBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  messageText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
  },
  logoutButton: {
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  primaryButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  logoutIcon: {
    marginRight: 10,
  },
  // Add these styles to your StyleSheet

  fullScreenForm: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    position: "relative",
    zIndex: 999,
    top: height / 4,
  },
  formContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  gradientButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default DashboardScreen;
