// BACKUP 20.07.2026 — src/calcul.js FINAL (configurator acoperis v1)
// Cantitatile VIN DIN GEOMETRIE: mp panta-corectati, ml coama, ml streasina.
import { CONFIG_ACOPERIS as C } from "../config/CONFIG";

const rad = g => (g * Math.PI) / 180;

export function cantitati({ lungime: L, latime: W, panta, tip }) {
  const cos = Math.cos(rad(panta));
  const mpAmprenta = L * W;
  const factor = C.tipuriAcoperis[tip]?.factorMp ?? 1;
  const mp = (mpAmprenta / cos) * factor;
  let coama, streasina;
  if (tip === "patru_ape") { coama = Math.max(L - W, 0); streasina = 2 * (L + W); }
  else { coama = L; streasina = 2 * L; }
  return { mp, coama, streasina, mpAmprenta };
}

export function calculeaza(cfg) {
  const q = cantitati(cfg);
  const { material, lucrare, demontare, jgheaburi, jgheaburiMl } = cfg;

  if (q.mp < C.limite.minMp || q.mp > C.limite.maxMp)
    return { status: "REQUIRES_CONFIRMATION", q,
      message: `Suprafața de ~${Math.round(q.mp)} mp iese din intervalul standard — necesită verificare cu un tehnician.` };

  const pMat = C.materialeMp[material]?.pret ?? Object.values(C.materialeMp)[0].pret;
  const pMan = C.manoperaMp[lucrare] ?? Object.values(C.manoperaMp)[0];
  const mlJ = jgheaburi ? (jgheaburiMl ?? q.streasina) : 0;

  const linii = [
    { desc: `Învelitoare ${material}`, cant: q.mp * C.pierderiTaieturi, um: "mp", total: q.mp * C.pierderiTaieturi * pMat, nota: "+10% pierderi tăieturi" },
    { desc: `Manoperă — ${lucrare}`, cant: q.mp, um: "mp", total: q.mp * pMan },
    ...(demontare ? [{ desc: "Demontare acoperiș vechi", cant: q.mp, um: "mp", total: q.mp * C.optionale.demontareVecheMp }] : []),
    ...(mlJ > 0 ? [{ desc: "Jgheaburi + burlane", cant: mlJ, um: "ml", total: mlJ * C.optionale.jgheaburiBurlaneMl }] : []),
    { desc: "Deplasare + transport materiale", cant: 1, um: "buc", total: C.taxeFixe.deplasareTransport },
  ];

  let total = linii.reduce((s, l) => s + l.total, 0);
  const subMinim = total < C.taxeFixe.comandaMinima;
  if (subMinim) total = C.taxeFixe.comandaMinima;
  const t = C.intervalToleranta;
  return {
    status: "SUCCESS", q, linii, subMinim,
    min: Math.round(total * (1 - t)), max: Math.round(total * (1 + t)),
  };
}
