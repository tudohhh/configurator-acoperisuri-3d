// BACKUP 20.07.2026 — src/App.jsx FINAL (configurator acoperis v1)
// UI "showroom" (panouri plutitoare, Fraunces, interval min-max animat),
// cantitati live din geometrie, CTA = programare vizita masuratori.
import React, { useState, useMemo, useRef, useEffect } from "react";
import { CONFIG_ACOPERIS as C } from "../config/CONFIG";
import { calculeaza, cantitati } from "./calcul";
import Scena3D from "./Scena3D";

(function fonturi() {
  if (document.getElementById("font-fraunces")) return;
  const l = document.createElement("link"); l.id = "font-fraunces"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,800&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.textContent = `
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    .fz-panel{animation:fadeUp .45s cubic-bezier(.2,.8,.2,1) both}`;
  document.head.appendChild(s);
})();

const DISPLAY = "'Fraunces',Georgia,serif";
const ACC = "#4a6e8a";
const lei = n => Math.round(n).toLocaleString("ro-RO") + " lei";

function useNumAnimat(v) {
  const [a, setA] = useState(v); const ref = useRef(v);
  useEffect(() => {
    const s0 = ref.current, d = v - s0;
    if (Math.abs(d) < 1) { setA(v); ref.current = v; return; }
    const t0 = performance.now(), dur = 340; let raf;
    const pas = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); const x = s0 + d * e; setA(x); ref.current = x; if (p < 1) raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [v]);
  return a;
}

