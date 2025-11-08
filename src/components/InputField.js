import React from "react";
import { TextInput, StyleSheet } from "react-native";

export default function InputField({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#aaa"
      style={styles.input}
      secureTextEntry={secureTextEntry}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    padding: 12,
    marginVertical: 8,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#1a1a1a", // fondo oscuro
    color: "#fff", // 👈 texto en blanco SI o SI
    fontSize: 16,

  },
});
