import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import LoadingScreen from "./screens/LoadingScreen";
import AuthStack from "./navigation/AuthStack";
import MainStack from "./navigation/MainStack";
import { AuthProvider, useAuth } from "./context/authContext";

// Navigation container that uses the auth context
const Navigation = () => {
  const { sessionValid, isLoading } = useAuth();
  console.log("sessionValid", sessionValid);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {sessionValid ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
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
