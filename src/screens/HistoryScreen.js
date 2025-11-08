// src/screens/HistoryScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getRuns } from "../utils/storage";
import { analyzeRuns } from "../utils/insights";

const GOLD = "#FFD700";

export default function HistoryScreen() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRuns();
      setRuns(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const msToHMS = (ms) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  };

  const fmtMin = (m) => {
    if (!isFinite(m)) return "—";
    const min = Math.floor(m);
    const sec = Math.round((m - min) * 60);
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

  const insight = analyzeRuns(runs);

  const renderItem = ({ item }) => {
    const coords = item?.coords || [];
    const hasRoute = coords.length > 1;
    const first = hasRoute
      ? coords[0]
      : { latitude: 19.4326, longitude: -99.1332 };
    const region = {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>
            {new Date(item.date).toLocaleString()}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>
              {(item.distanceM / 1000).toFixed(2)}
            </Text>
            <Text style={styles.metricLabel}>km</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{msToHMS(item.durationMs)}</Text>
            <Text style={styles.metricLabel}>duración</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{item.pace}</Text>
            <Text style={styles.metricLabel}>ritmo</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{item.calories}</Text>
            <Text style={styles.metricLabel}>kcal</Text>
          </View>
        </View>

        <View style={styles.mapWrap}>
          <MapView style={styles.miniMap} pointerEvents="none" initialRegion={region}>
            {hasRoute && (
              <Polyline coordinates={coords} strokeColor={GOLD} strokeWidth={4} />
            )}
          </MapView>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: (insets.top || 0) + 8 }]}>
      <Text style={styles.title}>Historial</Text>

      {/* Resumen últimas 5 */}
      {runs.length > 0 && (
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Resumen (últimas 5)</Text>

          <View style={styles.insightRow}>
            <View style={styles.insightBox}>
              <Text style={styles.insightValue}>
                {insight.summary.totalKm5.toFixed(1)}
              </Text>
              <Text style={styles.insightLabel}>km totales</Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={styles.insightValue}>
                {fmtMin(insight.summary.avgPace5)}
              </Text>
              <Text style={styles.insightLabel}>ritmo prom.</Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={styles.insightValue}>
                {fmtMin(insight.summary.bestPace)}
              </Text>
              <Text style={styles.insightLabel}>mejor ritmo</Text>
            </View>
          </View>

          <View style={styles.insightRow}>
            <View style={styles.insightBox}>
              <Text style={styles.insightValue}>
                {Number.isFinite(insight.summary.avgGap)
                  ? insight.summary.avgGap.toFixed(1)
                  : "—"}
              </Text>
              <Text style={styles.insightLabel}>días entre</Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={styles.insightValue}>{insight.summary.level}</Text>
              <Text style={styles.insightLabel}>nivel</Text>
            </View>
            <View style={styles.insightBox}>
              <Text
                style={[
                  styles.badge,
                  insight.summary.overtrainingRisk
                    ? styles.badgeHigh
                    : styles.badgeOk,
                ]}
              >
                {insight.summary.overtrainingRisk ? "Riesgo alto" : "Riesgo ok"}
              </Text>
              <Text style={styles.insightLabel}>fatiga</Text>
            </View>
          </View>

          {insight.recommendations.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {insight.recommendations.map((r, i) => (
                <Text key={i} style={styles.recItem}>
                  • {r}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {runs.length === 0 && !loading ? (
        <Text style={styles.subtitle}>Aún no tienes carreras guardadas</Text>
      ) : (
        <FlatList
          data={runs}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              tintColor={GOLD}
              colors={[GOLD]}
            />
          }
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 24 + (insets.bottom || 0),
          }}
        />
      )}

      {/* FAB: Añadir manualmente */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 20 + (insets.bottom || 0) }]}
        onPress={() => navigation.navigate("ManualRun")}
        activeOpacity={0.85}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 16 },
  title: {
    color: GOLD,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  subtitle: { color: "#fff", fontSize: 14, textAlign: "center", marginTop: 24 },

  // ---- Resumen ----
  insightCard: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  insightTitle: { color: GOLD, fontWeight: "800", marginBottom: 8, fontSize: 16 },
  insightRow: { flexDirection: "row", justifyContent: "space-between" },
  insightBox: { flex: 1, alignItems: "center", paddingVertical: 6 },
  insightValue: { color: "#fff", fontSize: 16, fontWeight: "900" },
  insightLabel: { color: "#aaa", fontSize: 12, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "800",
  },
  badgeHigh: { backgroundColor: "#E53935", color: "#000" },
  badgeOk: { backgroundColor: "#2ECC71", color: "#000" },
  recItem: { color: "#ddd", fontSize: 12, marginTop: 4 },

  // ---- Cards de carreras ----
  card: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  cardHeader: { marginBottom: 8 },
  cardDate: { color: GOLD, fontWeight: "700" },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  metricBox: { flex: 1, alignItems: "center" },
  metricValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  metricLabel: { color: "#aaa", fontSize: 12, marginTop: 2 },

  mapWrap: { overflow: "hidden", borderRadius: 12 },
  miniMap: { height: 140, width: "100%" },

  // ---- FAB ----
  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: GOLD,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  fabPlus: { color: "#000", fontSize: 32, lineHeight: 32, fontWeight: "900" },
});
