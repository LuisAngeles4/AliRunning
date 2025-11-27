// src/utils/insights.js

// ----- Helpers básicos -----
const toMinPerKm = (run) => {
  const km = run.distanceM > 0 ? run.distanceM / 1000 : 0;
  if (!km) return Infinity;
  const paceMin = (run.durationMs / 60000) / km;
  return paceMin; // minutos por km (ej: 5.2 => 5:12 min/km)
};

const fmtMin = (m) => {
  if (!isFinite(m)) return "—";
  const min = Math.floor(m);
  const sec = Math.round((m - min) * 60);
  return `${min}:${String(sec).padStart(2, "0")}`;
};

const daysBetween = (a, b) => {
  const ms = Math.abs(new Date(a) - new Date(b));
  return ms / (1000 * 60 * 60 * 24);
};

// Nivel por ritmo promedio
export const levelFromPace = (paceMin) => {
  if (!isFinite(paceMin)) return "Sin datos";
  if (paceMin < 5) return "Avanzado";
  if (paceMin <= 7) return "Intermedio";
  return "Principiante";
};

// Intensidad por ritmo de cada sesión
// (cuanto más rápido, más intenso)
const intensityLabel = (paceMin) => {
  if (!isFinite(paceMin)) return "muy baja";
  if (paceMin < 5.15) return "alta";
  if (paceMin < 6.3) return "media";
  return "baja";
};

// Factor de carga por intensidad
const intensityFactor = (paceMin) => {
  if (!isFinite(paceMin)) return 0.8;
  if (paceMin < 5) return 2.0;
  if (paceMin < 5.75) return 1.6;
  if (paceMin < 6.5) return 1.3;
  return 1.0;
};

// ----- Análisis principal -----
export function analyzeRuns(allRuns) {
  const runs = [...(allRuns || [])]
    .filter((r) => r?.durationMs > 0 && r?.distanceM >= 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const last5 = runs.slice(0, 5);
  const last7dCut = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last28dCut = Date.now() - 28 * 24 * 60 * 60 * 1000;

  // Métricas base últimas 5
  const paces = last5.map(toMinPerKm);
const kms = last5.map((r) => r.distanceM / 1000);
const loads = last5.map((r, i) => kms[i] * intensityFactor(paces[i]));
const totalKm5 = kms.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);

const finitePaces = paces.filter((p) => Number.isFinite(p));
const avgPace5 = finitePaces.length
  ? finitePaces.reduce((a, b) => a + b, 0) / finitePaces.length
  : Infinity;
const bestPace = finitePaces.length ? Math.min(...finitePaces) : Infinity;
const avgIntensityLabel = intensityLabel(avgPace5);


  // Gaps (separación en días entre sesiones)
const gaps = [];
for (let i = 0; i < last5.length - 1; i++) {
  gaps.push(daysBetween(last5[i].date, last5[i + 1].date));
}
const avgGap = gaps.length >= 1 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : NaN;


  // Nivel actual por ritmo promedio de 5
const level = finitePaces.length ? levelFromPace(avgPace5) : "Principiante";


  // Carga aguda/crónica (ACWR) aproximada
  const acute = runs
    .filter((r) => new Date(r.date).getTime() >= last7dCut)
    .map((r) => (r.distanceM / 1000) * intensityFactor(toMinPerKm(r)))
    .reduce((a, b) => a + b, 0);

  const chronic = runs
    .filter((r) => new Date(r.date).getTime() >= last28dCut)
    .map((r) => (r.distanceM / 1000) * intensityFactor(toMinPerKm(r)))
    .reduce((a, b) => a + b, 0) / 4; // promedio semanal de 28d

  const acwr = chronic > 0 ? acute / chronic : 1; // si no hay crónica, asumimos 1

  // Riesgo de sobreentrenamiento (heurística)
  const highIntensityShare =
    last5.filter((_, i) => intensityFactor(paces[i]) >= 1.6).length / (last5.length || 1);
  const isTightSpacing = isFinite(avgGap) ? avgGap < 1.5 : false;
  const isHighACWR = acwr > 1.5; // >1.5 = subida brusca de carga
  const overtrainingRisk = isTightSpacing && (isHighACWR || highIntensityShare >= 0.5);

  // Recomendaciones
  const recs = [];
  if (overtrainingRisk) {
    recs.push("Riesgo de sobreentrenamiento alto: subiste la carga rápido y corriste sesiones intensas muy seguidas. Considera 1–2 días de descanso activo.");
  } else if (isHighACWR) {
    recs.push("La carga de esta semana superó tu promedio mensual. Sube volumen de forma gradual (≤10% semanal).");
  }
  if (isFinite(avgGap) && avgGap > 3) {
    recs.push("Los días entre sesiones son largos; podrías perder consistencia. Intenta 3–4 sesiones/semana.");
  }
  if (avgIntensityLabel === "baja" && totalKm5 > 0) {
    recs.push("Casi todo fue suave. Añade 1 sesión de calidad (intervalos/tempo) para mejorar el ritmo.");
  }

  return {
    last5,
    summary: {
      totalKm5,
      avgPace5,
      bestPace,
      avgGap,
      level,
      avgIntensityLabel,
      acuteLoad: acute,
      chronicLoad: chronic,
      acwr,
      overtrainingRisk,
      highIntensityShare,
    },
    recommendations: recs,
  };
}
