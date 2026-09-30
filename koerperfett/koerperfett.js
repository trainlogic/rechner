/* =========================================================================
   KOERPERFETT-RECHNER fuer fitnessdoneright.de/koerperfett-rechner.
   -------------------------------------------------------------------------
   Gerechnet wird NICHT hier, sondern mit dem Kern der App
   (js/nutrition-calc.js): Navy-Formel fuers Massband, Deurenberg als grobe
   Schaetzung aus dem BMI, und das Abnehmtempo aus denselben Stufen, mit
   denen der Kalorienrechner plant. Die Bilderleiter kommt aus
   js/nutrition-tool.js (NutritionTool.LEITER). Diese Datei baut nur die
   Oberflaeche.

   Der Rahmen auf der Wix-Seite hat eine FESTE Hoehe. Deshalb steht vor dem
   Berechnen dieselbe Ergebniskarte mit Strichen — gleich hoch, kein Sprung,
   keine leere Flaeche.
   ========================================================================= */
(function () {
  "use strict";

  const Calc = window.NutritionCalc;
  const LEITER = window.NutritionTool.LEITER;
  const SPEICHER = "tl_koerperfett_eingaben";

  /* Einordnung nach dem American Council on Exercise (ACE). "bis" ist die
     Grenze BIS UNTER: die Tabelle nennt ganze Zahlen (Mann fit 14-17,
     Durchschnitt 18-24), gerechnet wird mit Nachkommastelle — 17,3 fiel mit
     "bis 17 einschliesslich" durchs Raster in "Durchschnitt". */
  const STUFEN = {
    mann: [
      { bis: 6, name: "Lebensnotwendiges Fett", farbe: "#a9cde4" },
      { bis: 14, name: "Athletisch", farbe: "#4fa3d1" },
      { bis: 18, name: "Fit", farbe: "#2f8f6f" },
      { bis: 25, name: "Durchschnitt", farbe: "#f2b25c" },
      { bis: 45, name: "Erhöht", farbe: "#e8785a" }
    ],
    frau: [
      { bis: 14, name: "Lebensnotwendiges Fett", farbe: "#a9cde4" },
      { bis: 21, name: "Athletisch", farbe: "#4fa3d1" },
      { bis: 25, name: "Fit", farbe: "#2f8f6f" },
      { bis: 32, name: "Durchschnitt", farbe: "#f2b25c" },
      { bis: 50, name: "Erhöht", farbe: "#e8785a" }
    ]
  };

  let z = gemerkt();

  function gemerkt() {
    let alt = {};
    try { alt = JSON.parse(localStorage.getItem(SPEICHER) || "{}") || {}; } catch (err) { alt = {}; }
    return Object.assign({
      geschlecht: "mann", alter: "", groesse: "", gewicht: "",
      methode: "massband", hals: "", bauch: "", taille: "", huefte: ""
    }, alt);
  }
  function merken() {
    try { localStorage.setItem(SPEICHER, JSON.stringify(z)); } catch (err) { /* privat: egal */ }
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const komma = (n) => String(n).replace(".", ",");

  function wahl(feld, optionen) {
    return `<div class="nut-choice">` + optionen.map((o) =>
      `<button type="button" data-feld="${feld}" data-wert="${o.wert}" aria-pressed="${z[feld] === o.wert}">${esc(o.text)}</button>`
    ).join("") + `</div>`;
  }
  // type="text" + inputmode: type="number" verschluckt auf deutschen Geraeten
  // das Komma (dieselbe Falle wie im Kalorienrechner).
  function feld(name, text) {
    return `<div class="profile-field"><label for="kf-${name}">${esc(text)}</label>` +
      `<input id="kf-${name}" type="text" inputmode="decimal" autocomplete="off" data-feld="${name}" value="${esc(z[name])}"></div>`;
  }

  function messFelder() {
    if (z.methode === "bmi") {
      return `<div class="nut-hinweis" style="margin-top:0">Ohne Maßband schätzen wir aus Größe, Gewicht und Alter (BMI-Formel nach Deurenberg). Das ist grob: Muskeln kennt die Formel nicht, bei Trainierten liegt sie meist zu hoch.</div>`;
    }
    const felder = z.geschlecht === "mann"
      ? feld("hals", "Hals (cm)") + feld("bauch", "Bauch auf Nabelhöhe (cm)")
      : feld("hals", "Hals (cm)") + feld("taille", "Taille (cm)") + feld("huefte", "Hüfte (cm)");
    const anleitung = z.geschlecht === "mann"
      ? "Im Stehen messen, locker ausatmen, nicht einziehen. <b>Hals</b> knapp unterhalb des Kehlkopfs, Band leicht nach vorn geneigt. <b>Bauch</b> waagerecht auf Höhe des Bauchnabels."
      : "Im Stehen messen, locker ausatmen, nicht einziehen. <b>Hals</b> knapp unterhalb des Kehlkopfs. <b>Taille</b> an der schmalsten Stelle, <b>Hüfte</b> an der breitesten Stelle über dem Po.";
    return `<div class="nut-row">${felder}</div>` +
      `<div class="nut-hinweis">${anleitung}</div>`;
  }

  function formular() {
    return `
      <div class="nut-card">
        <div class="nut-card-title">Deine Daten</div>
        ${wahl("geschlecht", [{ wert: "frau", text: "Frau" }, { wert: "mann", text: "Mann" }])}
        <div class="nut-row" style="margin-top:10px">
          ${feld("groesse", "Größe (cm)")}
          ${feld("gewicht", "Gewicht (kg)")}
          ${feld("alter", "Alter")}
        </div>
        <div class="nut-hinweis">Mit Gewicht rechnen wir dir auch Fett- und Muskelmasse aus.</div>
      </div>
      <div class="nut-card">
        <div class="nut-card-title">Messen</div>
        ${wahl("methode", [{ wert: "massband", text: "Mit Maßband (genauer)" }, { wert: "bmi", text: "Ohne Maßband" }])}
        <div style="margin-top:10px">${messFelder()}</div>
      </div>
      <button id="kfRechnen" class="primary-btn voll" type="button">Berechnen</button>
      <div id="kfErgebnis">${ergebnis(null)}</div>`;
  }

  function rechnen() {
    const e = {
      geschlecht: z.geschlecht, groesseCm: z.groesse, gewichtKg: z.gewicht, alterJahre: z.alter,
      halsCm: z.hals, bauchCm: z.bauch, tailleCm: z.taille, huefteCm: z.huefte
    };
    const kfa = z.methode === "massband" ? Calc.kfaNavy(e) : Calc.kfaDeurenberg(e);
    if (kfa === null) {
      return { fehlt: z.methode === "massband"
        ? (z.geschlecht === "mann" ? "Für die Maßband-Formel brauchen wir Größe, Hals und Bauch — und der Bauch muss größer sein als der Hals."
                                   : "Für die Maßband-Formel brauchen wir Größe, Hals, Taille und Hüfte.")
        : "Ohne Maßband brauchen wir Größe, Gewicht und Alter." };
    }
    const g = Number(String(z.gewicht).replace(",", ".")) || 0;
    const rate = Calc.zielRate({ geschlecht: z.geschlecht, gewichtKg: g, ziel: "abnehmen", kfaProzent: kfa, kfaBelastbar: z.methode === "massband" });
    return {
      kfa,
      fettKg: g > 0 ? Math.round(g * kfa) / 100 : null,
      magerKg: g > 0 ? Math.round(g * (100 - kfa)) / 100 : null,
      rate, gewicht: g, geschaetzt: z.methode !== "massband"
    };
  }

  function stufe(kfa) {
    const reihe = STUFEN[z.geschlecht];
    return reihe.find((s) => kfa < s.bis) || reihe[reihe.length - 1];
  }

  function naechsteFigur(kfa) {
    const reihe = LEITER[z.geschlecht];
    let beste = 0;
    reihe.forEach((s, i) => { if (Math.abs(s.wert - kfa) < Math.abs(reihe[beste].wert - kfa)) beste = i; });
    return { index: beste, band: reihe[beste].band };
  }

  function skala(kfa) {
    const reihe = STUFEN[z.geschlecht];
    const max = reihe[reihe.length - 1].bis;
    let von = 0;
    const teile = reihe.map((s) => {
      const breite = (s.bis - von) / max * 100; von = s.bis;
      return `<span style="width:${breite}%;background:${s.farbe}"></span>`;
    }).join("");
    const pos = kfa === null ? null : Math.max(1, Math.min(99, kfa / max * 100));
    return `<div class="kf-skala">${teile}${pos === null ? "" : `<i style="left:${pos}%"></i>`}</div>`;
  }

  function ergebnis(r) {
    if (r && r.fehlt) {
      return `<div class="nut-card kf-ergebnis"><div class="nut-card-title">Es fehlt etwas</div><div class="nut-gefunden">${esc(r.fehlt)}</div></div>`;
    }
    const leer = !r;
    const st = leer ? null : stufe(r.kfa);
    const fig = leer ? null : naechsteFigur(r.kfa);
    const bild = leer
      ? `<div class="kf-bild kf-bild-leer"></div>`
      : `<img class="kf-bild" src="../img/kfa/${z.geschlecht}-${fig.index + 1}.png" width="300" height="${z.geschlecht === "frau" ? 336 : 307}" alt="Figur mit etwa ${esc(fig.band)} Körperfett">`;
    const kg = (v) => (leer || v === null ? "—" : komma(v.toFixed(1)));
    let tempo = "Nach dem Berechnen steht hier, wie schnell du beim Abnehmen sinnvoll vorgehst.";
    if (!leer) {
      const pro = komma(r.rate.rateProWoche);
      tempo = r.gewicht > 0
        ? `Beim Abnehmen sind für dich rund <b>${pro} % deines Gewichts pro Woche</b> sinnvoll — etwa <b>${komma(r.rate.kgProWoche)} kg</b>. Schneller kostet vor allem Muskeln.`
        : `Beim Abnehmen sind für dich rund <b>${pro} % deines Gewichts pro Woche</b> sinnvoll. Schneller kostet vor allem Muskeln.`;
      if (r.geschaetzt) tempo += " Ohne Maßband nehmen wir die mittlere Rate.";
    }
    return `
      <div class="nut-card kf-ergebnis${leer ? " leer" : ""}">
        <div class="kf-kopf">
          ${bild}
          <div>
            <div class="nut-card-title" style="margin-bottom:2px">Dein Körperfettanteil</div>
            <div class="kf-wert wert">${leer ? "—" : komma(r.kfa)} %</div>
            <div class="kf-stufe" style="color:${leer ? "#b9c7d6" : "#042c4c"}">${leer ? "Einordnung" : esc(st.name)}${!leer && r.geschaetzt ? " (grob geschätzt)" : ""}</div>
            <div class="nut-hinweis" style="margin-top:2px">${leer ? "Die Figur zeigt, wie das ungefähr aussieht." : `Die Figur zeigt etwa ${esc(fig.band)}.`}</div>
          </div>
        </div>
        ${skala(leer ? null : r.kfa)}
        <div class="kf-legende">${STUFEN[z.geschlecht].map((s) => `<span><i style="background:${s.farbe}"></i>${esc(s.name)}</span>`).join("")}</div>
        <div class="nut-makros" style="margin-top:12px;grid-template-columns:1fr 1fr">
          <div class="nut-makro"><div class="nut-makro-wert wert">${kg(r && r.fettKg)} kg</div><div class="nut-makro-name">Fettmasse</div></div>
          <div class="nut-makro"><div class="nut-makro-wert wert">${kg(r && r.magerKg)} kg</div><div class="nut-makro-name">Fettfreie Masse</div></div>
        </div>
        <div class="nut-gefunden" style="margin-top:12px">${tempo}</div>
        <a class="weiter" href="https://www.fitnessdoneright.de/kalorienrechner" target="_top">Jetzt Kalorien fürs Abnehmen berechnen →</a>
      </div>`;
  }

  function zeichnen() {
    document.getElementById("rechner").innerHTML = formular();
  }

  function binden() {
    const k = document.getElementById("rechner");
    k.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-feld]");
      if (b) { z[b.dataset.feld] = b.dataset.wert; merken(); zeichnen(); return; }
      if (ev.target.id === "kfRechnen") {
        const ziel = document.getElementById("kfErgebnis");
        ziel.innerHTML = ergebnis(rechnen());
        ziel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
    k.addEventListener("input", (ev) => {
      const el = ev.target;
      if (!el.dataset || !el.dataset.feld) return;
      z[el.dataset.feld] = el.value; merken();
    });
  }

  zeichnen();
  binden();

  // Fuer den Test (tests-webkit/rechner-koerperfett.test.mjs).
  window.Koerperfett = { STUFEN, stufe: (kfa, g) => { const alt = z.geschlecht; z.geschlecht = g; const s = stufe(kfa); z.geschlecht = alt; return s.name; } };
})();
