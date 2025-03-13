import React, { createContext, useState, useContext, useEffect } from "react";
import { apiWithHeaders, removeToken, getToken } from "../utils/tokenHandler";
import { AppState } from "react-native";
import { CommonActions } from "@react-navigation/native";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [sessionValid, setSessionValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEndUser, setIsEndUser] = useState(false);
  const [lastChecked, setLastChecked] = useState(null); // Add this line

  const navigationRef = React.useRef(null);

  const checkSession = async () => {
    if (isLoading && sessionValid) return; // Prevent multiple simultaneous checks

    setIsLoading(true);
    try {
      // First check if we have a token
      const token = await getToken();
      if (!token) {
        setSessionValid(false);
        setIsLoading(false);
        // Navigate to login page

        if (navigationRef.current) {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        }
        return;
      }

      const response = await apiWithHeaders.get("/api/session/session-check");

      if (response.data.status !== "success" || !response.data.isValid) {
        setSessionValid(false);
        await removeToken();
        // Navigate to login page
        if (navigationRef.current) {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        }
      } else {
        setIsEndUser(response.data.isEndUser);
        setSessionValid(true);
        // Navigate to dashboard
        if (navigationRef.current) {
          const currentRoute = navigationRef.current.getCurrentRoute();
          if (
            currentRoute &&
            (currentRoute.name === "Login" || currentRoute.name === "Register")
          ) {
            navigationRef.current.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Dashboard" }],
              })
            );
          }
        }
      }
    } catch (error) {
      console.error("Session check failed:", error);
      setSessionValid(false);
      await removeToken();
      //naviagate to login page todo
      if (navigationRef.current) {
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
      }
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkSession();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const refreshSession = async () => {
    await checkSession();
  };
  // Check session on initial mount
  useEffect(() => {
    checkSession();
  }, []);

  const value = {
    sessionValid,
    isLoading,
    isEndUser,
    refreshSession,
    navigationRef,
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
