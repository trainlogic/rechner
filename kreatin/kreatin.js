/* =========================================================================
   KREATIN-RECHNER fuer den Blogartikel "Kreatin richtig einnehmen"
   (fitnessdoneright.de, eingebettet im Artikel).
   -------------------------------------------------------------------------
   Grundlage: docs/website/kreatin-rechner/pruefung-2026-11-22.md
   (Sportwissenschaftler-Pruefung, von Benjamin am 22.11.2026 freigegeben).

   Eingaben: Koerpergewicht, Ernaehrungsform, mit/ohne Ladephase. Geschlecht,
   Alter und Ziel aendern die Dosis NICHT (keine Belege fuer einen eigenen
   Rechenweg) und stehen deshalb nur im Hinweis.

   Regeln:
   - Taeglich = 0,05 g/kg, auf ganze Gramm gerundet, begrenzt auf 3-5 g;
     vegetarisch/vegan +1 g (eigene Ableitung: ersetzt die ~1-2 g aus Fleisch
     und Fisch), damit hoechstens 6 g. Ganze Gramm statt 0,5 g, weil
     Messloeffel meist 1, 3 oder 5 g fassen.
   - Laden = 0,3 g/kg/Tag, auf 5 g gerundet, begrenzt auf 15-25 g, 5-7 Tage,
     in Portionen zu 5 g (also 3-5). Ohne Grenze kaemen bei 150 kg 45 g
     heraus; geprueft ist das Standardprotokoll mit 20 g (Hultman 1996).
   - Ohne Laden ist der Speicher nach etwa 4 Wochen voll (3 g/Tag, Hultman).
   - Schalter "Sehr aktiv" (Benjamin 22.11.2026, Weg aus seinem Artikel):
     0,1 g/kg, bei Mischkost 1 g weniger (Artikel: "1-2 g abziehen"), nie
     unter dem normalen Wert, hoechstens 10 g; ueber 5 g auf zwei Portionen.
     Laut Pruefung FACHMEINUNG (Kreider 2017), keine Dosis-Wirkungs-Studie -
     das sagt der Text unter dem Ergebnis auch.

   Der Rahmen im Artikel hat eine FESTE Hoehe - vor dem Berechnen steht
   dieselbe Ergebniskarte mit Strichen, beide Wege haben gleich viele Zeilen.
   ========================================================================= */
