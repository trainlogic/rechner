/* =========================================================================
   PLAN-VDOT — Trainingstempo beim Laufen aus einer gemessenen Zeit.
   -------------------------------------------------------------------------
   Reine Rechnung, keine DOM-/Speicher-Abhaengigkeit -> im Browser
   (window.PlanVdot) und in Node (module.exports) nutzbar und unit-testbar.

   WOZU DAS NOETIG WAR: Der Ausdauer-Plan hat das Tempo bisher als festen
   Faktor auf das Renntempo der ZIELdistanz gerechnet (Intervalle = 0,96 x
   Renntempo). Das ist eine Faustformel, und sie hat zwei Schwaechen: sie
   haengt an einer PROGNOSE (also an einer hochgerechneten Zeit statt an der
   gemessenen), und ihr Abstand zwischen den Zonen bleibt ueber alle
   Leistungsklassen gleich. Tatsaechlich liegen die Zonen beim Anfaenger
   weiter auseinander als beim Geuebten.

   DANIELS' VDOT rechnet stattdessen ueber die Physiologie: aus der gemessenen
   Zeit wird die effektive Sauerstoffaufnahme bestimmt, und jede Trainingszone
   ist ein Prozentsatz davon. Zwei Formeln:

     %VO2max(t) = 0.8 + 0.1894393 * e^(-0.012778*t)
                      + 0.2989558 * e^(-0.1932605*t)      (t in Minuten)
     VO2(v)     = -4.60 + 0.182258*v + 0.000104*v^2       (v in m/min)
     VDOT       = VO2(v) / %VO2max(t)

   Die erste sagt, welchen Anteil seines Maximums man ueber eine Zeitspanne
   halten kann (ueber 3 Minuten fast alles, ueber zwei Stunden deutlich
   weniger). Die zweite ist der gemessene Sauerstoffbedarf beim Laufen mit
   einer bestimmten Geschwindigkeit. Zusammen ergeben sie aus EINER Zeit einen
   Formwert, der sich auf jede andere Distanz uebertraegt.

   FUERS TEMPO wird die zweite Formel umgekehrt: zu einem Zielverbrauch
   (Prozentsatz vom VDOT) die passende Geschwindigkeit. Quadratische Gleichung,
   die positive Wurzel ist die Loesung.

   DIE PROZENTSAETZE sind nicht geraten, sondern an Daniels' veroeffentlichter
   Tabelle abgeglichen: fuer VDOT 40, 50 und 60 zusammen bleibt die Abweichung
   im Mittel unter 3 Sekunden je Kilometer (nachgerechnet, siehe
   tests/plan-vdot.test.mjs). Wer sie anfasst, muss dort gegenpruefen.

   BAND STATT PUNKT: Jede Zone liefert eine Spanne, keine Einzelzahl. Ein
   Intervall bei "4:00-4:10 /km" ist eine Vorgabe, die man laufen kann; eine
   auf die Sekunde genaue Zahl taeuscht eine Praezision vor, die weder die
   Formel noch die Uhr am Handgelenk hergibt.
   ========================================================================= */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.PlanVdot = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* --- Die beiden Daniels-Formeln ----------------------------------------- */

  // Welchen Anteil des Maximums haelt man ueber t Minuten durch?
  function anteilVo2max(tMin) {
    if (!(tMin > 0)) return 0;
    return 0.8 +
      0.1894393 * Math.exp(-0.012778 * tMin) +
      0.2989558 * Math.exp(-0.1932605 * tMin);
  }

  // Sauerstoffbedarf beim Laufen mit v Metern je Minute.
  function vo2Bei(vMeterProMin) {
    if (!(vMeterProMin > 0)) return 0;
    return -4.60 + 0.182258 * vMeterProMin + 0.000104 * vMeterProMin * vMeterProMin;
  }

  /* Umkehrung: zu einem Sauerstoffverbrauch die Geschwindigkeit. Die
     quadratische Gleichung 0.000104*v^2 + 0.182258*v - (4.60 + ziel) = 0 hat
     eine positive und eine negative Wurzel; nur die positive ist ein Tempo. */
  function tempoFuerVo2(zielVo2) {
    if (!(zielVo2 > 0)) return 0;
    var a = 0.000104, b = 0.182258, c = -4.60 - zielVo2;
    var wurzel = b * b - 4 * a * c;
    if (!(wurzel > 0)) return 0;
    return (-b + Math.sqrt(wurzel)) / (2 * a);
  }

  /* --- Formwert aus einer gemessenen Zeit ---------------------------------- */

  /* Sinnvoll nur fuer Zeiten, die wirklich ausbelastet gelaufen wurden. Unter
     drei Minuten dominiert der anaerobe Anteil, ueber zwei Stunden die
     Ernaehrung — beides misst die Formel nicht mit. Ausserhalb dieser Grenzen
     gibt es deshalb KEINEN Wert statt eines schlechten. */
  var T_MIN_MINUTEN = 3;
  var T_MAX_MINUTEN = 120;

  function vdot(distanzM, sekunden) {
    if (!(distanzM > 0) || !(sekunden > 0)) return 0;
    var tMin = sekunden / 60;
    if (tMin < T_MIN_MINUTEN || tMin > T_MAX_MINUTEN) return 0;
    var anteil = anteilVo2max(tMin);
    if (!(anteil > 0)) return 0;
    return vo2Bei(distanzM / tMin) / anteil;
  }

  /* --- Die Trainingszonen -------------------------------------------------
     `mitte` ist der Anteil am VDOT bei VDOT 50, `steigung` seine Aenderung je
     VDOT-Punkt, `spanne` die halbe Breite des angezeigten Bandes.

     WARUM EINE STEIGUNG UND KEIN FESTER PROZENTSATZ: Daniels' Tabelle benutzt
     keinen. Nachgerechnet aus den abgedruckten Werten steht die Schwelle beim
     Laeufer mit VDOT 40 bei 86,4 % seines Maximums, beim VDOT 60 bei 89,6 %.
     Das ist kein Rundungsrauschen, sondern die bekannte Beobachtung, dass der
     Trainiertere einen groesseren Anteil seines Maximums ueber dieselbe Zeit
     haelt. Mit einem festen Prozentsatz verfehlt man die Tabelle je nach
     Leistungsklasse um bis zu 8 Sekunden je Kilometer — in die falsche
     Richtung fuer genau die Gruppe, die den Plan am noetigsten hat: der
     Anfaenger bekaeme zu schnelle Vorgaben.

     Mit der Steigung bleibt die Abweichung ueber VDOT 40/50/60 unter einer
     halben Sekunde je Kilometer (tests/plan-vdot.test.mjs rechnet es nach).
     Beim lockeren Lauf ist die Steigung praktisch null — dort zaehlt der
     Anteil an sich, nicht die Form.

     Die Zuordnung zum Z1-Z5-Schema der App steht daneben, damit Puls und
     Tempo dieselbe Sprache sprechen. Easy ist bewusst breit: der lockere Lauf
     hat keinen scharfen Rand, er hat eine Obergrenze. */
  var ZONEN = {
    easy:       { mitte: 0.6468, steigung: -0.00011, spanne: 0.0419, zoneVon: 1, zoneBis: 2, label: "locker",       rpe: [3, 4] },
    marathon:   { mitte: 0.8245, steigung:  0.00148, spanne: 0.0060, zoneVon: 2, zoneBis: 3, label: "zügig",        rpe: [5, 6] },
    threshold:  { mitte: 0.8808, steigung:  0.00157, spanne: 0.0060, zoneVon: 4, zoneBis: 4, label: "Schwelle",     rpe: [7, 8] },
    interval:   { mitte: 0.9794, steigung:  0.00135, spanne: 0.0050, zoneVon: 5, zoneBis: 5, label: "VO₂max",       rpe: [8, 9] },
    repetition: { mitte: 1.0749, steigung:  0.00155, spanne: 0.0050, zoneVon: 5, zoneBis: 5, label: "Wiederholung", rpe: [9, 10] }
  };

  /* Ausserhalb dieser Grenzen wird die Gerade nicht mehr verlaengert. Sie ist
     an drei Stuetzstellen zwischen 40 und 60 gefittet; wer sie bis VDOT 20
     durchzieht, bekommt Anteile, die nichts mehr mit Daniels zu tun haben. */
  var VDOT_MIN = 30;
  var VDOT_MAX = 85;

  function anteilBei(z, vdotWert) {
    var v = Math.max(VDOT_MIN, Math.min(VDOT_MAX, vdotWert));
    return z.mitte + z.steigung * (v - 50);
  }

  /* Sekunden je Kilometer fuer einen Anteil am VDOT. */
  function paceSek(vdotWert, anteil) {
    var v = tempoFuerVo2(vdotWert * anteil);
    return v > 0 ? 60000 / v : 0;
  }

  /* Eine Zone als Spanne: { schnell, langsam, mitte } in Sekunden je km.
     `mitte` ist der Wert zum Rechnen (Dauer eines Intervallstuecks),
     `schnell`/`langsam` sind die Raender fuer die Anzeige. */
  function zone(vdotWert, key) {
    var z = ZONEN[key];
    if (!z || !(vdotWert > 0)) return null;
    var anteil = anteilBei(z, vdotWert);
    var schnell = paceSek(vdotWert, anteil + z.spanne);
    var langsam = paceSek(vdotWert, anteil - z.spanne);
    if (!(schnell > 0) || !(langsam > 0)) return null;
    return {
      key: key,
      schnell: schnell,
      langsam: langsam,
      mitte: (schnell + langsam) / 2,
      zoneVon: z.zoneVon,
      zoneBis: z.zoneBis,
      label: z.label,
      rpe: z.rpe.slice()
    };
  }

  function zonen(vdotWert) {
    var out = {};
    Object.keys(ZONEN).forEach(function (k) { out[k] = zone(vdotWert, k); });
    return out;
  }

  /* --- Anzeige ------------------------------------------------------------
     Formatiert wird erst hier; gerechnet wird durchgehend in Sekunden. */
  function mmss(sek) {
    var s = Math.max(0, Math.round(sek));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  /* "4:00-4:10 /km". Liegen beide Raender nach dem Runden auf derselben
     Sekunde, steht nur eine Zahl da — "4:00-4:00" liest sich wie ein Fehler. */
  function paceText(z, einheit) {
    if (!z) return null;
    var schnell = mmss(z.schnell);
    var langsam = mmss(z.langsam);
    var label = einheit || "/km";
    return (schnell === langsam ? schnell : schnell + "-" + langsam) + " " + label;
  }

  function rpeText(z) {
    if (!z || !z.rpe) return null;
    return z.rpe[0] === z.rpe[1] ? "RPE " + z.rpe[0] : "RPE " + z.rpe[0] + "-" + z.rpe[1];
  }

  return {
    vdot: vdot,
    zone: zone,
    zonen: zonen,
    paceSek: paceSek,
    paceText: paceText,
    rpeText: rpeText,
    mmss: mmss,
    anteilVo2max: anteilVo2max,
    anteilBei: anteilBei,
    vo2Bei: vo2Bei,
    tempoFuerVo2: tempoFuerVo2,
    ZONEN: ZONEN,
    T_MIN_MINUTEN: T_MIN_MINUTEN,
    T_MAX_MINUTEN: T_MAX_MINUTEN
  };
});
