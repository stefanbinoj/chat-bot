import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "../screens/DashboardScreen";
import ChatScreen from "../screens/ChatScreen";
import ProtectedRoute from "../utils/protectedRoute";

const Stack = createNativeStackNavigator();

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

      <Stack.Screen name="Chat" options={{ headerShown: false }}>
        {(props) => <ProtectedScreen component={ChatScreen} {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default MainStack;
