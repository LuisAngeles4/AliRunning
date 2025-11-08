import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function AppButton({ title, onPress, variant = "gold" }) {
  const backgroundColor = variant === "gold" ? "#FFD700" : "#fff";
  const textColor = variant === "gold" ? "#000" : "#000";

  return (
    <TouchableOpacity style={[styles.button, { backgroundColor }]} onPress={onPress}>
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 25,
  },
  text: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold_Italic",
  },
});
