import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/authContext";

/**
 * ProtectedRoute - Wraps protected screens and redirects to login if not authenticated
 */
export default function ProtectedRoute({ children }) {
  const { sessionValid, isLoading, refreshSession } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    // Check authentication when component mounts
    refreshSession();
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isLoading && !sessionValid) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }, [sessionValid, isLoading, navigation]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return sessionValid ? <>{children}</> : null;
}
