/* =========================================================================
   LAUF-RECHNER fuer fitnessdoneright.de/lauf-rechner.
   -------------------------------------------------------------------------
   Rechenkern ist js/plan-vdot.js der App (Daniels' VDOT): aus EINER
   gemessenen Zeit der Formwert und daraus die Trainingstempi — dieselben
   Spannen, die der Ausdauer-Plan der App vorgibt.

   ZIELZEITEN wie im Ausdauer-Plan der App: Riegel mit Exponent 1,06
   (PlanAusdauer.prognoseSekunden, Zweig Laufen). Dieselbe Zeile steht hier,
   weil plan-ausdauer.js vier weitere Plan-Module nach sich zieht. Dass beide
   dasselbe liefern, prueft tests/rechner-webseite.test.mjs — wer die App
   aendert, sieht es dort.

   Der Rahmen auf der Wix-Seite hat eine FESTE Hoehe — vor dem Berechnen
   steht dieselbe Ergebniskarte mit Strichen.
   ========================================================================= */
(function () {
  "use strict";

  const V = window.PlanVdot;
  const SPEICHER = "tl_lauf_eingaben";

  const STRECKEN = [
    { wert: "1500", text: "1500 m", m: 1500 },
    { wert: "3000", text: "3 km", m: 3000 },
    { wert: "5000", text: "5 km", m: 5000 },
    { wert: "10000", text: "10 km", m: 10000 },
    // Kurz, damit drei Knoepfe je Zeile auch bei 320 px nebeneinander passen.
    { wert: "21097.5", text: "21 km", m: 21097.5 },
    { wert: "42195", text: "42 km", m: 42195 }
  ];
  const PROGNOSE = [
    { text: "5 km", m: 5000 }, { text: "10 km", m: 10000 },
    { text: "Halbmarathon", m: 21097.5 }, { text: "Marathon", m: 42195 }
  ];
  const TEMPI = [
    { key: "easy", name: "Locker", wozu: "Grundlage, lange Läufe" },
    { key: "marathon", name: "Zügig", wozu: "Marathontempo" },
    { key: "threshold", name: "Schwelle", wozu: "Tempodauerlauf, 20–30 min" },
    { key: "interval", name: "Intervall", wozu: "3–5 min Stücke" },
    { key: "repetition", name: "Wiederholung", wozu: "200–400 m schnell" }
  ];

  let z = (function () {
    let alt = {};
    try { alt = JSON.parse(localStorage.getItem(SPEICHER) || "{}") || {}; } catch (err) { alt = {}; }
    const z0 = Object.assign({ strecke: "5000", std: "", min: "", sek: "" }, alt);
    // Bis 30.09.2026 stand die Zeit als ein Text "25:30" im Speicher.
    if (z0.zeit && !z0.min && !z0.std) {
      const t = String(z0.zeit).split(":").map((x) => x.trim());
      if (t.length === 3) { z0.std = t[0]; z0.min = t[1]; z0.sek = t[2]; }
      else if (t.length === 2) { z0.min = t[0]; z0.sek = t[1]; }
      else z0.min = t[0];
    }
    delete z0.zeit;
    return z0;
  })();
  const merken = () => { try { localStorage.setItem(SPEICHER, JSON.stringify(z)); } catch (err) { /* egal */ } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* DREI FELDER STATT "25:30": auf dem Handy holt inputmode die
     Zifferntastatur, und die hat keinen Doppelpunkt (Benjamin, 30.09.2026 —
     die Zeit liess sich am iPhone nicht eintippen). Minuten und Sekunden
     duerfen ueberlaufen ("90 min" ist erlaubt), Komma zaehlt wie Punkt. */
  const zahl = (v) => { const n = Number(String(v).trim().replace(",", ".")); return isFinite(n) && n >= 0 ? n : NaN; };
  function sekundenAus(std, min, sek) {
    const teile = [std, min, sek].map((v) => (String(v).trim() === "" ? 0 : zahl(v)));
    if (teile.some((n) => isNaN(n))) return 0;
    return teile[0] * 3600 + teile[1] * 60 + teile[2];
  }

  function zeitText(sek) {
    const s = Math.round(sek), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    const zwei = (n) => (n < 10 ? "0" : "") + n;
    return h > 0 ? `${h}:${zwei(m)}:${zwei(r)}` : `${m}:${zwei(r)}`;
  }

  const RIEGEL = 1.06;
  function prognose(testMeter, testSek, zielMeter) {
    if (testMeter === zielMeter) return testSek;
    return testSek * Math.pow(zielMeter / testMeter, RIEGEL);
  }

  function rechnen() {
    const s = STRECKEN.find((x) => x.wert === z.strecke);
    const sek = sekundenAus(z.std, z.min, z.sek);
    if (!s || !(sek > 0)) return { fehlt: "Trag deine Zeit ein, zum Beispiel 25 Minuten und 30 Sekunden — oder 1 Stunde und 52 Minuten für 21 km." };
    const wert = V.vdot(s.m, sek);
    if (!(wert > 0)) {
      return { fehlt: `Die Formeln gelten für Läufe zwischen ${V.T_MIN_MINUTEN} und ${V.T_MAX_MINUTEN} Minuten. Nimm eine Zeit aus diesem Bereich — ein 5-km-Lauf ist ideal.` };
    }
    return {
      vdot: wert,
      prognose: PROGNOSE.map((p) => ({ text: p.text, sek: prognose(s.m, sek, p.m), eigene: p.m === s.m })),
      tempi: TEMPI.map((t) => ({ name: t.name, wozu: t.wozu, text: V.paceText(V.zone(wert, t.key)) }))
    };
  }

  // numeric statt decimal: Zeitangaben brauchen kein Komma, und die reine
  // Zifferntastatur ist auf dem iPhone groesser.
  function zeitFeld(name, text, beispiel) {
    return `<div class="profile-field"><label for="lf-${name}">${text}</label>` +
      `<input id="lf-${name}" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="${beispiel}" data-feld="${name}" value="${esc(z[name])}"></div>`;
  }

  function formular() {
    const wahl = `<div class="nut-choice lauf-strecken">` + STRECKEN.map((s) =>
      `<button type="button" data-feld="strecke" data-wert="${s.wert}" aria-pressed="${z.strecke === s.wert}">${esc(s.text)}</button>`).join("") + `</div>`;
    return `
      <div class="nut-card">
        <div class="nut-card-title">Deine Bestzeit</div>
        <div class="nut-feld-titel" style="margin-bottom:6px">Strecke</div>
        ${wahl}
        <div class="nut-feld-titel" style="margin:12px 0 6px">Deine Zeit</div>
        <div class="lauf-zeit">
          ${zeitFeld("std", "Std.", "0")}${zeitFeld("min", "Min.", "25")}${zeitFeld("sek", "Sek.", "30")}
        </div>
        <div class="nut-hinweis">Am besten ein Lauf der letzten Wochen, bei dem du alles gegeben hast — ein Wettkampf oder ein Test auf flacher Strecke.</div>
      </div>
      <button id="lfRechnen" class="primary-btn voll" type="button">Berechnen</button>
      <div id="lfErgebnis">${ergebnis(null)}</div>`;
  }

  function ergebnis(r) {
    if (r && r.fehlt) {
      return `<div class="nut-card"><div class="nut-card-title">Das passt noch nicht</div><div class="nut-gefunden">${esc(r.fehlt)}</div></div>`;
    }
    const leer = !r;
    const prog = (leer ? PROGNOSE.map((p) => ({ text: p.text })) : r.prognose).map((p) =>
      `<div class="lauf-zeile"><span>${esc(p.text)}${p.eigene ? " <em>deine Strecke</em>" : ""}</span><b class="wert">${leer ? "—:——" : zeitText(p.sek)}</b></div>`).join("");
    const tempi = (leer ? TEMPI.map((t) => ({ name: t.name, wozu: t.wozu })) : r.tempi).map((t) =>
      `<div class="lauf-zeile"><span>${esc(t.name)}<small>${esc(t.wozu)}</small></span><b class="wert">${leer ? "—:——" : esc(t.text)}</b></div>`).join("");
    return `
      <div class="nut-card${leer ? " leer" : ""}">
        <div class="nut-ziel">
          <div class="nut-ziel-wert wert">${leer ? "—" : String(Math.round(r.vdot * 10) / 10).replace(".", ",")}</div>
          <div class="nut-ziel-label">Dein Formwert (VDOT nach Daniels)</div>
        </div>
        <div class="nut-card-title" style="margin-top:12px">Das kannst du laufen</div>
        ${prog}
        <div class="nut-card-title" style="margin-top:14px">So schnell trainierst du</div>
        ${tempi}
        <div class="nut-hinweis">Die Zeiten gelten, wenn du für die Strecke auch trainiert hast — für den Marathon braucht es lange Läufe, sonst ist die Prognose zu optimistisch.</div>
      </div>`;
  }

  const k = document.getElementById("rechner");
  const zeichnen = () => { k.innerHTML = formular(); };
  k.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-feld]");
    if (b) { z[b.dataset.feld] = b.dataset.wert; merken(); zeichnen(); return; }
    if (ev.target.id === "lfRechnen") {
      const ziel = document.getElementById("lfErgebnis");
      ziel.innerHTML = ergebnis(rechnen());
      ziel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
  k.addEventListener("input", (ev) => {
    const el = ev.target;
    if (!el.dataset || !el.dataset.feld) return;
    z[el.dataset.feld] = el.value; merken();
  });
  zeichnen();

  // Fuer den Test.
  window.LaufRechner = { prognose, sekundenAus, zeitText };
})();
