/* =========================================================================
   GRIFFKRAFT-RECHNER fuer den Blogartikel "Was die Griffkraft mit Altern zu
   tun hat" (fitnessdoneright.de, eingebettet im Artikel).
   -------------------------------------------------------------------------
   Grundlage sind die Zielwerte von Peter Attia (The Peter Attia Drive #329,
   16.12.2024): sehr kraeftige 40-Jaehrige haengen 2:00 (Maenner) bzw. 1:30
   (Frauen); Farmers Carry 1 Minute mit 100 % (Maenner) bzw. 75 %
   (Frauen) des Koerpergewichts. Pro Jahrzehnt ab 40 zieht er etwa 10 s bzw.
   10 % ab. Normwerte aus Studien gibt es fuer beide Tests NICHT.

   Entscheidungen (Benjamin, 06.11.2026):
   - Zielwert je Alter in Jahrzehnt-Stufen, genau wie die Tabelle im Artikel
     (bis 49 / 50-59 / 60-69 / ab 70). Wer die Tabelle liest, soll dieselbe
     Zahl sehen wie im Rechner.
   - Level 1-10: Anteil am Zielwert der eigenen Altersgruppe, abgerundet.
     Level 10 = Tabellenwert erreicht. Beim Carry zaehlt die Minute: kuerzer
     getragen verringert den Wert anteilig (grobe Annahme, im Hinweis genannt).
   - Statt eines Griff-Alters als Zahl: die juengste Altersgruppe der
     Tabelle, deren Zielwert man erreicht. Attias Werte gelten fuer SEHR
     kraeftige Menschen und sinken nur 10 s je Jahrzehnt; umgerechnet bekam
     ein 45-Jaehriger mit 60 s (Level 5) "Griff-Alter ueber 80", ebenso jeder
     unter 90 s. Benjamin (06.11.2026): Vergleich ohne Zahl.
   - Das Koerpergewicht wird beim Dead Hang NICHT herausgerechnet (Attia tut
     es nicht, eine belastbare Formel gibt es nicht); der Hinweis sagt es.

   Der Rahmen im Artikel hat eine FESTE Hoehe - vor dem Berechnen steht
   dieselbe Ergebniskarte mit Strichen.
   ========================================================================= */
