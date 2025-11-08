// src/screens/TrackingScreen.js
import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import haversine from "haversine";
import { useRoute } from "@react-navigation/native";

import { saveRun } from "../utils/storage";
import { saveBestTime, getBestTime } from "../utils/timeUtils";

const GOLD = "#FFD700";
const BG = "#000";
const MUTED = "#BFBFBF";
const GPS_OK = "#2ECC71";

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const targetKm = route.params?.targetKm || null;

  const [hasPermission, setHasPermission] = useState(false);
  const [status, setStatus] = useState("idle");
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [region, setRegion] = useState(null);

  const watchId = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const ok = status === "granted";
      setHasPermission(ok);

      if (ok) {
        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;
        setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      }
    })();
    return () => stopRun();
  }, []);

  const formatHMS = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const paceMin = distance > 0 ? (elapsedTime / 60000) / (distance / 1000) : 0;
  const paceStr =
    distance > 0
      ? `${Math.floor(paceMin)}:${String(Math.round((paceMin % 1) * 60)).padStart(2, "0")}`
      : "00:00";

  const calories = Math.round((distance / 1000) * 70);

  const buildRun = () => ({
    id: Date.now(),
    date: new Date().toISOString(),
    durationMs: elapsedTime,
    distanceM: distance,
    pace: paceStr,
    calories,
    coords: routeCoords,
  });

  const startRun = async () => {
    setStatus("running");
    setRouteCoords([]);
    setDistance(0);
    const start = Date.now();
    setStartTime(start);
    setElapsedTime(0);

    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setElapsedTime(Date.now() - start), 1000);

    watchId.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setRegion((r) =>
          r
            ? { ...r, latitude, longitude }
            : { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
        );
        setRouteCoords((prev) => {
          if (prev.length > 0) {
            setDistance(
              (d) =>
                d + haversine(prev[prev.length - 1], { latitude, longitude }, { unit: "meter" })
            );
          }
          return [...prev, { latitude, longitude }];
        });
      }
    );
  };

  const pauseRun = () => {
    setStatus("paused");
    if (watchId.current) {
      watchId.current.remove();
      watchId.current = null;
    }
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const resumeRun = async () => {
    setStatus("running");
    const base = Date.now() - elapsedTime;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setElapsedTime(Date.now() - base), 1000);
    watchId.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setRegion((r) =>
          r
            ? { ...r, latitude, longitude }
            : { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
        );
        setRouteCoords((prev) => {
          if (prev.length > 0) {
            setDistance(
              (d) =>
                d + haversine(prev[prev.length - 1], { latitude, longitude }, { unit: "meter" })
            );
          }
          return [...prev, { latitude, longitude }];
        });
      }
    );
  };

  const stopRun = async () => {
    if (watchId.current) watchId.current.remove();
    if (timer.current) clearInterval(timer.current);

    if (elapsedTime > 0) {
      try {
        const run = buildRun();
        await saveRun(run);
        const totalKm = distance / 1000;
        const durationSeconds = elapsedTime / 1000;

        if (targetKm) {
          const diff = Math.abs(totalKm - targetKm);
          if (diff <= 0.3) {
            const prevBest = await getBestTime(targetKm);
            const isNew = await saveBestTime(targetKm, durationSeconds);

            if (!prevBest) {
              Alert.alert(
                "🏁 Primer intento",
                `Se ha guardado tu primer tiempo en ${targetKm} km: ${durationSeconds.toFixed(1)} s`
              );
            } else if (isNew) {
              Alert.alert(
                "🔥 ¡Nuevo récord!",
                `Nuevo mejor tiempo en ${targetKm} km: ${durationSeconds.toFixed(1)} s (anterior: ${prevBest.toFixed(1)} s)`
              );
            } else {
              Alert.alert(
                "💪 Casi lo logras",
                `Tu tiempo fue ${durationSeconds.toFixed(1)} s. Tu récord actual en ${targetKm} km es ${prevBest.toFixed(1)} s`
              );
            }
          } else {
            Alert.alert(
              "⚠️ Reto inválido",
              `Recorriste ${totalKm.toFixed(2)} km. El reto era ${targetKm} km ±0.3 km`
            );
          }
        } else {
          Alert.alert("🏁 Carrera guardada", `Tiempo total: ${durationSeconds.toFixed(1)} s`);
        }
      } catch (e) {
        console.warn("No se pudo guardar la carrera:", e);
      }
    }

    setStatus("idle");
    setElapsedTime(0);
    setStartTime(null);
    setRouteCoords([]);
    setDistance(0);
  };

  return (
    <View style={styles.container}>
      {hasPermission ? (
        <>
          <View style={[styles.header, { paddingTop: (insets.top || 0) + 6 }]}>
            <View style={styles.timerRow}>
              <Text style={styles.timer}>{formatHMS(elapsedTime)}</Text>
              <View style={[styles.gpsPill, styles.gpsPillAbs]}>
                <View style={[styles.gpsDot, { backgroundColor: hasPermission ? GPS_OK : MUTED }]} />
                <Text style={styles.gpsText}>GPS</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{(distance / 1000).toFixed(2)}</Text>
                <Text style={styles.metricLabel}>Distancia (km)</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{calories}</Text>
                <Text style={styles.metricLabel}>Calorías (kcal)</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{paceStr}</Text>
                <Text style={styles.metricLabel}>Ritmo medio</Text>
              </View>
            </View>
          </View>

          <View style={styles.mapWrap}>
            <MapView
              style={styles.map}
              showsUserLocation
              followsUserLocation
              initialRegion={
                region || {
                  latitude: 19.4326,
                  longitude: -99.1332,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }
              }
              region={region || undefined}
            >
              {routeCoords.length > 0 && (
                <>
                  <Polyline coordinates={routeCoords} strokeColor={GOLD} strokeWidth={5} />
                  <Marker coordinate={routeCoords[0]} title="Inicio" />
                </>
              )}
            </MapView>

            <View style={[styles.ctaBar, { bottom: 16 + (insets.bottom || 0) }]}>
              {status === "idle" && (
                <TouchableOpacity style={styles.ctaBtn} onPress={startRun}>
                  <Text style={styles.ctaText}>INICIAR</Text>
                  <Text style={styles.ctaSub}>Running</Text>
                  <Text style={styles.ctaArrow}>→</Text>
                </TouchableOpacity>
              )}
              {status === "running" && (
                <View style={styles.dualBtns}>
                  <TouchableOpacity style={[styles.roundBtn, { backgroundColor: GOLD }]} onPress={pauseRun}>
                    <Text style={styles.roundBtnText}>Pausar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.roundBtn, { backgroundColor: "#E53935" }]} onPress={stopRun}>
                    <Text style={styles.roundBtnText}>Detener</Text>
                  </TouchableOpacity>
                </View>
              )}
              {status === "paused" && (
                <View style={styles.dualBtns}>
                  <TouchableOpacity style={[styles.roundBtn, { backgroundColor: GOLD }]} onPress={resumeRun}>
                    <Text style={styles.roundBtnText}>Reanudar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.roundBtn, { backgroundColor: "#E53935" }]} onPress={stopRun}>
                    <Text style={styles.roundBtnText}>Detener</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </>
      ) : (
        <Text style={{ color: "#fff", marginTop: insets.top + 24, textAlign: "center" }}>
          Permiso de ubicación no concedido
        </Text>
      )}
    </View>
  );
}

