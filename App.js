import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import LoadingScreen from "./screens/LoadingScreen";
import AuthStack from "./navigation/AuthStack";
import MainStack from "./navigation/MainStack";
import { AuthProvider, useAuth } from "./context/authContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Navigation container that uses the auth context
const Navigation = () => {
  const { sessionValid, isLoading } = useAuth();
  console.log("sessionValid", sessionValid);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {sessionValid ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

// Main App component
export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
