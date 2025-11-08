// src/screens/ManualRunScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { saveRun } from "../utils/storage";

const GOLD = "#FFD700";

export default function ManualRunScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm
  const [distanceKm, setDistanceKm] = useState("");
  const [hh, setHh] = useState("0");
  const [mm, setMm] = useState("0");
  const [ss, setSs] = useState("0");
  const [calories, setCalories] = useState("");

  const onSave = async () => {
    const km = parseFloat(String(distanceKm).replace(",", "."));
    const h = parseInt(hh || "0", 10);
    const m = parseInt(mm || "0", 10);
    const s = parseInt(ss || "0", 10);
    const durationMs = ((h * 3600) + (m * 60) + s) * 1000;

    if (!km || km <= 0) return Alert.alert("Distancia inválida", "Ingresa una distancia en km.");
    if (!durationMs || durationMs <= 0) return Alert.alert("Duración inválida", "Ingresa un tiempo mayor a 0.");

    const paceMin = durationMs / 60000 / km;
    const paceStr = `${Math.floor(paceMin)}:${String(Math.round((paceMin % 1) * 60)).padStart(2, "0")}`;
    const kcals = calories ? parseInt(calories, 10) : Math.round(km * 70);

    const run = {
      id: Date.now(),
      date: new Date(dateStr).toISOString(),
      durationMs,
      distanceM: Math.round(km * 1000),
      pace: paceStr,
      calories: kcals,
      coords: [], // caminadora: sin ruta
    };

    try {
      await saveRun(run);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar la carrera.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: (insets.top || 0) + 8,
          paddingHorizontal: 16,
          paddingBottom: 24 + (insets.bottom || 0),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Añadir carrera manual</Text>

        <Text style={styles.label}>Fecha y hora</Text>
        <TextInput
          style={styles.input}
          value={dateStr}
          onChangeText={setDateStr}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor="#777"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Distancia (km)</Text>
        <TextInput
          style={styles.input}
          value={distanceKm}
          onChangeText={setDistanceKm}
          keyboardType="decimal-pad"
          placeholder="Ej: 5"
          placeholderTextColor="#777"
        />

        <Text style={styles.label}>Duración (hh:mm:ss)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={hh}
            onChangeText={setHh}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.sep}>:</Text>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={mm}
            onChangeText={setMm}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.sep}>:</Text>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={ss}
            onChangeText={setSs}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <Text style={styles.label}>Calorías (opcional)</Text>
        <TextInput
          style={styles.input}
          value={calories}
          onChangeText={setCalories}
          keyboardType="number-pad"
          placeholder="Se calcularán automáticamente si lo dejas vacío"
          placeholderTextColor="#777"
        />

        <TouchableOpacity style={[styles.btn, { marginBottom: (insets.bottom || 0) + 8 }]} onPress={onSave}>
          <Text style={styles.btnText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: {
    color: GOLD,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  label: { color: "#fff", marginTop: 10, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "#111",
    borderColor: "#222",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },
  row: { flexDirection: "row", alignItems: "center" },
  sep: { color: "#fff", marginHorizontal: 6, fontSize: 18, fontWeight: "800" },
  inputSmall: { flex: 1, textAlign: "center", marginBottom: 8 },

  btn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },
  btnText: { color: "#000", fontSize: 16, fontWeight: "800" },
});