(function () {
  "use strict";

  const SPEICHER = "tl_griff_eingaben";

  // Werte mit 40 Jahren; Abzug je volles Jahrzehnt darueber, hoechstens drei.
  const BASIS = {
    hang: { m: 120, w: 90 },     // Sekunden
    carry: { m: 100, w: 75 }     // Prozent des Koerpergewichts, 1 Minute
  };
  const ABZUG = { hang: 10, carry: 10 };
  const CARRY_SEK = 60;

  // Humanizer-geprueft 06.11.2026; Benjamin wollte ausdruecklich, dass der
  // Rechner sich als Schaetzung zu erkennen gibt.
  const HINWEIS = "Das Ergebnis ist eine Schätzung und ersetzt keine Diagnose. Die Zielwerte stammen von Peter Attia und aus der Praxis, nicht aus Studien. Level 10 heißt, dass du den Tabellenwert deiner Altersgruppe erreichst. Beim Dead Hang zählt dein Körpergewicht mit: Wer schwerer ist, hängt meist kürzer. Beim Farmers Carry rechnet der Rechner kürzere Zeiten grob anteilig herunter. Ein starker Griff zeigt vor allem, dass jemand aktiv ist und kräftig bleibt, und solche Menschen leben im Schnitt länger. Eine Garantie ist das nicht, Umstände können sich ändern.";

  function stufe(alter) {
    return Math.min(3, Math.max(0, Math.floor((alter - 40) / 10)));
  }

  function zielwert(test, geschlecht, alter) {
    return BASIS[test][geschlecht] - ABZUG[test] * stufe(alter);
  }

  // Leistung in der Einheit des Zielwerts: Sekunden bzw. Prozent fuer 1 Minute.
  function leistung(test, e) {
    if (test === "hang") return e.sek;
    const prozent = (e.last / e.kg) * 100;
    return prozent * Math.min(e.sek, CARRY_SEK) / CARRY_SEK;
  }

  function level(test, geschlecht, alter, wert) {
    const anteil = wert / zielwert(test, geschlecht, alter);
    return Math.min(10, Math.max(1, Math.floor(anteil * 10 + 1e-9)));
  }

  // Juengste Altersgruppe der Tabelle, deren Zielwert erreicht ist.
  const GRUPPEN = ["bis 49", "50 bis 59", "60 bis 69", "ab 70"];
  function gruppe(test, geschlecht, wert) {
    for (let i = 0; i < GRUPPEN.length; i++) {
      if (wert + 1e-9 >= BASIS[test][geschlecht] - ABZUG[test] * i) return GRUPPEN[i];
    }
    return "noch keine";
  }

  let z = (function () {
    let alt = {};
    try { alt = JSON.parse(localStorage.getItem(SPEICHER) || "{}") || {}; } catch (err) { alt = {}; }
    return Object.assign({ test: "hang", geschlecht: "m", alter: "", min: "", sek: "", kg: "", last: "" }, alt);
  })();
  const merken = () => { try { localStorage.setItem(SPEICHER, JSON.stringify(z)); } catch (err) { /* egal */ } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const zahl = (v) => { const n = Number(String(v).trim().replace(",", ".")); return isFinite(n) && n >= 0 ? n : NaN; };
  const leerOderZahl = (v) => (String(v).trim() === "" ? 0 : zahl(v));

  function zeitText(sek) {
    const s = Math.round(sek), m = Math.floor(s / 60), r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r + " min";
  }
  const prozentText = (p) => Math.round(p) + " %";

  function rechnen() {
    const alter = zahl(z.alter);
    if (!(alter >= 14 && alter <= 99)) return { fehlt: "Trag dein Alter ein, zwischen 14 und 99." };
    const sek = leerOderZahl(z.min) * 60 + leerOderZahl(z.sek);
    if (!(sek > 0)) {
      return { fehlt: z.test === "hang"
        ? "Trag ein, wie lange du hängen konntest, zum Beispiel 1 Minute und 15 Sekunden."
        : "Trag ein, wie lange du getragen hast, zum Beispiel 1 Minute." };
    }
    const e = { sek };
    if (z.test === "carry") {
      e.kg = zahl(z.kg); e.last = zahl(z.last);
      if (!(e.kg >= 30 && e.kg <= 250)) return { fehlt: "Trag dein Körpergewicht in Kilogramm ein." };
      if (!(e.last > 0)) return { fehlt: "Trag ein, wie viel du getragen hast: beide Hände zusammen, in Kilogramm." };
    }
    const wert = leistung(z.test, e);
    const ziel = zielwert(z.test, z.geschlecht, alter);
    return {
      level: level(z.test, z.geschlecht, alter, wert),
      gruppe: gruppe(z.test, z.geschlecht, wert),
      zielText: z.test === "hang" ? zeitText(ziel) : prozentText(ziel) + " für 1 Minute",
      wertText: z.test === "hang" ? zeitText(wert) : prozentText(wert)
    };
  }

  function feld(name, text, beispiel, modus) {
    return `<div class="profile-field"><label for="gr-${name}">${text}</label>` +
      `<input id="gr-${name}" type="text" inputmode="${modus}"${modus === "numeric" ? ' pattern="[0-9]*"' : ""} autocomplete="off" placeholder="${beispiel}" data-feld="${name}" value="${esc(z[name])}"></div>`;
  }
  function wahl(feldName, optionen) {
    return `<div class="nut-choice gr-wahl">` + optionen.map(([wert, text]) =>
      `<button type="button" data-feld="${feldName}" data-wert="${wert}" aria-pressed="${z[feldName] === wert}">${esc(text)}</button>`).join("") + `</div>`;
  }

  function formular() {
    const hang = z.test === "hang";
    // Beide Tests haben gleich viele Zeilen, damit der Rahmen beim Umschalten
    // nicht springt: beim Dead Hang steht statt der Gewichte die Ausfuehrung.
    const zeile2 = hang
      ? `<div class="nut-hinweis gr-ausfuehrung">Arme gestreckt, beide Hände im Obergriff, ohne Magnesia. Die Zeit läuft, bis du loslässt.</div>`
      : `<div class="gr-zwei">${feld("kg", "Dein Gewicht (kg)", "80", "decimal")}${feld("last", "Getragen, beide Hände (kg)", "64", "decimal")}</div>`;
    return `
      <div class="nut-card">
        <div class="nut-card-title">Dein Test</div>
        ${wahl("test", [["hang", "Dead Hang"], ["carry", "Farmers Carry"]])}
        <div class="gr-zwei" style="margin-top:12px">
          <div class="profile-field"><span class="nut-feld-titel">Geschlecht</span>${wahl("geschlecht", [["m", "Mann"], ["w", "Frau"]])}</div>
          ${feld("alter", "Alter", "45", "numeric")}
        </div>
        <div style="margin-top:12px">${zeile2}</div>
        <div class="nut-feld-titel" style="margin:12px 0 6px">${hang ? "So lange hast du gehangen" : "So lange hast du getragen"}</div>
        <div class="gr-zwei">${feld("min", "Min.", "1", "numeric")}${feld("sek", "Sek.", "15", "numeric")}</div>
      </div>
      <button id="grRechnen" class="primary-btn voll" type="button">Berechnen</button>
      <div id="grErgebnis">${ergebnis(null)}</div>`;
  }

  function balken(n) {
    let s = "";
    for (let i = 1; i <= 10; i++) s += `<i class="${n && i <= n ? "an" : ""}"></i>`;
    return `<div class="gr-balken" aria-hidden="true">${s}</div>`;
  }

  function ergebnis(r) {
    if (r && r.fehlt) {
      return `<div class="nut-card gr-ergebnis"><div class="nut-card-title">Das passt noch nicht</div><div class="nut-gefunden">${esc(r.fehlt)}</div></div>`;
    }
    const leer = !r;
    return `
      <div class="nut-card gr-ergebnis${leer ? " leer" : ""}">
        <div class="nut-ziel">
          <div class="nut-ziel-wert wert">${leer ? "–" : r.level}<span class="gr-von"> / 10</span></div>
          <div class="nut-ziel-label">Dein Level, gemessen an deiner Altersgruppe</div>
        </div>
        ${balken(leer ? 0 : r.level)}
        <div class="gr-zeile"><span>Dein Wert</span><b class="wert">${leer ? "–" : esc(r.wertText)}</b></div>
        <div class="gr-zeile"><span>Zielwert für dein Alter</span><b class="wert">${leer ? "–" : esc(r.zielText)}</b></div>
        <div class="gr-zeile"><span>Zielwert erreicht für Alter</span><b class="wert">${leer ? "–" : esc(r.gruppe)}</b></div>
        <div class="nut-hinweis">${HINWEIS}</div>
      </div>`;
  }

  const k = document.getElementById("rechner");
  const zeichnen = () => { k.innerHTML = formular(); };
  k.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-feld]");
    if (b) { z[b.dataset.feld] = b.dataset.wert; merken(); zeichnen(); return; }
    if (ev.target.id === "grRechnen") {
      const ziel = document.getElementById("grErgebnis");
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
  window.GriffRechner = { zielwert, leistung, level, gruppe };
})();
