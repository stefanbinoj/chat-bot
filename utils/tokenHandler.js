import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";
import { API_URL } from "../constant";

// Save token - supports both AsyncStorage and localStorage
export const storeToken = async (token) => {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem("userToken", token);
    } else {
      await AsyncStorage.setItem("userToken", token);
    }
  } catch (error) {
    console.error("Error storing token:", error);
  }
};

// Get token - supports both AsyncStorage and localStorage
export const getToken = async () => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem("userToken");
    } else {
      return await AsyncStorage.getItem("userToken");
    }
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
};

// Remove token - supports both AsyncStorage and localStorage
export const removeToken = async () => {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem("userToken");
    } else {
      await AsyncStorage.removeItem("userToken");
    }
  } catch (error) {
    console.error("Error removing token:", error);
  }
};

// Create axios instance with interceptors
const createAuthAxiosInstance = () => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor to add token to headers
  instance.interceptors.request.use(
    async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle 401 Unauthorized errors (token expired)
      if (error.response?.status === 401) {
        console.log("Authentication failed - redirecting to login");
        await removeToken();
        // Navigation handling will be done in App.js
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export the axios instance
export const apiWithHeaders = createAuthAxiosInstance();

// Additional helper for checking if user is authenticated
export const isAuthenticated = async () => {
  const token = await getToken();
  return !!token;
};
