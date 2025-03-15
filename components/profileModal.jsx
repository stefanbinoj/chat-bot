import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiWithHeaders } from "../utils/tokenHandler";

const ProfileModal = ({ visible, onClose }) => {
  // States
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    newPassword: "",
  });
  const [isEditing, setIsEditing] = useState({
    name: false,
    password: false,
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile when modal becomes visible
  useEffect(() => {
    if (visible) {
      fetchUserProfile();
    }
  }, [visible]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await apiWithHeaders.get("/api/end-users/current");
      setUserProfile(response.data.endUser);
      setFormData((prev) => ({
        ...prev,
        name: response.data.endUser.name || "",
      }));
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdatingProfile(true);
    setUpdateError("");

    try {
      const payload = {};
      if (isEditing.name) {
        payload.name = formData.name;
      }
      if (isEditing.password) {
        payload.oldPassword = formData.password;
        payload.password = formData.newPassword;
      }

      const response = await apiWithHeaders.post(
        "/api/end-users/update",
        payload
      );

      if (response.data) {
        setUserProfile(response.data.endUser);
        setIsEditing({ name: false, password: false });
        setFormData((prev) => ({
          ...prev,
          name: response.data.endUser.name || "",
          password: "",
          newPassword: "",
        }));
      }
    } catch (error) {
      setUpdateError(
        error.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const formatJoinDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile Settings</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1cb08e" />
                  <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {userProfile?.name?.charAt(0)?.toUpperCase() || "?"}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.profileName}>
                        {userProfile?.name}
                      </Text>
                      <Text style={styles.joinDate}>
                        Joined {formatJoinDate(userProfile?.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <View style={styles.formRow}>
                      <Text style={styles.label}>Name</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setIsEditing({ ...isEditing, name: !isEditing.name })
                        }
                      >
                        <Text style={styles.editButton}>
                          {isEditing.name ? "Cancel" : "Edit"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {isEditing.name ? (
                      <TextInput
                        style={styles.input}
                        value={formData.name}
                        onChangeText={(text) =>
                          setFormData({ ...formData, name: text })
                        }
                        placeholder="Enter your name"
                      />
                    ) : (
                      <Text style={styles.valueText}>{userProfile?.name}</Text>
                    )}
                  </View>

                  <View style={styles.formSection}>
                    <View style={styles.formRow}>
                      <Text style={styles.label}>Password</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setIsEditing({
                            ...isEditing,
                            password: !isEditing.password,
                          })
                        }
                      >
                        <Text style={styles.editButton}>
                          {isEditing.password ? "Cancel" : "Change Password"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {isEditing.password ? (
                      <View>
                        <TextInput
                          style={[styles.input, styles.passwordInput]}
                          value={formData.password}
                          onChangeText={(text) =>
                            setFormData({ ...formData, password: text })
                          }
                          placeholder="Current Password"
                          secureTextEntry
                        />
                        <TextInput
                          style={styles.input}
                          value={formData.newPassword}
                          onChangeText={(text) =>
                            setFormData({ ...formData, newPassword: text })
                          }
                          placeholder="New Password"
                          secureTextEntry
                        />
                      </View>
                    ) : (
                      <Text style={styles.valueText}>••••••••</Text>
                    )}
                  </View>

                  {updateError ? (
                    <Text style={styles.errorText}>{updateError}</Text>
                  ) : null}

                  {(isEditing.name || isEditing.password) && (
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setIsEditing({ name: false, password: false });
                          setFormData({
                            name: userProfile?.name || "",
                            password: "",
                            newPassword: "",
                          });
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.saveButton,
                          isUpdatingProfile && styles.disabledButton,
                        ]}
                        onPress={handleUpdate}
                        disabled={isUpdatingProfile}
                      >
                        <Text style={styles.saveButtonText}>
                          {isUpdatingProfile ? "Saving..." : "Save Changes"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1cb08e",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  joinDate: {
    fontSize: 14,
    color: "#666",
  },
  formSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 15,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  editButton: {
    fontSize: 14,
    color: "#1cb08e",
  },
  valueText: {
    fontSize: 16,
    color: "#666",
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    marginBottom: 10,
  },
  errorText: {
    color: "#d9534f",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#1cb08e",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  disabledButton: {
    backgroundColor: "#94d3c4",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default ProfileModal;