export default function App() {
  const d = C.default, LD = C.limiteDim;
  const [lungime, setLungime] = useState(d.lungime);
  const [latime, setLatime] = useState(d.latime);
  const [panta, setPanta] = useState(d.panta);
  const [tip, setTip] = useState(d.tip);
  const [material, setMaterial] = useState(Object.keys(C.materialeMp)[0]);
  const [lucrare, setLucrare] = useState(Object.keys(C.manoperaMp)[0]);
  const [demontare, setDemontare] = useState(false);
  const [jgheaburi, setJgheaburi] = useState(true);
  const [detalii, setDetalii] = useState(false);
  const [faza, setFaza] = useState("config");

  const cfg = { lungime, latime, panta, tip, material, lucrare, demontare, jgheaburi };
  const q = useMemo(() => cantitati(cfg), [lungime, latime, panta, tip]);
  const dv = useMemo(() => calculeaza(cfg), [lungime, latime, panta, tip, material, lucrare, demontare, jgheaburi]);
  const minA = useNumAnimat(dv.status === "SUCCESS" ? dv.min : 0);
  const maxA = useNumAnimat(dv.status === "SUCCESS" ? dv.max : 0);
  const rezumat = `Acoperiș ${C.tipuriAcoperis[tip].nume} — ${lungime}×${latime} m, pantă ${panta}° — ~${Math.round(q.mp)} mp — ${material} — ${lucrare}${demontare ? " — cu demontare" : ""}${jgheaburi ? ` — jgheaburi ${Math.round(q.streasina)} ml` : ""}`;

  if (faza === "formular") return <Formular rezumat={rezumat} dv={dv} inapoi={() => setFaza("config")} />;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", fontFamily: "system-ui,sans-serif", color: "#22282e", background: "#dfe9ee" }}>
      <div style={{ position: "absolute", inset: 0 }}><Scena3D cfg={cfg} /></div>

      <div className="fz-panel" style={{ position: "absolute", top: 16, left: 18 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, textShadow: "0 1px 0 rgba(255,255,255,.6)" }}>{C.companyName}</div>
        <div style={{ fontSize: 11.5, color: "#5c6a75" }}>Configurează-ți acoperișul, vezi estimarea pe loc.</div>
      </div>

      <div className="fz-panel" style={{ ...panou, left: 18, top: 70, bottom: 16, width: 272, overflowY: "auto", animationDelay: "80ms" }}>
        <Sec>Tip acoperiș</Sec>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {Object.entries(C.tipuriAcoperis).map(([k, t]) => (
            <button key={k} onClick={() => setTip(k)} style={{ padding: "9px 2px", borderRadius: 9, cursor: "pointer", fontSize: 11.5, fontWeight: 600, border: tip === k ? `2px solid ${ACC}` : "1px solid #d5dde2", background: tip === k ? "#eef4f8" : "#fff", color: "#22282e" }}>{t.nume}</button>))}
        </div>
        <Sec>Dimensiuni casă</Sec>
        <Sl label="Lungime" v={lungime} set={setLungime} min={LD.lungime.min} max={LD.lungime.max} step={LD.lungime.pas} unit="m" />
        <Sl label="Lățime" v={latime} set={setLatime} min={LD.latime.min} max={LD.latime.max} step={LD.latime.pas} unit="m" />
        <Sl label="Pantă" v={panta} set={setPanta} min={LD.panta.min} max={LD.panta.max} step={LD.panta.pas} unit="°" />
        <div style={{ fontSize: 11.5, color: "#5c6a75", background: "#eef4f8", borderRadius: 8, padding: "7px 9px", margin: "2px 0 4px" }}>
          Din model: <b>~{Math.round(q.mp)} mp</b> învelitoare · coamă <b>{Math.round(q.coama)} ml</b> · streașină <b>{Math.round(q.streasina)} ml</b>
        </div>
        <Sec>Învelitoare</Sec>
        {Object.entries(C.materialeMp).map(([n, m]) => (
          <button key={n} onClick={() => setMaterial(n)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "7px 8px", marginBottom: 6, borderRadius: 10, cursor: "pointer", border: material === n ? `2px solid ${ACC}` : "1px solid #d5dde2", background: material === n ? "#eef4f8" : "#fff" }}>
            <span style={{ width: 26, height: 18, borderRadius: 5, background: m.hex, border: "1px solid rgba(0,0,0,.15)" }} />
            <span style={{ flex: 1, textAlign: "left", fontSize: 12 }}>{n}</span>
            <span style={{ fontSize: 10.5, color: "#5c6a75" }}>{m.pret} lei/mp</span>
          </button>))}
        <Sec>Lucrare</Sec>
        {Object.entries(C.manoperaMp).map(([n, p]) => (
          <label key={n} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, marginBottom: 6, cursor: "pointer" }}>
            <input type="radio" checked={lucrare === n} onChange={() => setLucrare(n)} style={{ accentColor: ACC }} />
            <span style={{ flex: 1 }}>{n}</span><span style={{ fontSize: 10.5, color: "#5c6a75" }}>{p} lei/mp</span>
          </label>))}
        <Sec>Opționale</Sec>
        <Check label="Demontare acoperiș vechi" v={demontare} set={setDemontare} />
        <Check label={`Jgheaburi + burlane (~${Math.round(q.streasina)} ml)`} v={jgheaburi} set={setJgheaburi} />
      </div>

      <div className="fz-panel" style={{ ...panou, right: 18, top: 70, width: 290, animationDelay: "140ms" }}>
        <div style={{ fontSize: 11, color: "#5c6a75", letterSpacing: 1, textTransform: "uppercase" }}>Estimare</div>
        {dv.status === "SUCCESS" ? (<>
          <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 800, color: ACC, letterSpacing: -0.5, margin: "4px 0 0", fontVariantNumeric: "tabular-nums" }}>
            {lei(minA)} – {lei(maxA)}
          </div>
          <div style={{ fontSize: 11, color: "#8a949c", margin: "2px 0 2px" }}>{C.tvaStatus}{dv.subMinim ? " · sub comanda minimă — se aplică valoarea minimă" : ""}</div>
          <div style={{ fontSize: 11, color: "#8a949c", marginBottom: 10 }}>{C.disclaimer}</div>
          <button onClick={() => setDetalii(!detalii)} style={pillMic}>{detalii ? "Ascunde detaliile" : "Vezi detaliile estimării"}</button>
          {detalii && (
            <table style={{ width: "100%", fontSize: 11.5, borderCollapse: "collapse", margin: "8px 0 4px" }}>
              <tbody>{dv.linii.map((l, i) => (
                <tr key={i} style={{ borderTop: "1px solid #edf1f4" }}>
                  <td style={{ padding: "4px 0" }}>{l.desc}{l.nota ? <span style={{ color: "#8a949c" }}> ({l.nota})</span> : null}</td>
                  <td style={{ textAlign: "right", color: "#5c6a75", whiteSpace: "nowrap", paddingLeft: 6 }}>{l.cant.toFixed(l.um === "buc" ? 0 : 1)} {l.um}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", paddingLeft: 6 }}>{lei(l.total)}</td>
                </tr>))}</tbody>
            </table>)}
          <button onClick={() => setFaza("formular")} style={{ width: "100%", marginTop: 10, padding: "13px 0", borderRadius: 12, border: "none", background: ACC, color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 18px rgba(74,110,138,.35)" }}>
            Programează vizită de măsurători
          </button>
        </>) : (
          <div style={{ fontSize: 13, color: "#8a4b3a", margin: "8px 0" }}>{dv.message}
            <button onClick={() => setFaza("formular")} style={{ ...pillMic, marginTop: 10 }}>Cere verificare cu un tehnician</button>
          </div>)}
      </div>

      <div style={{ position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)", fontSize: 11.5, color: "#5c6a75", background: "rgba(255,255,255,.7)", backdropFilter: "blur(6px)", padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap", maxWidth: "70vw", overflow: "hidden", textOverflow: "ellipsis" }}>
        {lungime}×{latime} m · pantă {panta}° · {C.tipuriAcoperis[tip].nume} · ~{Math.round(q.mp)} mp
      </div>
    </div>
  );
}

