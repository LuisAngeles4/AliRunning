// src/utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// Claves base
const RUNS_BASE = "runs_v1";
const CURRENT_USER_KEY = "current_user_id";

// --- Helpers de usuario ---
export async function setCurrentUser(userId) {
  // Llama esto en login (usa un id estable: uid/email)
  await AsyncStorage.setItem(CURRENT_USER_KEY, String(userId || "anon"));
}

export async function getCurrentUser() {
  const id = await AsyncStorage.getItem(CURRENT_USER_KEY);
  return id || "anon";
}

function keyFor(userId) {
  return `${RUNS_BASE}:${userId}`;
}

// --- Migración (si venías usando la clave global sin usuario) ---
async function migrateIfNeeded(userId) {
  const globalRaw = await AsyncStorage.getItem(RUNS_BASE);
  const namespacedKey = keyFor(userId);
  const namespacedHas = await AsyncStorage.getItem(namespacedKey);

  if (globalRaw && !namespacedHas) {
    await AsyncStorage.setItem(namespacedKey, globalRaw);
    // No borramos la global por si alguna pantalla vieja aún la lee.
    // Si quieres limpiarla luego: await AsyncStorage.removeItem(RUNS_BASE);
  }
}

// --- API pública ---
export async function getRuns(userIdOpt) {
  const userId = userIdOpt || (await getCurrentUser());
  await migrateIfNeeded(userId);
  const raw = await AsyncStorage.getItem(keyFor(userId));
  return raw ? JSON.parse(raw) : [];
}

export async function saveRun(run, userIdOpt) {
  const userId = userIdOpt || (await getCurrentUser());
  await migrateIfNeeded(userId);
  const list = await getRuns(userId);
  list.unshift(run);
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(list));
}

export async function clearRuns(userIdOpt) {
  const userId = userIdOpt || (await getCurrentUser());
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify([]));
}
