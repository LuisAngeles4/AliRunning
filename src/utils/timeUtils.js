// src/utils/timeUtils.js
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Guarda los mejores tiempos por distancia objetivo.
 * Ejemplo de estructura en AsyncStorage:
 * {
 *   "5": 1400,   // mejor tiempo para 5 km en segundos
 *   "10": 3100
 * }
 */

const BEST_TIMES_KEY = "best_times_by_distance";

/** Obtiene todos los récords guardados */
export const getAllBestTimes = async () => {
  const data = await AsyncStorage.getItem(BEST_TIMES_KEY);
  return data ? JSON.parse(data) : {};
};

/** Devuelve el mejor tiempo (en segundos) para una distancia (km) */
export const getBestTime = async (targetKm) => {
  const all = await getAllBestTimes();
  return all[String(targetKm)] || null;
};

/**
 * Guarda un mejor tiempo si es más rápido.
 * @param {number} targetKm - distancia del reto (e.g. 5 o 10)
 * @param {number} timeSeconds - tiempo total en segundos
 * @returns {boolean} true si se establece un nuevo récord
 */
export const saveBestTime = async (targetKm, timeSeconds) => {
  const all = await getAllBestTimes();
  const prev = all[String(targetKm)];
  if (!prev || timeSeconds < prev) {
    all[String(targetKm)] = timeSeconds;
    await AsyncStorage.setItem(BEST_TIMES_KEY, JSON.stringify(all));
    return true;
  }
  return false;
};

/** Limpia todos los récords (solo para debugging o logout) */
export const resetAllBestTimes = async () => {
  await AsyncStorage.removeItem(BEST_TIMES_KEY);
};
