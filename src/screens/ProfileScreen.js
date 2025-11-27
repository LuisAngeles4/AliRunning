// src/screens/ProfileScreen.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AvatarBadge from "../components/AvatarBadge";
import { getRuns } from "../utils/storage";
import { analyzeRuns } from "../utils/insights";
import { getAllBestTimes } from "../utils/timeUtils";

const GOLD = "#FFD700";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [runs, setRuns] = useState([]);
  const [insight, setInsight] = useState(null);
  const [bestTimes, setBestTimes] = useState({});

  const load = async () => {
    const data = await getRuns();
    setRuns(Array.isArray(data) ? data : []);
    setInsight(analyzeRuns(data || []));
  };

  useEffect(() => {
    load();
    getAllBestTimes().then(setBestTimes);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const avgPace = insight?.summary?.avgPace5;
  let level = insight?.summary?.level || "Principiante";

  const paceTarget = level === "Principiante" ? 7 : level === "Intermedio" ? 5 : 4.5;
  const paceCeil = level === "Principiante" ? 9 : level === "Intermedio" ? 7 : 5;
  let progress = 0;
  if (Number.isFinite(avgPace)) {
    const clamped = Math.min(Math.max(avgPace, paceTarget), paceCeil);
    const range = paceCeil - paceTarget;
    progress = 1 - (clamped - paceTarget) / (range || 1);
  }

  const weekly = (() => {
    if (!insight) return { sessions: 0, hasQuality: false, hasLong: false, km: 0 };
    const last7d = insight.last5.filter(r => (Date.now() - new Date(r.date).getTime()) <= 7 * 24 * 3600 * 1000);
    const km = last7d.reduce((s, r) => s + (r.distanceM || 0) / 1000, 0);
    const sessions = last7d.length;
    const hasQuality = last7d.some(r => {
      const kmr = (r.distanceM || 0) / 1000;
      if (kmr <= 0) return false;
      const paceMin = (r.durationMs / 60000) / kmr;
      return paceMin < 6.0;
    });
    const hasLong = last7d.some(r => (r.distanceM || 0) / 1000 >= 8);
    return { sessions, hasQuality, hasLong, km };
  })();

  const Check = ({ ok, label }) => (
    <View style={styles.checkRow}>
      <View style={[styles.dot, { backgroundColor: ok ? "#2ECC71" : "#777" }]} />
      <Text style={styles.checkLabel}>{label}</Text>
    </View>
  );

  const fmtMin = (m) => {
    if (!Number.isFinite(m)) return "—";
    const min = Math.floor(m);
    const sec = Math.round((m - min) * 60);
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

const handleLogout = async () => {
  // Borra SOLO lo relacionado con sesión, NO las carreras
  await AsyncStorage.multiRemove([
    "access_token",
    "refresh_token",
    "user_profile",
    "current_user_id", // opcional: así “olvidas” qué usuario quedó activo
  ]);
  navigation.reset({ index: 0, routes: [{ name: "Login" }] });
};

  const handleChallenge = () => {
    Alert.alert(
      "Selecciona la distancia del reto",
      "Elige la distancia para intentar superar tu mejor tiempo",
      [
        { text: "5 km", onPress: () => navigation.navigate("Tracking", { targetKm: 5 }) },
        { text: "10 km", onPress: () => navigation.navigate("Tracking", { targetKm: 10 }) },
        { text: "21 km", onPress: () => navigation.navigate("Tracking", { targetKm: 21 }) },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#000" }}
      contentContainerStyle={{
        paddingTop: (insets.top || 0) + 8,
        paddingBottom: (insets.bottom || 0) + 24,
        paddingHorizontal: 16,
      }}
    >
      <Text style={styles.title}>Perfil</Text>

      {/* Avatar y nivel */}
      <View style={styles.avatarCard}>
        <AvatarBadge level={level} size={84} showLabel />
        <View style={{ marginTop: 10, alignItems: "center" }}>
          <Text style={styles.levelText}>Nivel actual</Text>
          <Text style={styles.levelBig}>{level}</Text>
        </View>

        {/* Progreso */}
        <View style={{ width: "100%", marginTop: 16 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.progressLabel}>Progreso al siguiente nivel</Text>
            <Text style={styles.progressPerc}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFg, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
          </View>
          <View style={styles.progressHintRow}>
            <Text style={styles.progressHint}>Objetivo ritmo: {paceTarget.toFixed(2)} min/km</Text>
            <Text style={styles.progressHint}>Tu ritmo: {fmtMin(avgPace)}</Text>
          </View>
        </View>
      </View>

      {/* Métricas */}
      <View style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>Últimas 5 carreras</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{fmtMin(insight?.summary?.avgPace5)}</Text>
            <Text style={styles.metricLabel}>ritmo prom.</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{fmtMin(insight?.summary?.bestPace)}</Text>
            <Text style={styles.metricLabel}>mejor ritmo</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>
              {Number.isFinite(insight?.summary?.avgGap) ? insight.summary.avgGap.toFixed(1) : "—"}
            </Text>
            <Text style={styles.metricLabel}>días entre</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{(insight?.summary?.totalKm5 || 0).toFixed(1)}</Text>
            <Text style={styles.metricLabel}>km totales</Text>
          </View>
        </View>
      </View>

      {/* Misiones */}
      <View style={styles.missionsCard}>
        <Text style={styles.sectionTitle}>Misiones (últimos 7 días)</Text>
        <Check ok={weekly.sessions >= 3} label={`Consistencia: ${weekly.sessions}/3 sesiones`} />
        <Check ok={weekly.hasQuality} label="Sesión de calidad (<6:00 min/km)" />
        <Check ok={weekly.hasLong} label="Tirada larga (≥ 8 km)" />
        <View style={styles.kmRow}>
          <Text style={styles.kmText}>Kilometraje: {weekly.km.toFixed(1)} km</Text>
          <Text style={styles.kmHint}>Objetivo sugerido: 15–25 km</Text>
        </View>

        <View style={styles.adviceWrap}>
          <Text style={styles.adviceTitle}>Carga & fatiga</Text>
          <Text style={[styles.badge, (insight?.summary?.overtrainingRisk ? styles.badgeHigh : styles.badgeOk)]}>
            {insight?.summary?.overtrainingRisk ? "Riesgo alto" : "Riesgo ok"}
          </Text>
        </View>
        {insight?.recommendations?.length > 0 && insight.recommendations.map((r, i) => (
          <Text key={i} style={styles.recItem}>• {r}</Text>
        ))}
      </View>

      {/* Mejores tiempos */}
      <View style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>Tus mejores tiempos</Text>
        {Object.keys(bestTimes).length === 0 ? (
          <Text style={{ color: "#aaa" }}>Aún no tienes récords guardados.</Text>
        ) : (
          Object.entries(bestTimes).map(([km, t]) => (
            <Text key={km} style={{ color: "#fff", marginVertical: 2 }}>
              🏁 {km} km — {(t / 60).toFixed(1)} min
            </Text>
          ))
        )}
      </View>

      {/* Botones */}
      <TouchableOpacity style={styles.cta} onPress={handleChallenge}>
        <Text style={styles.ctaText}>🏁 Retar mi mejor tiempo/Crear nuevo récord</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.cta, { borderColor: "#E53935" }]} onPress={handleLogout}>
        <Text style={[styles.ctaText, { color: "#E53935" }]}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: GOLD, fontSize: 26, fontWeight: "900", marginBottom: 12 },
  avatarCard: { backgroundColor: "#111", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#222", alignItems: "center", marginBottom: 12 },
  levelText: { color: "#aaa", fontSize: 12, fontWeight: "700" },
  levelBig: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 2 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { color: "#fff", fontSize: 12, fontWeight: "700" },
  progressPerc: { color: "#fff", fontSize: 12, fontWeight: "900" },
  progressBarBg: { height: 10, backgroundColor: "#222", borderRadius: 10, marginTop: 8, overflow: "hidden" },
  progressBarFg: { height: 10, backgroundColor: GOLD, borderRadius: 10 },
  progressHintRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  progressHint: { color: "#aaa", fontSize: 11 },
  metricsCard: { backgroundColor: "#111", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#222", marginBottom: 12 },
  sectionTitle: { color: GOLD, fontWeight: "800", marginBottom: 8, fontSize: 16 },
  metricsRow: { flexDirection: "row", justifyContent: "space-between" },
  metricBox: { flex: 1, alignItems: "center", paddingVertical: 6 },
  metricValue: { color: "#fff", fontSize: 16, fontWeight: "900" },
  metricLabel: { color: "#aaa", fontSize: 12, marginTop: 2 },
  missionsCard: { backgroundColor: "#111", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#222", marginBottom: 12 },
  checkRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  checkLabel: { color: "#fff", fontSize: 14 },
  kmRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  kmText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  kmHint: { color: "#aaa", fontSize: 12 },
  adviceWrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  adviceTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden", fontWeight: "800" },
  badgeHigh: { backgroundColor: "#E53935", color: "#000" },
  badgeOk: { backgroundColor: "#2ECC71", color: "#000" },
  recItem: { color: "#ddd", fontSize: 12, marginTop: 6 },
  cta: { backgroundColor: "#000", borderWidth: 2, borderColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  ctaText: { color: GOLD, fontSize: 16, fontWeight: "900" },
});
