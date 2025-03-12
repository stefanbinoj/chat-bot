import React, { createContext, useState, useContext, useEffect } from "react";
import { AppState } from "react-native";
import {
  apiWithHeaders,
  storeToken,
  removeToken,
  getToken,
} from "../utils/tokenHandler";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [sessionValid, setSessionValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEndUser, setIsEndUser] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const checkSession = async () => {
    if (isLoading && sessionValid) return; // Prevent multiple simultaneous checks

    setIsLoading(true);
    try {
      // First check if we have a token
      const token = await getToken();
      if (!token) {
        setSessionValid(false);
        setIsLoading(false);
        return;
      }

      const response = await apiWithHeaders.get("/api/session/session-check");

      if (response.data.status !== "success" || !response.data.isValid) {
        setSessionValid(false);
        await removeToken();
        //naviagate to login page todo
      } else {
        setIsEndUser(response.data.isEndUser);
        setSessionValid(true);
      }
    } catch (error) {
      console.error("Session check failed:", error);
      setSessionValid(false);
      await removeToken();
      //naviagate to login page todo
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiWithHeaders.post("/api/session/logout");
      //naviagate to login page todo
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Always remove token and update state regardless of API success
      await removeToken();
      setSessionValid(false);
    }
  };

  // Function to manually refresh the session
  const refreshSession = async () => {
    await checkSession();
  };

  // Check session on initial mount
  useEffect(() => {
    checkSession();
  }, []);

  // Re-check session when returning to the app from background
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active" && lastChecked) {
        // If it's been more than 5 minutes since the last check
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

        if (lastChecked < fiveMinutesAgo) {
          checkSession();
        }
      }
    };

    // Add app state change listener
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [lastChecked]);

  const value = {
    sessionValid,
    isLoading,
    isEndUser,
    logout,
    refreshSession,
    lastChecked,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