(function () {
  "use strict";

  const SPEICHER = "tl_kreatin_eingaben";
  const KG_MIN = 40, KG_MAX = 150;

  // Aus den Stichpunkten der Pruefung, von Benjamin am 22.11.2026 so
  // freigegeben ("du kannst veroeffentlichen").
  const HINWEIS = "Das Ergebnis ist eine Orientierung. Mehr als die Tagesmenge bringt nach heutigem Stand keinen zusätzlichen Nutzen. Wann du Kreatin nimmst, ist egal, wichtig ist nur, dass du es täglich nimmst, auch an Ruhetagen. Kaffee musst du deswegen nicht weglassen. Bei Frauen und Älteren wirkt Kreatin genauso, am meisten zusammen mit Krafttraining; die Menge pro Kilogramm passt schon. Wenn du eine Nierenerkrankung hast, schwanger bist oder stillst, sprich vorher mit deiner Ärztin oder deinem Arzt. Vor einer Blutabnahme lohnt es sich, Kreatin zu erwähnen: der Kreatininwert kann leicht steigen, ohne dass die Niere etwas hat. Der Rechner ist für Erwachsene gedacht.";
  const TEXT_LADEN = "Nimm die Menge 5 bis 7 Tage lang, verteilt auf Portionen zu 5 g, am besten zum Essen. Die Waage kann in dieser Zeit wegen Wasser im Muskel etwas steigen, das ist kein Fett.";
  const TEXT_OHNE = "Ohne Ladephase kommt dieselbe Wirkung, nur später: Nach etwa 4 Wochen ist dein Speicher voll.";
  const TEXT_AKTIV = "Mehr als 5 g am Tag für sehr Aktive ist eine Erfahrung aus der Praxis, keine Studie belegt den zusätzlichen Nutzen. Verteil die Menge auf zwei Portionen, das ist angenehmer für den Magen.";
  const TEXT_PFLANZLICH = "Mit vegetarischer oder veganer Ernährung startest du mit einem kleineren Speicher. Das zusätzliche Gramm ersetzt, was sonst Fleisch und Fisch liefern.";

  const begrenzen = (x, a, b) => Math.min(b, Math.max(a, x));

  function tagesmenge(kg, kost, training) {
    const basis = begrenzen(Math.round(0.05 * kg), 3, 5);
    const normal = basis + (kost === "misch" ? 0 : 1);
    if (training !== "aktiv") return normal;
    const aktiv = Math.round(0.1 * kg) - (kost === "misch" ? 1 : 0);
    return begrenzen(aktiv, normal, 10);
  }

  function ladung(kg) {
    const proTag = begrenzen(Math.round((0.3 * kg) / 5) * 5, 15, 25);
    return { proTag, portionen: proTag / 5 };
  }

  let z = (function () {
    let alt = {};
    try { alt = JSON.parse(localStorage.getItem(SPEICHER) || "{}") || {}; } catch (err) { alt = {}; }
    return Object.assign({ kg: "", kost: "misch", training: "normal", laden: "nein" }, alt);
  })();
  const merken = () => { try { localStorage.setItem(SPEICHER, JSON.stringify(z)); } catch (err) { /* egal */ } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const zahl = (v) => { const n = Number(String(v).trim().replace(",", ".")); return isFinite(n) && n > 0 ? n : NaN; };

  function rechnen() {
    const kg = zahl(z.kg);
    if (!(kg >= KG_MIN && kg <= KG_MAX)) return { fehlt: "Trag dein Körpergewicht ein, zwischen " + KG_MIN + " und " + KG_MAX + " kg." };
    const r = { taeglich: tagesmenge(kg, z.kost, z.training), pflanzlich: z.kost !== "misch", aktiv: z.training === "aktiv" };
    if (z.laden === "ja") r.laden = ladung(kg);
    return r;
  }

  function wahl(feldName, optionen, spalten) {
    return `<div class="nut-choice kr-wahl kr-${spalten}">` + optionen.map(([wert, text]) =>
      `<button type="button" data-feld="${feldName}" data-wert="${wert}" aria-pressed="${z[feldName] === wert}">${esc(text)}</button>`).join("") + `</div>`;
  }

  function formular() {
    return `
      <div class="nut-card">
        <div class="nut-card-title">Deine Angaben</div>
        <div class="profile-field"><label for="kr-kg">Körpergewicht (kg)</label>
          <input id="kr-kg" type="text" inputmode="decimal" autocomplete="off" placeholder="80" data-feld="kg" value="${esc(z.kg)}"></div>
        <div class="nut-feld-titel" style="margin:12px 0 6px">Ernährung</div>
        ${wahl("kost", [["misch", "Misch\u00ADkost"], ["vegetarisch", "Vege\u00ADtarisch"], ["vegan", "Vegan"]], 3)}
        <div class="nut-feld-titel" style="margin:12px 0 6px">Training</div>
        ${wahl("training", [["normal", "Normal"], ["aktiv", "Sehr aktiv"]], 2)}
        <div class="nut-feld-titel" style="margin:12px 0 6px">Ladephase</div>
        ${wahl("laden", [["nein", "Ohne"], ["ja", "Mit Ladephase"]], 2)}
      </div>
      <button id="krRechnen" class="primary-btn voll" type="button">Berechnen</button>
      <div id="krErgebnis">${ergebnis(null)}</div>`;
  }

  function ergebnis(r) {
    if (r && r.fehlt) {
      return `<div class="nut-card"><div class="nut-card-title">Das passt noch nicht</div><div class="nut-gefunden">${esc(r.fehlt)}</div></div>`;
    }
    const leer = !r;
    const laden = r && r.laden;
    // Kurze Werte: bei 320 px schob sich "25 g pro Tag, 5-7 Tage" ueber die
    // Beschriftung (22.11.2026), darum Menge und Dauer in getrennten Zeilen.
    const zeileLaden = leer ? "–" : (laden ? laden.proTag + " g pro Tag" : "keine");
    const zeilePortion = leer ? "–" : (laden ? laden.portionen + " × 5 g" : (r.taeglich > 5 ? "2 × täglich" : "1 × täglich"));
    const zeileVoll = leer ? "–" : (laden ? "nach 5–7 Tagen" : "nach ca. 4 Wochen");
    // Fester Rahmen im Artikel: die Karte muss vor und nach dem Berechnen
    // gleich hoch sein. Gemessen 22.11.2026 bei 320 px: mit leeren Absaetzen
    // wuchs die Seite um bis zu 195 px. Darum stehen die laengsten Texte schon
    // vorher unsichtbar da und halten den Platz frei.
    const versteckt = (t) => `<span class="kr-platz" aria-hidden="true">${esc(t)}</span>`;
    const absatz1 = leer ? versteckt(TEXT_LADEN) : esc(laden ? TEXT_LADEN : TEXT_OHNE);
    const absatz2 = leer || !r.pflanzlich ? versteckt(TEXT_PFLANZLICH) : esc(TEXT_PFLANZLICH);
    const absatz3 = leer || !(r.aktiv && r.taeglich > 5) ? versteckt(TEXT_AKTIV) : esc(TEXT_AKTIV);
    return `
      <div class="nut-card kr-ergebnis${leer ? " leer" : ""}">
        <div class="nut-ziel">
          <div class="nut-ziel-wert wert">${leer ? "–" : r.taeglich} g</div>
          <div class="nut-ziel-label">Deine Tagesmenge Kreatin-Monohydrat</div>
        </div>
        <div class="kr-zeile"><span>Ladephase</span><b class="wert">${zeileLaden}</b></div>
        <div class="kr-zeile"><span>Portionen am Tag</span><b class="wert">${zeilePortion}</b></div>
        <div class="kr-zeile"><span>Speicher voll</span><b class="wert">${zeileVoll}</b></div>
        <p class="kr-text">${absatz1}</p>
        <p class="kr-text">${absatz2}</p>
        <p class="kr-text">${absatz3}</p>
        <div class="nut-hinweis">${HINWEIS}</div>
      </div>`;
  }

  const k = document.getElementById("rechner");
  const zeichnen = () => { k.innerHTML = formular(); };
  k.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-feld]");
    if (b) { z[b.dataset.feld] = b.dataset.wert; merken(); zeichnen(); return; }
    if (ev.target.id === "krRechnen") {
      const ziel = document.getElementById("krErgebnis");
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
  window.KreatinRechner = { tagesmenge, ladung };
})();
