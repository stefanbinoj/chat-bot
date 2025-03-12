import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import DashboardScreen from "../screens/DashboardScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProtectedRoute from "../components/ProtectedRoute";

const Stack = createStackNavigator();

const ProtectedScreen = ({ component: Component, ...rest }) => (
  <ProtectedRoute>
    <Component {...rest} />
  </ProtectedRoute>
);

const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" options={{ headerShown: false }}>
        {(props) => <ProtectedScreen component={DashboardScreen} {...props} />}
      </Stack.Screen>

      <Stack.Screen
        name="Chat"
        options={({ route }) => ({
          title: route.params?.coach?.name || "Chat",
          headerStyle: { backgroundColor: "#4285F4" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        })}
      >
        {(props) => <ProtectedScreen component={ChatScreen} {...props} />}
      </Stack.Screen>

      <Stack.Screen name="Profile" options={{ title: "Your Profile" }}>
        {(props) => <ProtectedScreen component={ProfileScreen} {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default MainStack;
