import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { API_URL } from "../constant";
import { storeToken } from "../utils/tokenHandler";
import { useAuth } from "../context/authContext";
import { LinearGradient } from "expo-linear-gradient";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { refreshSession } = useAuth();

  const handleLogin = async () => {
    // Form validation
    if (!email || !password) {
      setError(true);
      setErrorMessage("All fields are mandatory");
      return;
    }

    if (!email.includes("@")) {
      setError(true);
      setErrorMessage("Please provide a valid email");
      return;
    }

    try {
      setIsLoading(true);
      setError(false);
      setErrorMessage("");

      // Update this URL to match your API endpoint
      const response = await axios.post(`${API_URL}/api/end-users/log-in`, {
        email,
        password,
      });

      if (response.data.status === "success") {
        setError(false);

        // Store token in AsyncStorage
        await storeToken(response.data.token);

        await refreshSession();
      } else {
        setError(true);
        setErrorMessage(response.data.message || "Login failed");
      }
    } catch (err) {
      setError(true);
      setErrorMessage(
        err.response?.data?.message || "Unexpected error occurred"
      );
      console.error("Login failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome</Text>

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

          {error && <Text style={styles.errorText}>{errorMessage}</Text>}

          <Pressable
            style={styles.loginButton}
            onPress={handleLogin}
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
                <Text style={styles.loginButtonText}>LOGIN</Text>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text
                style={styles.registerLink}
                onPress={() => navigation.navigate("Register")}
              >
                Register
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
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
  formContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
  errorText: {
    color: "#ef4444",
    alignSelf: "flex-start",
    marginBottom: 12,
    fontSize: 14,
  },
  loginButton: {
    width: "100%",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginTop: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  registerContainer: {
    marginTop: 24,
  },
  registerText: {
    color: "#4b5563",
    fontSize: 15,
  },
  registerLink: {
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

export default LoginScreen;
