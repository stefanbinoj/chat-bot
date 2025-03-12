import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://localhost:4002";

// Function to handle different platforms (web vs native)
export const storeToken = async (token) => {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem("userToken", token);
    } else {
      await AsyncStorage.setItem("userToken", token);
    }
    return true;
  } catch (error) {
    console.error("Error storing token:", error);
    return false;
  }
};

export const getToken = async () => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem("userToken");
    } else {
      return await AsyncStorage.getItem("userToken");
    }
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem("userToken");
    } else {
      await AsyncStorage.removeItem("userToken");
    }
    return true;
  } catch (error) {
    console.error("Error removing token:", error);
    return false;
  }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    const { token } = response.data;
    await storeToken(token);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Login failed",
    };
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      name,
      email,
      password,
    });
    const { token } = response.data;
    await storeToken(token);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Registration failed",
    };
  }
};
