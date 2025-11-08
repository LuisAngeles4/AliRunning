import React from "react";
import { Text, StyleSheet } from "react-native";

export default function ErrorMessage({ message }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    color: "red",
    fontFamily: "Poppins_400Regular",
    marginBottom: 10,
    textAlign: "center",
  },
});