const shadow = Platform.select({
  ios: { shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 8 } },
  android: { elevation: 6 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { backgroundColor: "#fff", paddingBottom: 14, paddingHorizontal: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, ...shadow },
  timerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative" },
  timer: { fontSize: 44, fontWeight: "800", letterSpacing: 2, color: "#000" },
  gpsPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F5", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  gpsPillAbs: { position: "absolute", right: 0 },
  gpsDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  gpsText: { fontSize: 12, color: "#000", fontWeight: "700" },
  metricsRow: { marginTop: 8, flexDirection: "row", justifyContent: "space-between" },
  metricBox: { flex: 1, alignItems: "center" },
  metricValue: { color: "#000", fontSize: 22, fontWeight: "800" },
  metricLabel: { color: "#555", fontSize: 12, marginTop: 2 },
  mapWrap: { flex: 1, marginTop: 10 },
  map: { flex: 1 },
  ctaBar: { position: "absolute", left: 16, right: 16 },
  ctaBtn: { backgroundColor: "#000", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, borderWidth: 2, borderColor: GOLD, flexDirection: "row", alignItems: "center", justifyContent: "space-between", ...shadow },
  ctaText: { color: GOLD, fontSize: 16, fontWeight: "800", letterSpacing: 1.2 },
  ctaSub: { color: MUTED, fontSize: 12, fontWeight: "600" },
  ctaArrow: { color: "#fff", fontSize: 18, fontWeight: "800" },
  dualBtns: { flexDirection: "row", justifyContent: "space-between" },
  roundBtn: { flex: 1, marginHorizontal: 6, borderRadius: 14, paddingVertical: 14, alignItems: "center", ...shadow },
  roundBtnText: { color: "#000", fontSize: 16, fontWeight: "800" },
});
