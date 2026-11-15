/* =========================================================================
   KALORIENVERBRAUCH-RECHNER fuer fitnessdoneright.de/kalorienverbrauch-rechner.
   -------------------------------------------------------------------------
   Zwei Wege, beide aus der App:
   - SPORTART: die MET-Liste des Kalorienrechners (NutritionTool.AKTIVITAETEN,
     Werte aus dem Compendium of Physical Activities). kcal = MET x kg x h.
   - PULSUHR: CalorieEstimator.estimateHrCalories — dieselbe Rechnung, mit der
     die App eine Einheit mit Pulsgurt bewertet (Keytel 2005).

   BEWUSST NICHT: ein Workout als freien Text. Der Schaetzer der App versteht
   die Workouts, die sie selbst erzeugt; freien Text von der Webseite ("5
   Runden, 400 m Laufen, 15 Kettlebell Swings") hat er am 30.09.2026 mit
   9 kcal bewertet. Das gehoert in die App, nicht auf eine offene Seite.

   Der Rahmen auf der Wix-Seite hat eine FESTE Hoehe — vor dem Berechnen
   steht dieselbe Ergebniskarte mit Strichen.
   ========================================================================= */
(function () {
  "use strict";

  const GRUPPEN = window.NutritionTool.AKTIVITAETEN;
  const ALLE = GRUPPEN.reduce((l, g) => l.concat(g.eintraege), []);
  const CE = window.CalorieEstimator;
  const SPEICHER = "tl_kalorienverbrauch_eingaben";
  // Eine Kilokalorie je Kilogramm und Stunde: der Ruheumsatz, also 1 MET.
  const RUHE_KCAL_JE_KG_H = 1;
  // Die uebliche Faustzahl fuer ein Kilogramm Koerperfett.
  const KCAL_JE_KG_FETT = window.NutritionCalc.KCAL_JE_KG_FETT;

  let z = (function () {
    let alt = {};
    try { alt = JSON.parse(localStorage.getItem(SPEICHER) || "{}") || {}; } catch (err) { alt = {}; }
    return Object.assign({ geschlecht: "mann", gewicht: "", alter: "", weg: "sport", art: "", minuten: "", proWoche: "1", puls: "" }, alt);
  })();
  const merken = () => { try { localStorage.setItem(SPEICHER, JSON.stringify(z)); } catch (err) { /* egal */ } };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const zahl = (v) => { const n = Number(String(v).replace(",", ".")); return isFinite(n) ? n : 0; };
  const tausender = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  function wahl(feld, optionen) {
    return `<div class="nut-choice">` + optionen.map((o) =>
      `<button type="button" data-feld="${feld}" data-wert="${o.wert}" aria-pressed="${z[feld] === o.wert}">${esc(o.text)}</button>`
    ).join("") + `</div>`;
  }
  function feld(name, text) {
    return `<div class="profile-field"><label for="kv-${name}">${esc(text)}</label>` +
      `<input id="kv-${name}" type="text" inputmode="decimal" autocomplete="off" data-feld="${name}" value="${esc(z[name])}"></div>`;
  }

  function trainingFelder() {
    const dauer = `<div class="nut-row" style="margin-top:10px">${feld("minuten", "Minuten")}${feld("proWoche", "mal pro Woche")}</div>`;
    if (z.weg === "puls") {
      return `<div class="nut-row">${feld("puls", "Durchschnittspuls")}</div>` + dauer +
        `<div class="nut-hinweis">Den Durchschnittspuls der Einheit zeigt dir deine Uhr oder dein Brustgurt. Die Formel gilt für Training ab etwa 90 Schlägen pro Minute.</div>`;
    }
    const optionen = `<option value="">— Sportart wählen —</option>` + GRUPPEN.map((g) =>
      `<optgroup label="${esc(g.gruppe)}">` + g.eintraege.map((e) =>
        `<option value="${esc(e.art)}"${e.art === z.art ? " selected" : ""}>${esc(e.name)}</option>`).join("") + `</optgroup>`
    ).join("");
    return `<div class="profile-field"><label for="kv-art">Sportart</label><select id="kv-art" data-feld="art">${optionen}</select></div>` + dauer;
  }

  function formular() {
    return `
      <div class="nut-card">
        <div class="nut-card-title">Deine Daten</div>
        ${wahl("geschlecht", [{ wert: "frau", text: "Frau" }, { wert: "mann", text: "Mann" }])}
        <div class="nut-row" style="margin-top:10px">${feld("gewicht", "Gewicht (kg)")}${feld("alter", "Alter")}</div>
      </div>
      <div class="nut-card">
        <div class="nut-card-title">Dein Training</div>
        ${wahl("weg", [{ wert: "sport", text: "Nach Sportart" }, { wert: "puls", text: "Mit Pulsuhr" }])}
        <div style="margin-top:10px">${trainingFelder()}</div>
      </div>
      <button id="kvRechnen" class="primary-btn voll" type="button">Berechnen</button>
      <div id="kvErgebnis">${ergebnis(null)}</div>`;
  }

  function rechnen() {
    const kg = zahl(z.gewicht), min = zahl(z.minuten), mal = zahl(z.proWoche) || 1;
    if (!(kg > 0) || !(min > 0)) return { fehlt: "Wir brauchen dein Gewicht und die Dauer in Minuten." };
    let kcal, quelle;
    if (z.weg === "puls") {
      const puls = zahl(z.puls), alter = zahl(z.alter);
      if (!(puls > 0) || !(alter > 0)) return { fehlt: "Für den Weg über den Puls brauchen wir Durchschnittspuls und Alter." };
      if (puls < 90) return { fehlt: "Unter etwa 90 Schlägen pro Minute rechnet die Pulsformel nicht verlässlich — nimm dafür den Weg „Nach Sportart“." };
      // Der Schaetzer liest das Profil wie in der App aus dem Speicher.
      // Auf trainlogic.github.io gibt es keine App-Daten, die das stoeren koennte.
      try { localStorage.setItem("profile", JSON.stringify({ weightKg: kg, gender: z.geschlecht === "frau" ? "female" : "male", age: alter })); } catch (err) { /* ohne Speicher: Standardprofil */ }
      const r = CE.estimateHrCalories(puls, min);
      if (!r) return { fehlt: "Mit diesen Werten liefert die Pulsformel kein Ergebnis." };
      kcal = r.calories;
      quelle = `aus deinem Puls (${puls} Schläge pro Minute)`;
    } else {
      const a = ALLE.find((e) => e.art === z.art);
      if (!a) return { fehlt: "Wähl eine Sportart aus der Liste." };
      // Rudern mit Wattangabe rechnet aus der Leistung (wie in der App,
      // Pruefrunde 3 Befund 5), alles andere MET x kg x Stunden.
      if (a.watt) {
        kcal = window.NutritionCalc.kcalAusLeistung(a.formel, a.watt, kg, min);
        quelle = `${a.name}, aus der Leistung`;
      } else {
        kcal = a.met * kg * min / 60;
        quelle = `${a.name}, ${String(a.met).replace(".", ",")} MET`;
      }
    }
    const ruhe = RUHE_KCAL_JE_KG_H * kg * min / 60;
    const extra = Math.max(0, kcal - ruhe);
    return { kcal, ruhe, extra, woche: kcal * mal, fettG: extra * mal / KCAL_JE_KG_FETT * 1000, mal, quelle };
  }

  function ergebnis(r) {
    if (r && r.fehlt) {
      return `<div class="nut-card"><div class="nut-card-title">Es fehlt etwas</div><div class="nut-gefunden">${esc(r.fehlt)}</div></div>`;
    }
    const leer = !r;
    const w = (v) => (leer ? "—" : tausender(v));
    return `
      <div class="nut-card${leer ? " leer" : ""}">
        <div class="nut-ziel">
          <div class="nut-ziel-wert wert">${w(r && r.kcal)} kcal</div>
          <div class="nut-ziel-label">${leer ? "Verbrauch pro Einheit" : "pro Einheit — " + esc(r.quelle)}</div>
        </div>
        <div class="nut-hinweis" style="text-align:center">${leer ? "Trag oben dein Training ein und tipp auf „Berechnen“."
          : `Davon wären rund <b>${w(r.ruhe)} kcal</b> auch auf dem Sofa angefallen — durch den Sport kommen <b>${w(r.extra)} kcal</b> dazu.`}</div>
        <div class="nut-makros" style="margin-top:12px;grid-template-columns:1fr 1fr">
          <div class="nut-makro"><div class="nut-makro-wert wert">${w(r && r.woche)}</div><div class="nut-makro-name">kcal pro Woche${leer ? "" : ` (${String(r.mal).replace(".", ",")} ×)`}</div></div>
          <div class="nut-makro"><div class="nut-makro-wert wert">${w(r && r.fettG)} g</div><div class="nut-makro-name">Fett pro Woche, rechnerisch</div></div>
        </div>
        <div class="nut-hinweis">Rechnerisch heißt: wenn du die Kalorien nicht wieder isst. Jede Schätzung liegt bei einzelnen Menschen um 20 Prozent oder mehr daneben.</div>
        <a class="weiter" href="https://www.fitnessdoneright.de/kalorienrechner" target="_top">Deinen ganzen Tagesbedarf berechnen →</a>
      </div>`;
  }

  const k = document.getElementById("rechner");
  const zeichnen = () => { k.innerHTML = formular(); };
  k.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-feld]");
    if (b) { z[b.dataset.feld] = b.dataset.wert; merken(); zeichnen(); return; }
    if (ev.target.id === "kvRechnen") {
      const ziel = document.getElementById("kvErgebnis");
      ziel.innerHTML = ergebnis(rechnen());
      ziel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
  const aendern = (ev) => {
    const el = ev.target;
    if (!el.dataset || !el.dataset.feld) return;
    z[el.dataset.feld] = el.value; merken();
  };
  k.addEventListener("input", aendern);
  k.addEventListener("change", aendern);
  zeichnen();
})();
