import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Helper functions for splash screen persistence
export const shouldShowSplash = async () => {
  try {
    const splashShown = await AsyncStorage.getItem("splashShown");
    return splashShown != "true";
  } catch (error) {
    console.error("Error checking splash status:", error);
    return true;
  }
};

export const markSplashAsShown = async () => {
  try {
    await AsyncStorage.setItem("splashShown", "true");
  } catch (error) {
    console.error("Error setting splash status:", error);
  }
};

const SplashScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(-20)).current;

  // Features to display in the splash screen
  const features = [
    {
      title: "Smart AI Assistant",
      description:
        "Get intelligent responses and help with any questions you have about your company's products and services.",
      iconName: "chatbubble-ellipses-outline",
      bgColor: "#20c883",
    },
    {
      title: "24/7 Availability",
      description:
        "Our AI is always ready to help, day or night, providing consistent support whenever you need it.",
      iconName: "time-outline",
      bgColor: "#1cb08e",
    },
    {
      title: "Personalized Experience",
      description:
        "Get answers tailored to your specific needs and questions about your company.",
      iconName: "person-outline",
      bgColor: "#20c883",
    },
  ];

  useEffect(() => {
    // Run entrance animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(iconAnim, {
        toValue: 0,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Animate slide transitions
    Animated.spring(slideAnim, {
      toValue: currentSlide,
      speed: 12,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  }, [currentSlide]);

  const handleComplete = async () => {
    await markSplashAsShown();
    navigation.replace("Login");
  };

  const handleNext = () => {
    if (currentSlide < features.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const renderFeature = () => {
    const feature = features[currentSlide];

    return (
      <Animated.View
        style={[
          styles.featureContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [
                    currentSlide - 1,
                    currentSlide,
                    currentSlide + 1,
                  ],
                  outputRange: [width, 0, -width],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: feature.bgColor }]}
        >
          <Ionicons name={feature.iconName} size={48} color="white" />
        </View>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.headerTitle}>Welcome to AI Chat Bot</Text>
          <Text style={styles.headerSubtitle}>
            Your intelligent assistant that's always ready to help you
          </Text>
        </Animated.View>

        {/* Feature Carousel */}
        <View style={styles.featureSlider}>{renderFeature()}</View>

        {/* Bottom Navigation */}
        <View style={styles.footer}>
          <View style={styles.indicators}>
            {features.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentSlide === index && styles.activeIndicator,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentSlide < features.length - 1 ? "Next" : "Get Started"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  card: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    padding: 24,

    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#20c883",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#20c883",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    maxWidth: "80%",
  },
  featureSlider: {
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  featureContainer: {
    width: "100%",
    alignItems: "center",
    position: "absolute",
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  indicators: {
    flexDirection: "row",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginRight: 8,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: "#20c883",
  },
  nextButton: {
    backgroundColor: "#20c883",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#20c883",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default SplashScreen;
