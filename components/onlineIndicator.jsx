import React from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";

const OnlineIndicator = () => {
  const pulseAnim = new Animated.Value(1);

  // Pulsing Animation
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.5,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ])
  ).start();

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          { opacity: pulseAnim }, // Apply animation
        ]}
      />
      <Text style={styles.text}>Online</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#20c883",
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    color: "#20c883",
  },
});

export default OnlineIndicator;
