// BACKUP 20.07.2026 — config/CONFIG.js FINAL (configurator acoperis v1)
// Portat din config_acoperisuri.json + culori RAL reale (audit vizual 20.07).
// ATENTIE: preturi PLACEHOLDER — calibrare obligatorie pe primul client real.
export const CONFIG_ACOPERIS = {
  companyName: "Acoperișuri & Montaj Pro",
  tvaStatus: "Prețurile afișate includ TVA (19%)",
  materialeMp: {
    "Tablă Bilka Standard (0.45mm)":        { pret: 45,  hex: "#4a332c", tex: "tabla" },
    "Tablă Bilka Premium (0.50mm GrandeMat)": { pret: 75, hex: "#3a4045", tex: "tabla" },
    "Țiglă Ceramică Premium":               { pret: 110, hex: "#9c5a42", tex: "tigla" },
  },
  manoperaMp: {
    "Montaj simplu":                 35,
    "Reparație dulgherie + montaj":  65,
  },
  optionale: {
    demontareVecheMp: 15,
    jgheaburiBurlaneMl: 25,
  },
  taxeFixe: { deplasareTransport: 300, comandaMinima: 2500 },
  pierderiTaieturi: 1.10,
  intervalToleranta: 0.10,
  limite: { minMp: 20, maxMp: 1500 },
  tipuriAcoperis: {
    doua_ape:  { nume: "2 ape",     factorMp: 1.00 },
    patru_ape: { nume: "4 ape",     factorMp: 1.00 },
    mansardat: { nume: "Mansardat", factorMp: 1.15 },
  },
  limiteDim: {
    lungime: { min: 5, max: 30, pas: 0.5 },
    latime:  { min: 4, max: 20, pas: 0.5 },
    panta:   { min: 15, max: 55, pas: 1 },
  },
  default: { lungime: 10, latime: 8, panta: 30, tip: "doua_ape" },
  ctaMessage: "Dorești o vizită la fața locului pentru măsurători exacte și verificarea dulgheriei?",
  disclaimer: "Estimare orientativă calculată pe modelul 3D. Nu constituie ofertă fermă — devizul final se emite după verificarea pe teren.",
};
