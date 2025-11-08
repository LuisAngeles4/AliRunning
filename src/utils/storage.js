// src/utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "runs_v1";

export async function getRuns() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveRun(run) {
  const list = await getRuns();
  list.unshift(run); // agrega al inicio
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function clearRuns() {
  await AsyncStorage.setItem(KEY, JSON.stringify([]));
}
