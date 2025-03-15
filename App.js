import { enableScreens } from "react-native-screens";

// Initialize screens
enableScreens();
import { SafeAreaProvider } from "react-native-safe-area-context";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import LoadingScreen from "./screens/LoadingScreen";
import AuthStack from "./navigation/AuthStack";
import MainStack from "./navigation/MainStack";
import { AuthProvider, useAuth } from "./context/authContext";
import { StatusBar } from "react-native"; // Add this import

// Navigation container that uses the auth context
const Navigation = () => {
  const { sessionValid, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor="#ffffff"
        barStyle="dark-content"
        translucent={false}
      />
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
