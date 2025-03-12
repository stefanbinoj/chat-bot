import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/authContext";

export default function ProtectedRoute({ children }) {
  const { sessionValid, isLoading, isEndUser } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    console.log("Protected route hitting");

    if (!isLoading && !sessionValid) {
      return navigation.reset({
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