function Formular({ rezumat, dv, inapoi }) {
  const [f, setF] = useState({ nume: "", telefon: "", localitate: "", obs: "", gdpr: false, website: "" });
  const [trimis, setTrimis] = useState(null); const [err, setErr] = useState("");
  const set = k => e => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const inp = { display: "block", width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: 8, border: "1px solid #d5dde2", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" };
  const card = { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.06)" };
  const trimite = () => {
    if (f.website) return;
    if (!f.nume || !f.telefon || !f.localitate) return setErr("Completați câmpurile obligatorii (*).");
    if (!f.gdpr) return setErr("Bifați acordul de prelucrare a datelor.");
    setErr("");
    const cerere = { ...f, id: "VIZITA-" + Date.now().toString(36).toUpperCase(), rezumat, interval: dv.status === "SUCCESS" ? `${dv.min}–${dv.max} lei` : "necesită verificare" };
    console.log("CERERE:", cerere); // TODO backend: Telegram/EmailJS (acelasi pattern ca la mobila)
    setTrimis(cerere);
  };
  return (
    <div style={{ minHeight: "100vh", background: "#eef3f6", fontFamily: "system-ui,sans-serif", color: "#22282e", padding: 24 }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {trimis ? (
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>✓</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0" }}>Cerere trimisă</h1>
            <p style={{ color: "#5c6a75" }}>Te contactăm pentru programarea vizitei de măsurători.</p>
            <div style={{ textAlign: "left", fontSize: 13, borderTop: "1px solid #eee", marginTop: 12, paddingTop: 12 }}>
              <div><b>ID:</b> {trimis.id}</div><div><b>Configurație:</b> {trimis.rezumat}</div><div><b>Interval estimat:</b> {trimis.interval}</div>
              <div><b>Client:</b> {trimis.nume} · {trimis.telefon} · {trimis.localitate}</div>
            </div>
            <button onClick={inapoi} style={{ marginTop: 14, padding: "9px 16px", borderRadius: 9, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>← înapoi la configurator</button>
          </div>
        ) : (<>
          <button onClick={inapoi} style={{ fontSize: 13, color: "#4a6e8a", background: "none", border: "none", cursor: "pointer", fontWeight: 600, marginBottom: 8 }}>← înapoi la configurator</button>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "2px 0 4px" }}>Programează vizita de măsurători</h1>
          <p style={{ fontSize: 13, color: "#5c6a75", marginBottom: 16 }}>Măsurători exacte + verificarea dulgheriei, apoi oferta fermă.</p>
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#5c6a75", marginBottom: 6 }}>Configurația ta</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{rezumat}</div>
            {dv.status === "SUCCESS" && <div style={{ fontSize: 18, fontWeight: 800, color: "#4a6e8a", marginTop: 6 }}>{dv.min.toLocaleString("ro-RO")} – {dv.max.toLocaleString("ro-RO")} lei</div>}
          </div>
          <div style={{ ...card, display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ fontSize: 13 }}>Nume*<input value={f.nume} onChange={set("nume")} style={inp} /></label>
              <label style={{ fontSize: 13 }}>Telefon*<input value={f.telefon} onChange={set("telefon")} style={inp} /></label>
            </div>
            <label style={{ fontSize: 13 }}>Localitate*<input value={f.localitate} onChange={set("localitate")} style={inp} /></label>
            <label style={{ fontSize: 13 }}>Observații<textarea value={f.obs} onChange={set("obs")} rows={2} style={{ ...inp, resize: "vertical" }} /></label>
            <label style={{ display: "flex", gap: 8, fontSize: 12.5, color: "#4a5560", alignItems: "flex-start" }}>
              <input type="checkbox" checked={f.gdpr} onChange={set("gdpr")} style={{ marginTop: 3 }} />
              <span>Sunt de acord cu prelucrarea datelor pentru programarea vizitei.</span>
            </label>
            <input value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px" }} aria-hidden="true" />
            {err && <div style={{ color: "#b91c1c", fontSize: 13 }}>{err}</div>}
            <button onClick={trimite} style={{ padding: 13, borderRadius: 10, border: "none", background: "#4a6e8a", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Trimite cererea</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

const panou = { position: "absolute", background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)", borderRadius: 18, padding: "14px 16px", boxShadow: "0 8px 32px rgba(20,35,45,.14)" };
const pillMic = { width: "100%", background: "#eef4f8", border: "1px solid #d3e2ec", borderRadius: 9, padding: "8px 0", fontSize: 12, fontWeight: 600, color: "#4a6e8a", cursor: "pointer" };
const Sec = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#4a6e8a", margin: "13px 0 7px" }}>{children}</div>;
const btn = { width: 28, height: 28, borderRadius: 7, border: "none", background: "#e4ebf0", color: "#22282e", fontSize: 15, cursor: "pointer" };
function Sl({ label, v, set, min, max, step, unit }) {
  return (<div style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span><span style={{ fontSize: 12.5, color: "#5c6a75" }}>{v} {unit}</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button onClick={() => set(Math.max(min, +(v - step).toFixed(1)))} style={btn}>-</button>
      <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} style={{ flex: 1, accentColor: "#4a6e8a" }} />
      <button onClick={() => set(Math.min(max, +(v + step).toFixed(1)))} style={btn}>+</button>
    </div>
  </div>);
}
function Check({ label, v, set }) {
  return (<label style={{ display: "flex", gap: 8, fontSize: 12.5, marginBottom: 7, cursor: "pointer", alignItems: "center" }}>
    <input type="checkbox" checked={v} onChange={e => set(e.target.checked)} style={{ accentColor: "#4a6e8a" }} />{label}
  </label>);
}
