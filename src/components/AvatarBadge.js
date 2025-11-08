// src/components/AvatarBadge.js
import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { AVATAR_BY_LEVEL, LEVEL_COLORS } from "../constants/avatars";

export default function AvatarBadge({ level = "Principiante", size = 40, showLabel = true }) {
  const src = AVATAR_BY_LEVEL[level] || AVATAR_BY_LEVEL.Principiante;
  const color = LEVEL_COLORS[level] || "#FFD700";

  return (
    <View
      style={[
        styles.wrap,
        { borderColor: color, width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 },
      ]}
    >
      {src ? (
        <Image
          source={src}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        // Fallback si no pusiste imágenes aún
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#222",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>🏅</Text>
        </View>
      )}
      {showLabel && <Text style={styles.label}>{level}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  label: {
    marginTop: 4,
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
