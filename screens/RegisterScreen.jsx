import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { storeToken } from "../utils/tokenHandler";
import axios from "axios";
import { API_URL } from "../constant";
import { useAuth } from "../context/authContext";
import { LinearGradient } from "expo-linear-gradient"; // ✅ Use Expo's LinearGradient

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { refreshSession } = useAuth();

  // Check company name when company code is 5 characters
  useEffect(() => {
    if (companyCode.length === 5) {
      checkCompanyName();
    } else if (companyCode.length !== 5) {
      setCompanyName("");
    }
  }, [companyCode]);

  // Function to validate company code
  const checkCompanyName = async () => {
    try {
      setError(false);
      setIsLoading(true);
      const response = await axios.post(
        `${API_URL}/api/end-users/get-company`,
        {
          companyCode,
        }
      );

      if (response.data.status === "success") {
        setError(false);
        setCompanyName(response.data.companyName);
      } else {
        setError(true);
        setErrorMessage(response.data.message || "Invalid company code");
      }
    } catch (err) {
      console.error("Company code validation failed:", err.stack);
      setError(true);
      setErrorMessage("Please provide a valid company code...");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    // Form validation
    if (!companyName) {
      setError(true);
      setErrorMessage("Please provide valid company code");
      return;
    }

    if (!email || !password || !name) {
      setError(true);
      setErrorMessage("All fields are mandatory");
      return;
    }

    if (!email.includes("@")) {
      setError(true);
      setErrorMessage("Please provide a valid email");
      return;
    }

    if (password.length < 8) {
      setError(true);
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    try {
      setIsLoading(true);
      setError(false);
      setErrorMessage("");

      const response = await axios.post(`${API_URL}/api/end-users/create`, {
        email,
        password,
        name,
        companyCode,
      });

      if (response.data.status === "success") {
        // Store token if provided
        await storeToken(response.data.token);

        await refreshSession();
      } else {
        setError(true);
        setErrorMessage(response.data.message || "Registration failed");
      }
    } catch (err) {
      setError(true);
      setErrorMessage(
        err.response?.data?.message || "Unexpected error occurred"
      );
      console.error("Registration failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={styles.companyContainer}>
              <View style={styles.companyCodeContainer}>
                <Text style={styles.label}>Company Code:</Text>
                <TextInput
                  style={styles.companyInput}
                  placeholder="5-digit code"
                  value={companyCode}
                  onChangeText={(text) => {
                    setCompanyCode(text);
                    if (text.length !== 5) {
                      setCompanyName("");
                    }
                  }}
                  maxLength={5}
                  keyboardType="default"
                />
              </View>
              <View style={styles.companyNameContainer}>
                <Text style={styles.label}>Company Name:</Text>
                <TextInput
                  style={[styles.companyInput, { backgroundColor: "#f0f0f0" }]}
                  value={companyName}
                  editable={false}
                  placeholder="Will appear here"
                />
              </View>
            </View>

            {error && <Text style={styles.errorText}>{errorMessage}</Text>}

            <Pressable
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#20c883", "#1cb08e"]} // Gradient colors
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chatButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerButtonText}>Get Started</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text
                  style={styles.loginLink}
                  onPress={() => navigation.navigate("Login")}
                >
                  Login
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  formContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 32,
    color: "#1cb08e",
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 30,
    paddingHorizontal: 16,
    marginBottom: 18,
    backgroundColor: "white",
    fontSize: 16,
  },
  companyContainer: {
    flexDirection: "column",
    marginBottom: 20,
    width: "100%",
    borderTopColor: "#d1d5db",
    borderTopWidth: 1,
    paddingTop: 20,
  },
  companyCodeContainer: {
    marginBottom: 18,
  },
  companyNameContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgb(163 174 208 )",
    marginBottom: 6,
  },
  companyInput: {
    height: 56,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 30,
    paddingHorizontal: 16,
    backgroundColor: "white",
    fontSize: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 16,
  },
  registerButton: {
    width: "100%",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginTop: 8,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  loginContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  loginText: {
    color: "#4b5563",
    fontSize: 15,
  },
  loginLink: {
    color: "#1cb08e",
    fontWeight: "600",
  },
  chatButton: {
    paddingVertical: 12,
    width: "100%",
    marginHorizontal: 60,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 40,
  },
});

export default RegisterScreen;
