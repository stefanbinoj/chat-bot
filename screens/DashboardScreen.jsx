import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "http://localhost:4002";

const CoachCard = ({ coach, onSelect, isSelected }) => {
  return (
    <TouchableOpacity
      style={[styles.coachCard, isSelected && styles.selectedCoachCard]}
      onPress={() => onSelect(coach)}
    >
      <Image
        source={{ uri: coach.avatar || "https://via.placeholder.com/150" }}
        style={styles.coachAvatar}
      />
      <View style={styles.coachInfo}>
        <Text style={styles.coachName}>{coach.name}</Text>
        <Text style={styles.coachSpecialty}>{coach.specialty}</Text>
        <Text style={styles.coachBio} numberOfLines={2}>
          {coach.bio}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedIndicatorText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const DashboardScreen = ({ navigation }) => {
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(`${API_URL}/coaches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCoaches(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      Alert.alert("Error", "Failed to load coaches. Please try again later.");
      setLoading(false);
    }
  };

  const handleCoachSelect = (coach) => {
    setSelectedCoach(coach);
  };

  const handleStartChat = () => {
    if (!selectedCoach) {
      Alert.alert("Error", "Please select a coach to chat with");
      return;
    }

    navigation.navigate("Chat", { coach: selectedCoach });
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "An error occurred during logout");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coaches</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading coaches...</Text>
        </View>
      ) : coaches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No coaches available at the moment
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={coaches}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <CoachCard
                coach={item}
                onSelect={handleCoachSelect}
                isSelected={selectedCoach && selectedCoach.id === item.id}
              />
            )}
            contentContainerStyle={styles.coachList}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.startChatButton,
                !selectedCoach && styles.disabledButton,
              ]}
              onPress={handleStartChat}
              disabled={!selectedCoach}
            >
              <Text style={styles.startChatButtonText}>
                Chat with{" "}
                {selectedCoach ? selectedCoach.name : "Selected Coach"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: "#f44336",
    fontWeight: "bold",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  coachList: {
    padding: 15,
  },
  coachCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: "relative",
  },
  selectedCoachCard: {
    borderWidth: 2,
    borderColor: "#4285F4",
  },
  coachAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  coachInfo: {
    flex: 1,
    justifyContent: "center",
  },
  coachName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  coachSpecialty: {
    fontSize: 14,
    color: "#4285F4",
    marginBottom: 5,
  },
  coachBio: {
    fontSize: 14,
    color: "#666",
  },
  selectedIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#4285F4",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIndicatorText: {
    color: "#fff",
    fontWeight: "bold",
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  startChatButton: {
    backgroundColor: "#4285F4",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#a0a0a0",
  },
  startChatButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default DashboardScreen;
