/* =========================================================================
   CALORIE-ESTIMATOR — was eine Einheit verbraucht hat.
   -------------------------------------------------------------------------
   BRUTTO ODER NETTO? Nachgemessen am 21.08.2026, weil der Kalorienrechner
   (js/nutrition-calc.js) die Antwort braucht: er addiert diese Zahl auf den
   Grundumsatz, und was hier schon drinsteckt, zaehlt dort ein zweites Mal.

   DIE ANTWORT LAUTET: ueberwiegend BRUTTO — der Ruheumsatz der Trainingszeit
   ist enthalten. Belegt an den Konstanten selbst, umgerechnet auf METs fuer
   den 75-kg-Referenzathleten (1 MET = Ruhe = 1,25 kcal/min):

     STRENGTH_REST_KCAL_PER_MIN.main = 3,8 kcal/min  -> 3,0 METs
     STRENGTH_WORK_KCAL_PER_MIN.main = 12  kcal/min  -> 9,6 METs

   Eine Pause mit 3 METs enthaelt das eine MET Ruhe; netto waeren es 2,0.
   Dasselbe gilt fuer die kcal je Wiederholung und den Dauer-Rueckfall.

   NICHT EINHEITLICH sind die beiden Pulswege:
     - Keytel (ohne Ruhepuls) ist eine Regression auf den GESAMTverbrauch,
       also brutto. Ausserhalb ihres Gueltigkeitsbereichs wird sie unsinnig:
       Puls 60 ueber 60 Minuten ergibt 53 kcal — weniger als Ruhe.
     - Der %HRR-Weg rechnet `pctHrr * VO2max` und liefert bei Ruhepuls
       NULL kcal/min. Er verhaelt sich also netto, und er unterschaetzt
       zusaetzlich, weil %HRR der VO2-RESERVE entspricht und nicht dem
       Anteil an VO2max.

   HIER WIRD DESHALB NICHTS GEAENDERT. An diesen Zahlen haengen XP, Abzeichen,
   Kalender und Share Cards; eine Korrektur wuerde die ganze Historie
   umdeuten. Der Kalorienrechner zieht den Ruheanteil stattdessen bei sich ab
   (siehe `ruheanteilKcal` in nutrition-calc.js) — dort kennt er den echten
   Grundumsatz des Nutzers und muss ihn nicht ueber 1 MET schaetzen.
   ========================================================================= */
(function () {
  const MOVEMENT_DATA = {
    burpees: { kcalPerRep: 1.15, type: "reps" },
    airsquats: { kcalPerRep: 0.32, type: "reps" },
    pushups: { kcalPerRep: 0.42, type: "reps" },
    handreleasepushups: { kcalPerRep: 0.45, type: "reps" },
    situps: { kcalPerRep: 0.22, type: "reps" },
    vups: { kcalPerRep: 0.3, type: "reps" },
    lunges: { kcalPerRep: 0.34, type: "reps" },
    wallballshots: { kcalPerRep: 0.65, type: "reps" },
    kettlebellswings: { kcalPerRep: 0.55, type: "reps" },
    singlearmkettlebellswings: { kcalPerRep: 0.55, type: "reps" },   // 22.09.2026, wie beidarmig
    boxjumps: { kcalPerRep: 0.62, type: "reps" },
    boxstepups: { kcalPerRep: 0.35, type: "reps" },
    boxstepovers: { kcalPerRep: 0.4, type: "reps" },
    burpeesoverbox: { kcalPerRep: 1.1, type: "reps" },
    burpeeboxjumps: { kcalPerRep: 1.15, type: "reps" },
    burpeesoverdumbbell: { kcalPerRep: 1.08, type: "reps" },
    burpeesoverkettlebell: { kcalPerRep: 1.08, type: "reps" },
    burpeesoverbarfacing: { kcalPerRep: 1.08, type: "reps" },
    burpeesoverbarlateral: { kcalPerRep: 1.04, type: "reps" },
    burpeesoverrower: { kcalPerRep: 1.1, type: "reps" },

    pullups: { kcalPerRep: 0.55, type: "reps" },
    chesttobarpullups: { kcalPerRep: 0.65, type: "reps" },
    ringrows: { kcalPerRep: 0.32, type: "reps" },
    ringdips: { kcalPerRep: 0.5, type: "reps" },
    toestobar: { kcalPerRep: 0.62, type: "reps" },
    kneestoelbows: { kcalPerRep: 0.5, type: "reps" },
    wallwalks: { kcalPerRep: 3.5, type: "reps" },
    pistols: { kcalPerRep: 0.65, type: "reps" },

    thrusters: { kcalPerRep: 0.82, type: "reps" },
    deadlifts: { kcalPerRep: 0.55, type: "reps" },
    backsquats: { kcalPerRep: 0.58, type: "reps" },
    frontsquats: { kcalPerRep: 0.62, type: "reps" },
    overheadsquats: { kcalPerRep: 0.7, type: "reps" },
    pushpress: { kcalPerRep: 0.62, type: "reps" },
    pushjerks: { kcalPerRep: 0.68, type: "reps" },
    sumodeadlifthighpulls: { kcalPerRep: 0.62, type: "reps" },

    snatches: { kcalPerRep: 0.75, type: "reps" },
    powersnatches: { kcalPerRep: 0.72, type: "reps" },
    squatsnatches: { kcalPerRep: 0.85, type: "reps" },
    hangpowersnatches: { kcalPerRep: 0.68, type: "reps" },
    hangsquatsnatches: { kcalPerRep: 0.78, type: "reps" },

    powercleans: { kcalPerRep: 0.72, type: "reps" },
    squatcleans: { kcalPerRep: 0.84, type: "reps" },
    hangcleans: { kcalPerRep: 0.68, type: "reps" },
    hangpowercleans: { kcalPerRep: 0.68, type: "reps" },
    hangsquatcleans: { kcalPerRep: 0.78, type: "reps" },
    cleanandjerks: { kcalPerRep: 0.95, type: "reps" },

    dumbbellsnatches: { kcalPerRep: 0.72, type: "reps" },
    dumbbellthrusters: { kcalPerRep: 0.78, type: "reps" },
    dumbbellcleans: { kcalPerRep: 0.62, type: "reps" },
    dumbbellpowercleans: { kcalPerRep: 0.64, type: "reps" },
    dumbbellhangcleans: { kcalPerRep: 0.6, type: "reps" },
    dumbbellhangpowercleans: { kcalPerRep: 0.6, type: "reps" },
    dumbbellwalkinglunges: { kcalPerRep: 0.42, type: "reps" },
    dumbbellboxstepovers: { kcalPerRep: 0.5, type: "reps" },
    devilspress: { kcalPerRep: 1.15, type: "reps" },
    dumbbellsquatsnatches: { kcalPerRep: 0.88, type: "reps" },
    dumbbellhangsnatches: { kcalPerRep: 0.72, type: "reps" },

    farmerscarry: { kcalPerMeter: 0.32, type: "distance" },
    sandbagcarry: { kcalPerMeter: 0.34, type: "distance" },
    sledpush: { kcalPerMeter: 0.55, type: "distance" },
    sledpull: { kcalPerMeter: 0.5, type: "distance" },

    run: { kcalPerKmPerKg: 1.0, type: "run" },
    shuttleruns: { kcalPerRep: 4.5, type: "shuttle" },

    row: { type: "erg" },
    rowcalories: { type: "ergCalories" },
    bike: { type: "erg" },
    bikecalories: { type: "ergCalories" },
    skierg: { type: "erg" },
    doubleunders: { kcalPerRep: 0.18, type: "reps" },

    ghdsitups: { kcalPerRep: 0.32, type: "reps" },
    backextensions: { kcalPerRep: 0.22, type: "reps" },
    hipextensions: { kcalPerRep: 0.22, type: "reps" },

    sandbagsquats: { kcalPerRep: 0.58, type: "reps" },
    sandbagcleans: { kcalPerRep: 0.78, type: "reps" },
    sandbagovershoulder: { kcalPerRep: 0.95, type: "reps" },

    hollowrocks: { kcalPerRep: 0.22, type: "reps" },
    archrocks: { kcalPerRep: 0.22, type: "reps" },
    pullovers: { kcalPerRep: 0.72, type: "reps" },

    stricthandstandpushups: { kcalPerRep: 0.95, type: "reps" },
    wallfacingstricthandstandpushups: { kcalPerRep: 1.0, type: "reps" },
    wallfacingkippinghandstandpushups: { kcalPerRep: 0.88, type: "reps" },
    seateddumbbellstrictpress: { kcalPerRep: 0.55, type: "reps" },
    pikepushups: { kcalPerRep: 0.48, type: "reps" },

    barmuscleups: { kcalPerRep: 1.6, type: "reps" },
    ringmuscleups: { kcalPerRep: 1.75, type: "reps" },
    ropeclimbs: { kcalPerRep: 5.0, type: "reps" },
    leglessropeclimbs: { kcalPerRep: 6.0, type: "reps" },

    handstandwalk: { kcalPerMeter: 1.0, type: "distance" },

    benchpress: { kcalPerRep: 0.52, type: "reps" },
    shoulderpress: { kcalPerRep: 0.5, type: "reps" },

    splitjerk: { kcalPerRep: 0.72, type: "reps" },
    snatchpulls: { kcalPerRep: 0.5, type: "reps" },
    cleanpulls: { kcalPerRep: 0.52, type: "reps" },

    musclesnatches: { kcalPerRep: 0.62, type: "reps" },
    musclecleans: { kcalPerRep: 0.62, type: "reps" },
    powercleanandjerks: { kcalPerRep: 0.88, type: "reps" },
    hangcleanandjerks: { kcalPerRep: 0.86, type: "reps" },

    singledumbbelloverheadsquats: { kcalPerRep: 0.72, type: "reps" },
    singlekettlebelloverheadsquats: { kcalPerRep: 0.68, type: "reps" },

    dumbbellfarmerscarry: { kcalPerMeter: 0.32, type: "distance" },
    kettlebellfarmerscarry: { kcalPerMeter: 0.32, type: "distance" },

    singlekettlebellsnatches: { kcalPerRep: 0.68, type: "reps" },
    doublekettlebellsnatches: { kcalPerRep: 0.82, type: "reps" },
    kettlebellsquatsnatches: { kcalPerRep: 0.88, type: "reps" },

    kettlebellgobletsquats: { kcalPerRep: 0.5, type: "reps" },
    kettlebellcleans: { kcalPerRep: 0.65, type: "reps" },
    kettlebellpushpress: { kcalPerRep: 0.58, type: "reps" },
    kettlebellcleanandjerks: { kcalPerRep: 0.88, type: "reps" },
    kettlebellgorrillarow: { kcalPerRep: 0.45, type: "reps" },
    kettlebellfrontracklunges: { kcalPerRep: 0.42, type: "reps" },
    kettlebelloverheadlunges: { kcalPerRep: 0.48, type: "reps" },

    dumbbelloverheadwalkinglunges: { kcalPerRep: 0.5, type: "reps" },
    dumbbellmanmakers: { kcalPerRep: 2.0, type: "reps" },
    doubledumbbellthrusters: { kcalPerRep: 0.78, type: "reps" },
    singledumbbellthrusters: { kcalPerRep: 0.72, type: "reps" },
    dumbbellbenchpress: { kcalPerRep: 0.5, type: "reps" },

    // Pull-up variants – all mapped to similar kcal/rep range
    strictpullups: { kcalPerRep: 0.55, type: "reps" },
    kippingpullups: { kcalPerRep: 0.52, type: "reps" },
    butterflypullups: { kcalPerRep: 0.50, type: "reps" },
    chinups: { kcalPerRep: 0.52, type: "reps" },

    // HSPU variants – "Handstand Push-Ups" in WODs (DIANE, JT, NATE, MARY…) normalises
    // to "handstandpushups"; the strict/wallfacing keys were already here but the base key was missing.
    handstandpushups: { kcalPerRep: 0.88, type: "reps" },
    kippinghandstandpushups: { kcalPerRep: 0.88, type: "reps" },
    strictringmuscleups: { kcalPerRep: 1.80, type: "reps" },
    toestorings: { kcalPerRep: 0.58, type: "reps" },
    pegboardascents: { kcalPerRep: 5.5, type: "reps" },

    // Barbell accessory / technique movements
    frontracklunges: { kcalPerRep: 0.42, type: "reps" },
    backracklunges: { kcalPerRep: 0.40, type: "reps" },
    goodmornings: { kcalPerRep: 0.28, type: "reps" },
    snatchbalance: { kcalPerRep: 0.65, type: "reps" },
    highhangpowersnatch: { kcalPerRep: 0.70, type: "reps" },
    cossacksquats: { kcalPerRep: 0.40, type: "reps" },
    russiantwists: { kcalPerRep: 0.18, type: "reps" },

    // Jump rope variants
    singleunders: { kcalPerRep: 0.10, type: "reps" },
    tripleunders: { kcalPerRep: 0.28, type: "reps" },
    crossoverdoubleunders: { kcalPerRep: 0.22, type: "reps" },
    singlecrossovers: { kcalPerRep: 0.12, type: "reps" },

    // Sandbag / odd-object
    sandbagtoshoulder: { kcalPerRep: 0.95, type: "reps" },
    sandbagbearhugwalk: { kcalPerMeter: 0.35, type: "distance" },

    // Other carry movements
    suitcasecarry: { kcalPerMeter: 0.28, type: "distance" },
    overheadcarry: { kcalPerMeter: 0.38, type: "distance" },
    frontcarry: { kcalPerMeter: 0.32, type: "distance" },
    yokecarry: { kcalPerMeter: 0.45, type: "distance" },

    /* --- Strongman und Zusatzarbeit (27.08.2026) -----------------------
       Ohne Eintrag greift der Dauer-Rueckfall, und der rechnet 10 kcal je
       Minute auf die GANZE Dauer — beim Strongman ist aber die Haelfte bis
       zwei Drittel davon vorgeschriebene Pause. Nachgerechnet lag er damit
       120 bis 140 Prozent zu hoch. Jede Zahl unten ist von einer Bewegung
       abgeleitet, die schon in dieser Tabelle steht; keine ist gemessen. */
    cleanandpress: { kcalPerRep: 0.85, type: "reps" },        // Thruster 0,82, aber vom Boden
    logpress: { kcalPerRep: 0.9, type: "reps" },              // wie Clean and Press, unhandlicher
    axlecleanandpress: { kcalPerRep: 0.88, type: "reps" },    // dito, dicker Griff
    axledeadlift: { kcalPerRep: 0.58, type: "reps" },         // Deadlift 0,55 plus Griffarbeit
    atlasstonetoshoulder: { kcalPerRep: 1.15, type: "reps" }, // Sandbag over Shoulder 0,95, schwerer

    bentoverrows: { kcalPerRep: 0.42, type: "reps" },         // wie Ring Rows 0,32, mit Last
    dumbbellbentoverrows: { kcalPerRep: 0.38, type: "reps" },
    kettlebellrows: { kcalPerRep: 0.38, type: "reps" },
    invertedrows: { kcalPerRep: 0.32, type: "reps" },         // = Ring Rows
    ringpullups: { kcalPerRep: 0.58, type: "reps" },          // Pull Ups 0,55, instabiler
    /* Bis 28.08.2026 "Parallette Dips" mit 0,4 — begruendet damit, dass am
       Boden ein Teil des Gewichts auf den Fersen bleibt. Als Matador Dip
       haengt der ganze Koerper: naeher an den Ring Dips (0,5), nur
       stabiler gefuehrt. Der alte Schluessel bleibt stehen, sonst faellt
       jedes Altlog auf den Dauer-Rueckfall zurueck. */
    matadordips: { kcalPerRep: 0.45, type: "reps" },
    parallettedips: { kcalPerRep: 0.45, type: "reps" },
    parallettehandstandpushups: { kcalPerRep: 0.85, type: "reps" },
    hanginglegraises: { kcalPerRep: 0.45, type: "reps" },     // zwischen Sit-Ups und T2B
    hammercurls: { kcalPerRep: 0.2, type: "reps" },           // kleine Muskelmasse
    bulgariansplitsquats: { kcalPerRep: 0.45, type: "reps" }, // Lunges 0,34, einbeinig mit Last

    /* --- Der ZEIT-Typ (28.08.2026) --------------------------------------
       Bis hierher kannte diese Tabelle nur `reps`, `distance` und die
       Ergometer. Ein Hold laesst sich damit nicht ausdruecken, ohne
       Sekunden als Wiederholungen auszugeben — deshalb fehlten Farmers
       Hold, Dead Hang und Plate Pinch Hold als einzige Bewegungen des
       Strongman-Pools. `type: "time"` mit `kcalPerMinute` schliesst die
       Luecke; die Sekunden bleiben Sekunden.

       Der ANKER ist die App selbst und nicht eine neue Schaetzung:
       `stationsRaten.deadhang` in parseWorkoutLineCalories rechnet fuer
       "1 min Dead Hang" seit jeher 3 kcal je Minute. Diese Zahl wird hier
       uebernommen, damit ein Dead Hang nicht davon abhaengt, in welcher
       Schreibweise er im Text steht.

       Die beiden anderen leiten sich davon und vom Tragen ab:
       - Farmer's Carry kostet 0,32 kcal je Meter; bei 1,6 s je Meter sind
         das 12 kcal je Minute im GEHEN. Wer dieselbe Last nur haelt, macht
         keine Hubarbeit mehr, haelt aber Ruecken, Rumpf und Griff unter
         voller Spannung — die Haelfte davon ist die konservative Lesart.
       - Der Plate Pinch haelt zwei Scheiben neben dem Koerper: viel
         weniger Last als am Farmers-Griff, im Kern reine Griffarbeit.
         Liegt damit knapp ueber dem Dead Hang.
       Keine der drei Zahlen ist gemessen. */
    farmershold: { kcalPerMinute: 6.0, type: "time" },
    platepinchhold: { kcalPerMinute: 3.5, type: "time" },
    deadhang: { kcalPerMinute: 3.0, type: "time" },

    // High-demand compound movements
    turkishgetups: { kcalPerRep: 1.0, type: "reps" },
    /* Kettlebell-Preset (11.09.2026). Einfache Kugel wie die Nachbarn
       (Clean 0,65, Swing 0,55); Doppel-Kugel etwa das 1,6-fache — zwei
       Lasten, aber eine Bewegung. Windmill/Halo langsam und leicht. */
    kettlebellstrictpress: { kcalPerRep: 0.5, type: "reps" },
    kettlebelljerks: { kcalPerRep: 0.7, type: "reps" },
    kettlebellwindmills: { kcalPerRep: 0.5, type: "reps" },
    kettlebellhalos: { kcalPerRep: 0.25, type: "reps" },
    bottomsupkettlebellpress: { kcalPerRep: 0.5, type: "reps" },
    bottomsupkettlebellcarry: { kcalPerMeter: 0.28, type: "distance" },
    kettlebellrackedcarry: { kcalPerMeter: 0.3, type: "distance" },
    doublekettlebellcleans: { kcalPerRep: 1.0, type: "reps" },
    doublekettlebellswings: { kcalPerRep: 0.9, type: "reps" },
    doublekettlebelljerks: { kcalPerRep: 1.0, type: "reps" },
    doublekettlebellcleanandjerks: { kcalPerRep: 1.3, type: "reps" },
    doublekettlebellfrontsquats: { kcalPerRep: 0.9, type: "reps" },
    doublekettlebellstrictpress: { kcalPerRep: 0.8, type: "reps" },
    doublekettlebellpushpress: { kcalPerRep: 0.85, type: "reps" },
    glutebridges: { kcalPerRep: 0.2, type: "reps" },
    tireflip: { kcalPerRep: 2.2, type: "reps" },

    // Hero-Katalog-Erweiterung 24.08.2026: Namen, die in den Katalogtexten
    // stehen, aber bisher keinen Eintrag hatten (die Validierung lief jeden
    // Katalogtext durch den Schaetzer — diese Liste ist ihr Ergebnis).
    muscleups: { kcalPerRep: 1.75, type: "reps" },
    wallballs: { kcalPerRep: 0.65, type: "reps" },
    pushpresses: { kcalPerRep: 0.62, type: "reps" },
    shoulderpresses: { kcalPerRep: 0.5, type: "reps" },
    cleans: { kcalPerRep: 0.84, type: "reps" },
    jerks: { kcalPerRep: 0.68, type: "reps" },
    dumbbellsquatcleans: { kcalPerRep: 0.8, type: "reps" },
    dumbbellhangsquatcleans: { kcalPerRep: 0.78, type: "reps" },
    romaniandeadlifts: { kcalPerRep: 0.45, type: "reps" },
    burpeepullups: { kcalPerRep: 1.55, type: "reps" },
    strictburpeepullups: { kcalPerRep: 1.6, type: "reps" },
    burpeechesttobarpullups: { kcalPerRep: 1.65, type: "reps" },
    burpeemuscleups: { kcalPerRep: 2.6, type: "reps" },
    burpeebarmuscleups: { kcalPerRep: 2.45, type: "reps" },
    medballslams: { kcalPerRep: 0.5, type: "reps" },
    boxjumpovers: { kcalPerRep: 0.66, type: "reps" },
    burpeeboxjumpovers: { kcalPerRep: 1.2, type: "reps" },
    boxdips: { kcalPerRep: 0.35, type: "reps" },
    walkinglunges: { kcalPerRep: 0.34, type: "reps" },
    broadjumps: { kcalPerRep: 0.5, type: "reps" },
    burpeebroadjumps: { kcalPerRep: 1.25, type: "reps" },
    kettlebellsnatches: { kcalPerRep: 0.68, type: "reps" },
    squatcleanthrusters: { kcalPerRep: 1.3, type: "reps" },
    dumbbellsquatcleanthrusters: { kcalPerRep: 1.15, type: "reps" },
    shouldertooverheads: { kcalPerRep: 0.68, type: "reps" },
    singlearmdumbbellthrusters: { kcalPerRep: 0.72, type: "reps" },
    benchpresses: { kcalPerRep: 0.52, type: "reps" },
    shuttlerun: { kcalPerRep: 4.5, type: "shuttle" },
    shuttlesprints: { kcalPerRep: 4.5, type: "shuttle" },
    sprints: { kcalPerRep: 4.5, type: "shuttle" },

    // Movement-Pool-Erweiterung 24.08.2026: die Movements der ~25 nachgezogenen
    // Hero-WODs (Forrest, Joshie, Arnie, Kevin, Tama ...) plus die Namen, die
    // nur in deren Katalogtexten stehen. Raten analog zu den Nachbarn oben.
    lpullups: { kcalPerRep: 0.7, type: "reps" },
    weightedpullups: { kcalPerRep: 0.68, type: "reps" },
    ringpushups: { kcalPerRep: 0.48, type: "reps" },
    ringhandstandpushups: { kcalPerRep: 1.1, type: "reps" },
    bearcrawl: { kcalPerMeter: 0.3, type: "distance" },
    dumbbelldeadlifts: { kcalPerRep: 0.5, type: "reps" },
    dumbbellsplitcleans: { kcalPerRep: 0.75, type: "reps" },
    dumbbellhangsplitsnatches: { kcalPerRep: 0.72, type: "reps" },
    dumbbellpowersnatches: { kcalPerRep: 0.72, type: "reps" },
    dumbbellburpeedeadlifts: { kcalPerRep: 1.25, type: "reps" },
    kettlebellthrusters: { kcalPerRep: 0.75, type: "reps" },
    singlearmkettlebellthrusters: { kcalPerRep: 0.7, type: "reps" },
    medicineballcleans: { kcalPerRep: 0.55, type: "reps" },
    barbellstepups: { kcalPerRep: 0.42, type: "reps" },
    frontrackweightedlunges: { kcalPerRep: 0.42, type: "reps" },
    overheadwalkinglunges: { kcalPerRep: 0.48, type: "reps" },
    plateoverheadwalkinglunges: { kcalPerRep: 0.48, type: "reps" },
    hanginghiptouches: { kcalPerRep: 0.35, type: "reps" },
    forwardrolls: { kcalPerRep: 0.45, type: "reps" },
    ringlowers: { kcalPerRep: 0.6, type: "reps" },
    strictringdips: { kcalPerRep: 0.55, type: "reps" },
    wallballtwoforones: { kcalPerRep: 0.85, type: "reps" },
    freestandinghandstandpushups: { kcalPerRep: 1.1, type: "reps" },
    lsitropeclimbs: { kcalPerRep: 6.5, type: "reps" },
    waiterscarry: { kcalPerMeter: 0.35, type: "distance" },
    kettlebelloverheadcarry: { kcalPerMeter: 0.38, type: "distance" },
    kettlebellfrontrackcarry: { kcalPerMeter: 0.32, type: "distance" }
  };

  function normalizeMovementName(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[’']/g, "")
      .replace(/\+/g, " ")
      .replace(/\//g, " ")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "");
  }

  function getMovementData(name) {
    const key = normalizeMovementName(name);
    // Einzahl faellt auf die Mehrzahl zurueck ("1 Rope Climb" -> ropeclimbs,
    // "Dumbbell Hang Snatch" -> ...snatches)
    return MOVEMENT_DATA[key] || MOVEMENT_DATA[key + "s"] || MOVEMENT_DATA[key + "es"] || null;
  }

  function getProfileData() {
    try {
      const profile = JSON.parse(localStorage.getItem("profile") || "{}");

      const rawWeight = Number(profile.weightKg || profile.weight || 0);
      const rawHeight = Number(profile.heightCm || profile.height || 0);
      const rawGender = profile.gender;
      const rawAge    = Number(profile.age || profile.ageYears || 0);

      const usedFallbackWeight = !Number.isFinite(rawWeight) || rawWeight <= 0;
      const usedFallbackHeight = !Number.isFinite(rawHeight) || rawHeight <= 0;
      const usedFallbackGender = !rawGender;
      const usedFallbackAge    = !Number.isFinite(rawAge) || rawAge < 14;

      const rawRestingHr    = Number(profile.restingHr || 0);
      const rawMaxHr        = Number(profile.maxHr || 0);
      const rawTrainingLevel = profile.trainingLevel || "regular";

      return {
        weightKg: usedFallbackWeight ? 75 : rawWeight,
        heightCm: usedFallbackHeight ? 175 : rawHeight,
        gender:   rawGender || "male",
        age:      usedFallbackAge ? 30 : rawAge,
        restingHr:     rawRestingHr >= 30 ? rawRestingHr : 0,
        maxHr:         rawMaxHr >= 120 ? rawMaxHr : 0,
        trainingLevel: rawTrainingLevel,

        usedFallbackWeight,
        usedFallbackHeight,
        usedFallbackGender,
        usedFallbackAge,
        profileIncomplete:
          usedFallbackWeight ||
          usedFallbackHeight ||
          usedFallbackGender ||
          usedFallbackAge
      };
    } catch (err) {
      return {
        weightKg: 75,
        heightCm: 175,
        gender: "male",
        age: 30,
        restingHr: 0,
        maxHr: 0,
        trainingLevel: "regular",

        usedFallbackWeight: true,
        usedFallbackHeight: true,
        usedFallbackGender: true,
        usedFallbackAge: true,
        profileIncomplete: true
      };
    }
  }

  function getBodyFactor(profile) {
    const weightKg = Number(profile?.weightKg || 0);
    const gender   = profile?.gender || "male";
    const age      = Number(profile?.age || 30);

    // Sublinear weight scaling relative to 75 kg reference athlete.
    // 60 kg → ~0.86, 75 kg → 1.00, 90 kg → 1.13, 110 kg → 1.27
    const weightFactor = weightKg > 0
      ? Math.pow(weightKg / 75, 0.75)
      : 1;

    // Women burn ~13% fewer calories at equal body weight due to body composition.
    const genderFactor = gender === "female" ? 0.87 : 1.0;

    // Metabolic rate declines ~0.5 % per year after age 30.
    // Age 20 → 1.05, Age 30 → 1.00, Age 45 → 0.93, Age 60 → 0.85
    const ageFactor = age > 0
      ? Math.max(0.75, 1.0 - Math.max(0, age - 30) * 0.005)
      : 1.0;

    return Math.max(0.70, Math.min(1.50, weightFactor * genderFactor * ageFactor));
  }

  // For-Time intensity adjustment: same reps done faster = higher HR + EPOC = more kcal.
  // Uses kcal/min rate as a proxy for relative effort intensity.
  // Adjustments are intentionally modest (±12%) to avoid over-correction.
  function applyIntensityAdjustment(calories, durationMinutes) {
    if (!durationMinutes || durationMinutes <= 0 || !calories || calories <= 0) return calories;
    const kcalPerMin = calories / durationMinutes;
    let mult;
    if      (kcalPerMin > 22) mult = 1.12;
    else if (kcalPerMin > 16) mult = 1.06;
    else if (kcalPerMin > 10) mult = 1.00;
    else if (kcalPerMin >  6) mult = 0.96;
    else                      mult = 0.92;
    return calories * mult;
  }

  // Sled load weight scales calories significantly.
  // Base rate calibrated for unloaded sled + bodyweight; each kg of load adds friction work.
  function sledCaloriesFromMeters(meters, loadKg, baseRate) {
    const m = Number(meters || 0);
    if (m <= 0) return 0;
    const load = Number(loadKg || 0);
    // 0 kg load = base rate; 100 kg load ≈ +60%; 150 kg ≈ +80%
    const loadScale = 1 + Math.min(load, 200) * 0.008;
    return m * baseRate * loadScale;
  }

  // Carry load scaling: gentler than sled (no surface friction, but load still increases effort).
  // 40 kg total → ×1.16; 80 kg → ×1.32; max at 120 kg → ×1.48.
  function carryCaloriesFromMeters(meters, loadKg, baseRate) {
    const m = Number(meters || 0);
    if (m <= 0) return 0;
    const load = Number(loadKg || 0);
    const loadScale = 1 + Math.min(load, 120) * 0.004;
    /* Die Rate ist fuer kurze, schwere Strecken kalibriert (30-100 m).
       Lange Traegereien (Hero-Katalog: 400 m Sandbag, 1600 m Farmer's)
       laufen im Gehtempo — jenseits von 100 m zaehlt der Meter nur noch
       gut ein Drittel, sonst kaeme ein 400-m-Carry auf Sprint-Kalorien. */
    const effektiv = Math.min(m, 100) + Math.max(0, m - 100) * 0.35;
    return effektiv * baseRate * loadScale;
  }

  function extractSledLoadKgFromLine(line) {
    const raw = String(line || "");
    // Handles ", 80 kg" and "@ 80 kg" and "@ 80 / 60 kg" (takes first weight)
    let match = raw.match(/[,@]\s*([\d.,]+)\s*(?:\/\s*[\d.,]+\s*)?kg\b/i);
    if (match) return parseNumber(match[1]);
    return null;
  }

  function htmlToText(html) {
    const raw = String(html || "");
    if (!raw.trim()) return "";

    const temp = document.createElement("div");
    temp.innerHTML = raw;

    // BRs direkt in Newlines umwandeln
    temp.querySelectorAll("br").forEach(br => {
      br.replaceWith("\n");
    });

    // Divs in eigene Zeilen umwandeln
    temp.querySelectorAll("div").forEach(div => {
      const text = div.textContent || "";
      div.replaceWith(text + "\n");
    });

    // Sicherheit: mehrfache Leerzeichen bereinigen,
    // aber Newlines erhalten
    return temp.textContent
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim();
  }

  function normalizeTextDashes(text) {
    // Benchmark WODs use typographic en-dashes (–) in rep schemes like "21–15–9".
    // Also normalize curly apostrophes ('‘’) → straight apostrophe (')
    // so patterns like "Farmer's Carry" match regardless of quote style.
    return String(text || "")
      .replace(/[–—]/g, "-")
      .replace(/[‘’]/g, "'");
  }

  function normalizeAtWeightNotation(text, gender) {
    // Converts "Movement @ 42.5 / 30 kg" → "Movement, 42.5 kg" (male)
    //                                     → "Movement, 30 kg"   (female)
    // This allows the existing ", X kg" calorie-weighting logic to pick up the load.
    return String(text || "").replace(
      /(@\s*)([\d.,]+)\s*\/\s*([\d.,]+)\s*kg\b/gi,
      (_, _at, maleKg, femaleKg) => {
        const kg = gender === "female" ? femaleKg : maleKg;
        return `, ${kg} kg`;
      }
    ).replace(
      // Also handle single-weight: "Movement @ 42.5 kg"
      /@\s*([\d.,]+)\s*kg\b/gi,
      (_, kg) => `, ${kg} kg`
    );
  }

  function getWorkoutText(log, gender) {
    let text = "";
    if (log?.workoutHtml) text = htmlToText(log.workoutHtml);
    else if (log?.workoutText) text = String(log.workoutText);
    text = normalizeTextDashes(text);
    text = normalizeAtWeightNotation(text, gender);
    // Strip the Scaled section (and anything after it) – benchmark WODs include a scaled
    // variant after the Rx section that would otherwise cause movements to be counted twice.
    text = text.replace(/\n[\s]*Scaled[\s]*:[\s\S]*/i, "");
    return text;
  }

  function getDurationMinutesFromLog(log) {
    if (!log || !log.resultType || !log.result) return null;

    if (log.resultType === "time" || log.resultType === "capped") {
      const seconds = Number(log.result.timeSeconds || 0);
      if (seconds > 0) return seconds / 60;
    }

    const text = getWorkoutText(log);

    if (log.resultType === "rounds_reps" || log.resultType === "emom") {
      let match = text.match(/AMRAP\s+(\d+)\s*min/i);
      if (match) return Number(match[1]);

      match = text.match(/E\d*MOM\s+(\d+)\s*min/i);
      if (match) return Number(match[1]);

      // Feste Uhr ohne AMRAP-Kopf ("Auf 23-min-Uhr (TC 23 min)"): der TC ist
      // die Dauer — ohne diesen Zweig fand die Rueckfall-Schaetzung nichts.
      match = text.match(/TC\s+(\d+)\s*min/i);
      if (match) return Number(match[1]);
    }

    /* Death By laeuft in Ein-Minuten-Runden: wer Runde 12 geschafft hat, war
       12 Minuten in Arbeit (plus die angebrochene 13., die wir grosszuegig
       nicht mitzaehlen). Die Rundenzahl IST also die Dauer. */
    if (log.resultType === "deathby") {
      const rounds = Number(log.result.rounds || 0);
      if (rounds > 0) return rounds;
    }

    /* For Distance wird ueber die Strecke gewertet, fuer die Kalorien zaehlt
       aber die Dauer: entweder eingetragen oder aus der Aufgabe
       ("20 min For Distance"). */
    if (log.resultType === "distance") {
      const seconds = Number(log.result.timeSeconds || 0);
      if (seconds > 0) return seconds / 60;

      const match = text.match(/(\d+)\s*min\s*For\s*Distance/i);
      if (match) return Number(match[1]);
    }

    if (log.wodType === "chipper") {
      const match = text.match(/TC\s+(\d+)\s*min/i);
      if (match) return Number(match[1]);
    }

    /* Kraft-Session aus dem Plan: die Dauer steht direkt im Ergebnis (vom
       Nutzer bestaetigt oder aus der Session-Struktur geschaetzt). Ohne diesen
       Zweig faende die HR-Auswertung keine Dauer und ein getragener Pulsgurt
       bliebe wirkungslos — die Messung soll aber immer die Schaetzung schlagen. */
    if (log.resultType === "strength_sets") {
      const minutes = Number(log.result.durationMinutes || 0);
      if (minutes > 0) return minutes;
    }

    /* Und fuer BESTANDSLOGS: bis zum 28.08.2026 trug kein Strongman-Log ein
       Zeitgeruest. Seine Dauer steht aber seit jeher in der Fusszeile der
       Karte ("22 Minuten inklusive der vorgeschriebenen Pausen",
       strongman-pools.js: textAus). Damit bekommt auch jedes Altlog eine
       Dauer — und damit einen Kalorienwert statt einer Null. */
    const smFuss = text.match(/(\d+)\s*Minuten\s+inklusive/i);
    if (smFuss) return Number(smFuss[1]);

    /* Strongman: die Dauer steht im Zeitgeruest des Bauplans und NICHT im
       Ergebnis — der Strongman hat keinen Timer, der die Uhr anhaelt, und
       das Log-Sheet fragt nur Gewichte ab (resultType "oly"). Ohne diesen
       Zweig fand hier gar nichts eine Dauer: weder die HR-Rechnung, die
       einen getragenen Pulsgurt erst wirksam macht, noch der Rueckfall.
       Steht ABSICHTLICH ausserhalb der resultType-Pruefungen — das
       Zeitgeruest haengt am Workout, nicht am Ergebnistyp. */
    if (log.strongman && Number(log.strongman.dauerMin || 0) > 0) {
      return Number(log.strongman.dauerMin);
    }

    return null;
  }

  function parseNumber(value) {
    const cleaned = String(value || "").replace(",", ".").trim();
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }

  function getRoundMultiplier(text) {
    const raw = String(text || "");

    let match = raw.match(/(\d+)\s+Rounds?\s+For\s+Time/i);
    if (match) return Number(match[1]);

    match = raw.match(/(\d+)\s+Rounds?/i);
    if (match) return Number(match[1]);

    return 1;
  }

  function getLineMultiplier(line, section, roundMultiplier) {
    const rawLine = String(line || "").trim().toUpperCase();
    const rawSection = String(section || "").trim().toUpperCase();

    if (rawSection === "BUY-IN" || rawSection === "CASH-OUT") {
      return 1;
    }

    if (rawLine.startsWith("BUY-IN") || rawLine.startsWith("CASH-OUT")) {
      return 1;
    }

    return roundMultiplier;
  }

  function extractClassicRepSchemeEntries(text, profile) {
    const raw = String(text || "");
    const lines = raw.split(/\n+/).map(line => line.trim()).filter(Boolean);

    const repSchemeLine = lines.find(line => /^\d+(?:-\d+)+$/.test(line));
    if (!repSchemeLine) return [];

    const reps = repSchemeLine
      .split("-")
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value > 0);

    if (!reps.length) return [];

    const totalReps = reps.reduce((sum, value) => sum + value, 0);
    const entries = [];

    lines.forEach(line => {
      if (line === repSchemeLine) return;
      if (/^for time$/i.test(line)) return;
      if (/^-{4,}$/.test(line)) return;

      const parsed = parseWorkoutLineCalories(`${totalReps} ${line}`, profile);
      if (!parsed || parsed.entryType === "rest") return;

      entries.push({
        source: parsed.movementName || parsed.raw,
        calories: parsed.calories,
        line,
        detail: `${repSchemeLine} ${line}`,
        entryType: parsed.entryType
      });
    });

    return entries;
  }

  function estimateRowCaloriesFromMeters(meters, weightKg) {
    const m = Number(meters || 0);
    if (m <= 0) return 0;
    // Concept2 PM calibrated for ~75 kg; heavier athletes do more mechanical work.
    // Sublinear scaling (^0.30) reflects that technique and drag dominate over mass.
    const wScale = weightKg > 0 ? Math.pow(weightKg / 75, 0.30) : 1;
    return m * 0.062 * wScale;
  }

  function estimateSkiCaloriesFromMeters(meters, weightKg) {
    const m = Number(meters || 0);
    if (m <= 0) return 0;
    const wScale = weightKg > 0 ? Math.pow(weightKg / 75, 0.30) : 1;
    return m * 0.058 * wScale;
  }

  function estimateBikeCaloriesFromMeters(meters) {
    const m = Number(meters || 0);
    if (m <= 0) return 0;
    return m * 0.018;
  }

  // Zeitbasiertes Cardio ("40s Ski", "30 sec Bike"). Auf den Ergometern gibt es
  // keine Meter, sondern nur die Arbeitsdauer — z. B. im EMOM. Wir rechnen mit
  // einer cal/min-Rate bei zuegigem Intervalltempo (75 kg Referenz). Ski/Row/Run
  // skalieren leicht mit dem Koerpergewicht wie die Meter-Modelle; die Bike-Watt
  // ist gewichtsunabhaengig kalibriert.
  function estimateCardioCaloriesFromSeconds(seconds, machine, weightKg) {
    const s = Number(seconds || 0);
    if (s <= 0) return 0;
    const perMin =
      machine === "bike" ? 15 :
      machine === "row"  ? 13 :
      machine === "run"  ? 14 :
      12; // ski
    const wScale =
      machine !== "bike" && weightKg > 0 ? Math.pow(weightKg / 75, 0.30) : 1;
    return (perMin * s / 60) * wScale;
  }

  function extractDirectCalorieEntries(text, roundMultiplier) {
    const raw = String(text || "");
    const lines = raw.split(/\n+/).map(line => line.trim()).filter(Boolean);
    const entries = [];

    let currentSection = "";

    lines.forEach(line => {
      const upper = line.toUpperCase();

      if (upper.startsWith("BUY-IN")) {
        currentSection = "BUY-IN";
        return;
      }

      if (upper.startsWith("CASH-OUT")) {
        currentSection = "CASH-OUT";
        return;
      }

      const match = line.match(/(\d+(?:[.,]\d+)?)\s*(cal|cals|calories)\s*(bike|row|ski)?/i);
      if (!match) return;

      const type = line.toLowerCase();
      const effectiveMultiplier = getLineMultiplier(line, currentSection, roundMultiplier);

      entries.push({
        source: type.includes("bike")
          ? "bikeCalories"
          : type.includes("row")
            ? "rowCalories"
            : "skiCalories",
        calories: (parseNumber(match[1]) || 0) * effectiveMultiplier,
        line
      });
    });

    return entries;
  }

  function extractDistanceEntries(text, roundMultiplier, profile) {
    const raw = String(text || "");
    const lines = raw.split(/\n+/).map(line => line.trim()).filter(Boolean);
    const entries = [];
    let currentSection = "";

    lines.forEach(line => {
      const upper = line.toUpperCase();

      if (upper.startsWith("BUY-IN")) {
        currentSection = "BUY-IN";
        return;
      }

      if (upper.startsWith("CASH-OUT")) {
        currentSection = "CASH-OUT";
        return;
      }

      const effectiveMultiplier = getLineMultiplier(line, currentSection, roundMultiplier);

      let match = line.match(/(\d+(?:[.,]\d+)?)\s*m\s+Run\b/i);
      if (match) {
        const meters = parseNumber(match[1]) || 0;
        const km = meters / 1000;
        const calories = km * (profile.weightKg || 75) * 1.0;

        entries.push({
          source: "runDistance",
          calories: calories * effectiveMultiplier,
          line,
          detail: `${meters} m Run`
        });
      }

      match = line.match(/(\d+(?:[.,]\d+)?)\s*km\s+Run\b/i);
      if (match) {
        const km = parseNumber(match[1]) || 0;
        const calories = km * (profile.weightKg || 75) * 1.0;

        entries.push({
          source: "runDistance",
          calories: calories * effectiveMultiplier,
          line,
          detail: `${km} km Run`
        });
      }

      match = line.match(/(\d+(?:[.,]\d+)?)\s*m\s+Row\b/i);
      if (match) {
        const meters = parseNumber(match[1]) || 0;

        entries.push({
          source: "rowDistance",
          calories: estimateRowCaloriesFromMeters(meters, profile?.weightKg) * effectiveMultiplier,
          line,
          detail: `${meters} m Row`
        });
      }

      match = line.match(/(\d+(?:[.,]\d+)?)\s*m\s+Ski\s*Erg\b/i);
      if (match) {
        const meters = parseNumber(match[1]) || 0;

        entries.push({
          source: "skiDistance",
          calories: estimateSkiCaloriesFromMeters(meters, profile?.weightKg) * effectiveMultiplier,
          line,
          detail: `${meters} m SkiErg`
        });
      }

      match = line.match(/(\d+(?:[.,]\d+)?)\s*m\s+Bike\b/i);
      if (match) {
        const meters = parseNumber(match[1]) || 0;

        entries.push({
          source: "bikeDistance",
          calories: estimateBikeCaloriesFromMeters(meters) * effectiveMultiplier,
          line,
          detail: `${meters} m Bike`
        });
      }

      match = line.match(/(\d+(?:[.,]\d+)?)\s*m\s+Farmer'?s\s+Carry\b/i);
      if (match) {
        const meters = parseNumber(match[1]) || 0;
        const loadKg = extractSledLoadKgFromLine(line);

        entries.push({
          source: "farmersCarryDistance",
          calories: carryCaloriesFromMeters(meters, loadKg, 0.32) * effectiveMultiplier,
          line,
          detail: `${meters} m Farmer’s Carry`
        });
      }

      match = line.match(/(\d+(?:[.,]\d+)?)\s*m\s+Sandbag\s+Carry\b/i);
      if (match) {
        const meters = parseNumber(match[1]) || 0;
        const loadKg = extractSledLoadKgFromLine(line);

        entries.push({
          source: "sandbagCarryDistance",
          calories: carryCaloriesFromMeters(meters, loadKg, 0.34) * effectiveMultiplier,
          line,
          detail: `${meters} m Sandbag Carry`
        });
      }

      match = line.match(/(\d+(?:[.,]\d+)?)\s*m\s+Sled\s+Push\b/i);
      if (match) {
        const meters = parseNumber(match[1]) || 0;
        const loadKg = extractSledLoadKgFromLine(line);

        entries.push({
          source: "sledPushDistance",
          calories: sledCaloriesFromMeters(meters, loadKg, 0.55) * effectiveMultiplier,
          line,
          detail: `${meters} m Sled Push`
        });
      }

      match = line.match(/(\d+(?:[.,]\d+)?)\s*m\s+Sled\s+Pull\b/i);
      if (match) {
        const meters = parseNumber(match[1]) || 0;
        const loadKg = extractSledLoadKgFromLine(line);

        entries.push({
          source: "sledPullDistance",
          calories: sledCaloriesFromMeters(meters, loadKg, 0.5) * effectiveMultiplier,
          line,
          detail: `${meters} m Sled Pull`
        });
      }
    });

    return entries;
  }

  function extractRepEntries(text, roundMultiplier, profile) {
    const raw = String(text || "");
    const lines = raw.split(/\n+/).map(line => line.trim()).filter(Boolean);
    const entries = [];
    const bodyFactor = getBodyFactor(profile);

    Object.keys(MOVEMENT_DATA).forEach(key => {
      const movement = MOVEMENT_DATA[key];

      if (movement.type !== "reps" && movement.type !== "shuttle") return;

      lines.forEach(line => {
        if (/cal\s+/i.test(line)) return;
        if (/\bm\b/.test(line) && !/wall walk/i.test(line)) return;
        if (/^AMRAP\b/i.test(line)) return;
        if (/^E\d*MOM\b/i.test(line)) return;
        if (/^BUY-IN\b/i.test(line)) return;
        if (/^CASH-OUT\b/i.test(line)) return;

        const normalizedLine = normalizeMovementName(line);

        if (!normalizedLine.includes(key)) return;

        const numberMatch = line.match(/(\d+(?:[.,]\d+)?)/);
        if (!numberMatch) return;

        const reps = parseNumber(numberMatch[1]) || 0;
        if (reps <= 0) return;

        let kcal = 0;

        if (movement.type === "reps") {
          kcal = reps * movement.kcalPerRep * roundMultiplier * bodyFactor;
        } else if (movement.type === "shuttle") {
          kcal = reps * movement.kcalPerRep * roundMultiplier * bodyFactor;
        }

        entries.push({
          source: key,
          calories: kcal,
          line,
          detail: `${reps} reps`
        });
      });
    });

    return entries;
  }
function getOlyExerciseBaseKcalPerRep(name) {
  const normalized = normalizeMovementName(name);

  const table = {
    snatchbalance: 0.75,
    snatchpull: 0.55,
    highhangpowersnatch: 0.72,
    squatsnatch: 0.9,
    overheadsquat: 0.72,
    musclecleanfrontsquat: 0.82,
    cleanpull: 0.58,
    powerclean: 0.75,
    squatclean: 0.9,
    cleanjerk: 1.0,
    cleanandjerk: 1.0,
    tallsnatch: 0.5,
    hangsquatsnatch: 0.82,
    backsquat: 0.62,
    tempooverheadsquat: 0.78,
    snatchpushpress: 0.68,
    pushjerk: 0.72,
    frontsquat: 0.66,

    powersnatch: 0.72,
    hangpowersnatch: 0.68,
    snatch: 0.75,
    muscleclean: 0.62,
    frontsquatfull: 0.66
  };

  return table[normalized] || 0.68;
}

function getOlyHeavyKcalPerRep(name, weightKg) {
  const normalized = normalizeMovementName(name);

  // ===== Referenzwerte =====
  const referenceByMovement = {
    backsquat: 100,
    frontsquat: 80,
    overheadsquat: 60,

    powerclean: 60,
    squatclean: 70,
    cleanandjerk: 75,
    cleanjerk: 75,

    powersnatch: 45,
    squatsnatch: 55,

    snatchpull: 85,
    cleanpull: 100,

    musclecleanfrontsquat: 50,
    hangpowersnatch: 45,
    hangsquatsnatch: 55,

    snatchbalance: 50,
    snatchpushpress: 50,
    pushjerk: 60,

    tempooverheadsquat: 55
  };

  const reference = referenceByMovement[normalized];
  if (!reference) return null;

  // Verhältnis Gewicht zu Referenz
  let ratio = weightKg / reference;

  // Begrenzen, damit es nicht explodiert
  ratio = Math.max(0.4, Math.min(1.8, ratio));

  // ===== Neue konservativere kcal/rep Kurven =====

  // 🟢 Squats (stabil, aber nicht übertrieben)
  if (["backsquat", "frontsquat", "overheadsquat", "tempooverheadsquat"].includes(normalized)) {
    return 0.5 + (ratio * 0.5);
    // ~0.7 bei 60kg → ~1.1 bei 140kg
  }

  // 🔵 Pulls (deutlich günstiger!)
  if (["snatchpull", "cleanpull"].includes(normalized)) {
    return 0.35 + (ratio * 0.35);
    // bewusst niedrig gehalten
  }

  // 🟡 Komplexe Lifts (Clean, Snatch etc.)
  if ([
    "powerclean",
    "squatclean",
    "cleanandjerk",
    "cleanjerk",
    "powersnatch",
    "squatsnatch"
  ].includes(normalized)) {
    return 0.6 + (ratio * 0.6);
    // Haupttreiber
  }

  // 🟠 Kombinationen / Technik + Kraft
  if ([
    "musclecleanfrontsquat",
    "hangpowersnatch",
    "hangsquatsnatch"
  ].includes(normalized)) {
    return 0.55 + (ratio * 0.5);
  }

  // 🟣 Stabilisation / Support
  if ([
    "snatchbalance",
    "snatchpushpress",
    "pushjerk"
  ].includes(normalized)) {
    return 0.5 + (ratio * 0.45);
  }

  // Fallback
  return 0.6 + (ratio * 0.5);
}

function getOlyEstimatedRepsForExercise(name) {
  const raw = String(name || "");

  if (/E\d*MOM\s*10/i.test(raw)) return 10;
  if (/E2MOM\s*10/i.test(raw)) return 5;
  if (/E2MOM\s*12/i.test(raw)) return 6;

  const normalized = normalizeMovementName(raw);

  const repMap = {
    snatchbalance: 15,
    snatchpull: 12,
    highhangpowersnatch: 10,
    squatsnatch: 10,
    overheadsquat: 25,
    musclecleanfrontsquat: 20,
    cleanpull: 12,
    powerclean: 10,
    squatclean: 10,
    cleanandjerk: 12,
    cleanjerk: 12,
    tallsnatch: 15,
    hangsquatsnatch: 10,
    backsquat: 25,
    tempooverheadsquat: 12,
    snatchpushpress: 15,
    pushjerk: 15,
    frontsquat: 20
  };

  return repMap[normalized] || 12;
}

function extractOlyRepsFromWorkoutText(text, exerciseName) {
  const raw = String(text || "");
  const normalizedName = normalizeMovementName(exerciseName);

  const lines = raw.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.toLowerCase().includes(exerciseName.toLowerCase())) continue;

    const nextLine = lines[i + 1] || "";

    // ===== 4 x 4 =====
    let match = nextLine.match(/(\d+)\s*x\s*(\d+)/i);
    if (match) {
      return Number(match[1]) * Number(match[2]);
    }

    // ===== 5 x (2+2) =====
    match = nextLine.match(/(\d+)\s*x\s*\(([^)]+)\)/i);
    if (match) {
      const sets = Number(match[1]);

      const repsPerSet = match[2]
        .split("+")
        .map(n => Number(n.replace(",", ".").trim()))
        .filter(n => Number.isFinite(n) && n > 0)
        .reduce((sum, n) => sum + n, 0);

      if (sets > 0 && repsPerSet > 0) {
        return sets * repsPerSet;
      }
    }

    // ===== 6 x 2 ===== fallback =====
    match = nextLine.match(/(\d+)\s*x\s*(\d+)/i);
    if (match) {
      return Number(match[1]) * Number(match[2]);
    }
  }

  return null;
}

function extractOlyIntensityMultiplierFromWorkoutText(text, exerciseName) {
  const raw = String(text || "");
  const exercise = String(exerciseName || "").trim();

  if (!raw || !exercise) return 1;

  const lines = raw
    .split("\n")
    .map(line => line.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (!line.toLowerCase().includes(exercise.toLowerCase())) continue;

    const nextLine = String(lines[i + 1] || "").trim();

    // ===== E2MOM / EMOM detection =====
    const currentLine = line;

    // EMOM / E2MOM sind meist moderat bis technisch schwer,
    // aber sie dürfen hier KEINE Reps zurückgeben.
    // Nur ein kleiner Intensitätsbonus.
    if (/E2MOM\s*\d+/i.test(currentLine)) {
      return 1.06;
    }

    if (/E\d*MOM\s*\d+/i.test(currentLine)) {
      return 1.04;
    }
    if (!nextLine) return 1;

    const percentMatches = [...nextLine.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)];
    if (!percentMatches.length) return 1;

    const percents = percentMatches
      .map(match => Number(String(match[1]).replace(",", ".")))
      .filter(value => Number.isFinite(value));

    if (!percents.length) return 1;

    const avgPercent =
      percents.reduce((sum, value) => sum + value, 0) / percents.length;

    // Basis 70% = 1.0
    // darunter etwas leichter, darüber progressiv höher
    const ratio = avgPercent / 70;

    const multiplier = 0.9 + (Math.pow(Math.max(0.5, ratio), 1.15) * 0.22);

    return Math.max(0.88, Math.min(1.35, multiplier));
  }

  return 1;
}

function estimateOlyCaloriesFromResult(log, profile) {
  const exercises = Array.isArray(log?.result?.exercises)
    ? log.result.exercises
    : [];

  if (!exercises.length) return null;

  const weightedExercises = exercises.filter(ex => {
    const weightKg = Number(ex?.weight || 0);
    return ex?.name && Number.isFinite(weightKg) && weightKg > 0;
  });

  if (!weightedExercises.length) return null;

  const bodyFactor = getBodyFactor(profile);
  const workoutText = getWorkoutText(log, profile?.gender);
  let total = 0;

  weightedExercises.forEach(ex => {
    const name = ex?.name || "";
    const weightKg = Number(ex?.weight || 0);

    if (!name || !Number.isFinite(weightKg) || weightKg <= 0) return;

    const estimatedReps =
      extractOlyRepsFromWorkoutText(workoutText, name) ||
      getOlyEstimatedRepsForExercise(name);

    const intensityMultiplier =
      extractOlyIntensityMultiplierFromWorkoutText(workoutText, name);

    const heavyKcalPerRep = getOlyHeavyKcalPerRep(name, weightKg);

    if (heavyKcalPerRep !== null) {
      total += estimatedReps * heavyKcalPerRep * bodyFactor * intensityMultiplier;
      return;
    }

    const baseKcalPerRep = getOlyExerciseBaseKcalPerRep(name);
    const weightMultiplier = getWeightedCaloriesMultiplier(name, weightKg, profile);

    total +=
      estimatedReps *
      baseKcalPerRep *
      bodyFactor *
      intensityMultiplier *
      weightMultiplier;
  });

  // Technik-/Warm-up-/Setup-Komponente für OLY Sessions
  const sessionFloor = Math.max(12, weightedExercises.length * 8) * bodyFactor;
  total += sessionFloor;

  return {
    calories: Math.round(total),
    durationMinutes: null,
    method: "oly_estimated_from_weights"
  };
}

function getStrengthBenchmarkType(log) {
  const workoutName = String(log?.workoutName || "").toLowerCase();
  const text = getWorkoutText(log).toLowerCase();
  const resultType = String(log?.resultType || "").toLowerCase();

  /* BEIDE SCHREIBWEISEN. Das WOD heisst seit dem 27.08.2026 nur noch "TOTAL"
     beziehungsweise "TOTAL II" — der Markenname ist raus. Bestandslogs der
     Nutzer tragen aber weiter "CROSSFIT TOTAL", und ihre Kalorienschaetzung
     darf davon nicht abhaengen. Deshalb erkennt der Abgleich beides.

     Der TEXT-Weg braucht dafuer einen eigenen Anker: `text.includes("total")`
     waere zu weit (das Wort steht auch in anderen Beschreibungen), deshalb
     wird die ZEILE geprueft, die mit "total" beginnt — im Vorlagentext ist
     das die Ueberschrift. "total ii" faengt der Block darueber vorher ab. */
  const zeileBeginntMit = (was) => new RegExp("^\\s*" + was + "\\b", "m").test(text);

  if (
    workoutName.includes("crossfit total ii") ||
    workoutName.includes("total ii") ||
    workoutName.includes("total 2") ||
    text.includes("crossfit total ii") ||
    text.includes("total ii") ||
    zeileBeginntMit("total 2")
  ) {
    return "total2";
  }

  if (
    workoutName.includes("crossfit total") ||
    workoutName === "total" ||
    text.includes("crossfit total") ||
    zeileBeginntMit("total")
  ) {
    return "total1";
  }

  if (
    workoutName.includes("gwen") ||
    text.includes("gwen") ||
    (resultType === "load" && String(log?.result?.exercise || "").toLowerCase() === "gwen")
  ) {
    return "gwen";
  }

  return null;
}

function getStrengthLiftBaseKcalPerRep(liftName) {
  const normalized = normalizeMovementName(liftName);

  const table = {
    backsquat: 1.05,
    frontsquat: 0.98,
    deadlift: 1.1,
    deadlifts: 1.1,
    shoulderpress: 0.72,
    pushpress: 0.8,
    benchpress: 0.82,
    clean: 1.0,
    powerclean: 0.95,
    squatclean: 1.02,
    cleanandjerk: 1.08,
    cleanjerk: 1.08
  };

  return table[normalized] || 0.9;
}

function getStrengthLoadMultiplier(liftName, loadKg, profile) {
  if (!Number.isFinite(loadKg) || loadKg <= 0) return 1;

  const normalized = normalizeMovementName(liftName);
  const athleteWeight = Number(profile?.weightKg || 0);

  const referenceByLift = {
    backsquat: 100,
    frontsquat: 85,
    deadlift: 120,
    deadlifts: 120,
    shoulderpress: 50,
    pushpress: 60,
    benchpress: 80,
    clean: 75,
    powerclean: 70,
    squatclean: 75,
    cleanandjerk: 80,
    cleanjerk: 80
  };

  const reference = referenceByLift[normalized] || 70;

  let ratio = loadKg / reference;

  if (athleteWeight > 0) {
    const relativeToBodyweight = loadKg / athleteWeight;
    ratio *= 0.92 + Math.min(0.3, relativeToBodyweight * 0.12);
  }

  const multiplier = 0.7 + (Math.pow(Math.max(0.2, ratio), 1.12) * 0.9);
  return Math.max(0.75, Math.min(2.2, multiplier));
}

function estimateTotalBenchmarkCaloriesFromResult(log, profile) {
  const lifts = Array.isArray(log?.result?.lifts) ? log.result.lifts : [];
  if (!lifts.length) return null;

  const bodyFactor = getBodyFactor(profile);
  let total = 0;

  lifts.forEach(lift => {
    const name = String(lift?.name || "");
    const loadKg = Number(lift?.weight || 0);

    if (!name || !Number.isFinite(loadKg) || loadKg <= 0) return;

    const baseKcal = getStrengthLiftBaseKcalPerRep(name);
    const loadMultiplier = getStrengthLoadMultiplier(name, loadKg, profile);

    // Modell:
    // 3 schwere Attempts + ca. 8 Warm-up-Reps äquivalent
    // Heavy reps zählen stärker, Warm-up bewusst reduziert
    const heavyAttemptCalories = 3 * baseKcal * loadMultiplier * bodyFactor * 1.2;
    const warmupCalories = 8 * baseKcal * Math.max(0.72, loadMultiplier * 0.7) * bodyFactor * 0.55;

    total += heavyAttemptCalories + warmupCalories;
  });

  // kleiner Floor für Setup / Rest / Ramp-up
  total += 10 * bodyFactor;

  return {
    calories: Math.round(total),
    durationMinutes: null,
    method: "strength_total_estimated"
  };
}

function estimateGwenCaloriesFromResult(log, profile) {
  const loadKg = Number(log?.result?.loadKg || 0);
  if (!Number.isFinite(loadKg) || loadKg <= 0) return null;

  const bodyFactor = getBodyFactor(profile);

  // Gwen = 15-12-9 = 36 Reps
  const totalReps = 36;
  const baseKcalPerRep = 0.98;
  const loadMultiplier = getStrengthLoadMultiplier("cleanandjerk", loadKg, profile);

  let total = totalReps * baseKcalPerRep * loadMultiplier * bodyFactor;

  // Extra für Ermüdung, Bar Cycling, Pausen/Setup
  total += 8 * bodyFactor;

  return {
    calories: Math.round(total),
    durationMinutes: null,
    method: "gwen_load_estimated"
  };
}

function estimateStrengthBenchmarkCaloriesFromResult(log, profile) {
  const benchmarkType = getStrengthBenchmarkType(log);
  const resultType = String(log?.resultType || "").toLowerCase();

  if (
    (benchmarkType === "total1" || benchmarkType === "total2") &&
    resultType === "total" &&
    Array.isArray(log?.result?.lifts) &&
    log.result.lifts.length
  ) {
    return estimateTotalBenchmarkCaloriesFromResult(log, profile);
  }

  if (
    benchmarkType === "gwen" &&
    resultType === "load" &&
    Number(log?.result?.loadKg || 0) > 0
  ) {
    return estimateGwenCaloriesFromResult(log, profile);
  }

  return null;
}

// ===== KRAFT-SESSION AUS DEM PLAN (Saetze mit Pausen) =====
// Ein reiner Wiederholungs-Ansatz (kcalPerRep) taugt hier NICHT: er bildet nur
// die Hubarbeit ab und kaeme fuer 4x8 Bankdruecken auf ~25 kcal. Beim
// Krafttraining steckt aber der halbe Verbrauch in den Pausen — der Puls bleibt
// oben, die Nachbrennphase laeuft. Deshalb Arbeit und Pause GETRENNT bewerten.
//
// Werte je Minute fuer einen 75-kg-Referenzathleten; getBodyFactor() skaliert
// danach auf Gewicht/Geschlecht/Alter (wie bei allen anderen Schaetzern hier).
// Groessenordnung Gegenprobe: Kniebeuge 8 Wdh. @ 100 kg = ~4 kcal Hubarbeit in
// 30 s -> ~9 kcal/min mechanisch, mit Exzentrik und Stabilisation ~12.
const STRENGTH_WORK_KCAL_PER_MIN = { main: 12, secondary: 9, iso: 6 };
// Pause ist NICHT Ruheumsatz: nach einem schweren Satz laeuft der Puls noch
// hoch, nach Bizepscurls kaum. Deshalb ebenfalls nach Rolle gestaffelt.
const STRENGTH_REST_KCAL_PER_MIN = { main: 3.8, secondary: 3.2, iso: 2.6 };

/* =========================================================================
   STRONGMAN — eine Einheit, die zu zwei Dritteln aus vorgeschriebener Pause
   besteht.
   -------------------------------------------------------------------------
   WARUM EIN EIGENER WEG (nachgestellt in Node am 28.08.2026):

   Eine Strongman-Einheit traegt `wodType: "oly"` — das Log-Sheet fragt Gewicht
   je Uebung ab, und das passt. Fuer die Kalorien war es aber der falsche
   Zweig, gleich dreifach:

   1. `estimateOlyCaloriesFromResult` verlangt eingetragene GEWICHTE. Wer die
      Felder leer laesst — beim Strongman der Normalfall, Sandsack, Steine
      und Holds haben gar keine Zahl — bekam `null` zurueck, und
      `estimateFromLog` gab das HART weiter: 0 kcal, 0 XP.
   2. Auch mit Gewichten stimmte es nicht: `extractOlyRepsFromWorkoutText`
      sucht die Dosis in der Zeile NACH dem Uebungsnamen ("Back Squat" /
      "5 x 3"). Im Strongman steht die Zahl VOR dem Namen und die Rundenzahl
      in einer Kopfzeile darueber. Gemessen an einem E2MOM ueber 22 Minuten:
      25 kcal.
   3. `getDurationMinutesFromLog` hatte fuer resultType "oly" keinen Zweig.
      Ohne Dauer scheitert auch die HR-Rechnung — ein getragener Pulsgurt
      blieb damit wirkungslos, obwohl die Messung die Schaetzung immer
      schlagen soll.

   WIE HIER GERECHNET WIRD. Der Generator gibt sein Zeitgeruest mit
   (`log.strongman`, aus strongman-pools.js): je Uebung die Dosis und die
   Klasse, dazu Arbeits- und Pausenzeit der ganzen Session. Daraus:

   - Jede Uebung mit bekannter Dosis geht durch die Bewegungstabelle oben.
     Das ist der Punkt, an dem die Strongman-Werte vom 27.08.2026 endlich
     wirken: 20 m Sled Push kosten mehr als 20 m Suitcase Carry.
   - Wo es keine Dosis GIBT ("so viele Wiederholungen wie moeglich"), traegt
     eine Rate je Klasse.
   - Alles, was von der Gesamtdauer uebrig bleibt, ist Pause — und zwar
     einschliesslich der Umbauzeit: der Pool veranschlagt je Runde mehr
     Arbeitszeit, als die Wiederholungen selbst dauern, und diese Differenz
     ist Aufstellen und Zurechtruecken, nicht Arbeit. Sie zur Arbeit zu
     zaehlen waere genau der Fehler, wegen dem der Dauer-Rueckfall 120 bis
     140 Prozent zu hoch lag.
   ========================================================================= */

/* Nur fuer den Fall OHNE Dosis. Die Zahlen sind aus der Tabelle oben
   zurueckgerechnet, nicht neu erfunden: 0,32 kcal je Meter Farmer's Carry
   bei 1,6 s je Meter sind 12 kcal/min (Klasse 2); schweres Druecken auf Zeit
   liegt gleichauf mit der Rolle "main" der Kraft-Session (ebenfalls 12); der
   Griff-Anhang entspricht der Rolle "iso" (6). */
const STRONGMAN_WORK_KCAL_PER_MIN = { 1: 12, 2: 12, 3: 6 };

/* Wie lange eine Einheit der Dosis dauert — dieselbe Umrechnung, die
   strongman-pools.js fuer seine Arbeitszeit benutzt (Meter x 1,6 s,
   Wiederholung x 6 s). Steht hier, damit Arbeit und Pause sich nicht
   ueberschneiden. */
const STRONGMAN_SEK_JE_EINHEIT = { meter: 1.6, reps: 6, sek: 1 };

function estimateStrongmanCalories(log, profile) {
  const sm = log?.strongman;
  const teile = Array.isArray(sm?.teile) ? sm.teile : [];
  if (!teile.length) return null;

  const bodyFactor = getBodyFactor(profile);

  let kcal = 0;
  let arbeitSek = 0;

  /* "Max Reps im Zeitfenster" hat im Bauplan keine Dosis — aber seit dem
     10.09.2026 steht sie im Log (Wiederholungen je Satz). Dann rechnet die
     Bewegungstabelle, nicht die Klassenrate. */
  const geloggteReps = new Map();
  (Array.isArray(log?.result?.exercises) ? log.result.exercises : []).forEach(ex => {
    const n = Number(ex?.totalReps || 0);
    if (ex?.name && n > 0) geloggteReps.set(ex.name, n);
  });

  teile.forEach(teil => {
    let menge = Number(teil?.menge || 0);
    let einheit = String(teil?.einheit || "");
    const movement = teil?.name ? getMovementData(teil.name) : null;
    if (!(menge > 0) && geloggteReps.has(teil?.name)) {
      menge = geloggteReps.get(teil.name);
      einheit = "reps";
    }

    if (menge > 0 && movement) {
      if (einheit === "meter" && movement.type === "distance" && movement.kcalPerMeter) {
        kcal += menge * movement.kcalPerMeter * bodyFactor;
        arbeitSek += menge * STRONGMAN_SEK_JE_EINHEIT.meter;
        return;
      }
      if (einheit === "reps" && movement.type === "reps" && movement.kcalPerRep) {
        kcal += menge * movement.kcalPerRep * bodyFactor;
        arbeitSek += menge * STRONGMAN_SEK_JE_EINHEIT.reps;
        return;
      }
      if (einheit === "sek" && movement.type === "time" && movement.kcalPerMinute) {
        kcal += (menge / 60) * movement.kcalPerMinute * bodyFactor;
        arbeitSek += menge;
        return;
      }
    }

    /* Ohne Dosis oder ohne Tabelleneintrag: die Klasse traegt. */
    const klasse = Number(teil?.klasse || 2);
    const rate = STRONGMAN_WORK_KCAL_PER_MIN[klasse] ?? STRONGMAN_WORK_KCAL_PER_MIN[2];
    const sek = Number(teil?.arbeitSek || 0);
    kcal += (sek / 60) * rate * bodyFactor;
    arbeitSek += sek;
  });

  /* Die Gesamtdauer: was der Bauplan sagt. Kein Nutzerwert — der Strongman
     hat keinen Timer, der die Uhr anhaelt. */
  const gesamtSek = Number(sm.dauerMin || 0) > 0
    ? Number(sm.dauerMin) * 60
    : Number(sm.arbeitSek || 0) + Number(sm.pauseSek || 0);

  if (gesamtSek <= 0) return null;

  const pauseSek = Math.max(0, gesamtSek - arbeitSek);
  kcal += (pauseSek / 60) * STRENGTH_REST_KCAL_PER_MIN.main * bodyFactor;

  return {
    calories: Math.round(kcal),
    durationMinutes: Number((gesamtSek / 60).toFixed(1)),
    method: "strongman_session"
  };
}

function estimateStrengthSessionCalories(log, profile) {
  const result = log?.result || {};
  const blocks = Array.isArray(result.blocks) ? result.blocks : [];
  if (!blocks.length) return null;

  // Struktur-Soll: so lange haette die Session nach Bauplan gedauert.
  let plannedWorkSec = 0;
  let plannedRestSec = 0;

  blocks.forEach(block => {
    plannedWorkSec += Number(block.workSeconds || 0);
    plannedRestSec += Number(block.restSeconds || 0);
  });

  if (plannedWorkSec <= 0 && plannedRestSec <= 0) return null;

  // Hat der Nutzer die Dauer korrigiert, faellt die Differenz auf die PAUSEN:
  // die Arbeitszeit haengt an den tatsaechlich geleisteten Wiederholungen, die
  // sind geloggt. Wer schneller war, hat kuerzer gepaust — nicht schneller
  // gehoben. Untergrenze ist die reine Arbeitszeit.
  const plannedTotalSec = plannedWorkSec + plannedRestSec;
  const userMinutes = Number(result.durationMinutes || 0);
  const actualTotalSec = userMinutes > 0
    ? Math.max(plannedWorkSec, userMinutes * 60)
    : plannedTotalSec;
  const restScale = plannedRestSec > 0
    ? Math.max(0, actualTotalSec - plannedWorkSec) / plannedRestSec
    : 0;

  let calories = 0;

  blocks.forEach(block => {
    const role = block.role || "secondary";
    const workRate = STRENGTH_WORK_KCAL_PER_MIN[role] ?? STRENGTH_WORK_KCAL_PER_MIN.secondary;
    const restRate = STRENGTH_REST_KCAL_PER_MIN[role] ?? STRENGTH_REST_KCAL_PER_MIN.secondary;

    calories += (Number(block.workSeconds || 0) / 60) * workRate;
    calories += (Number(block.restSeconds || 0) / 60) * restScale * restRate;
  });

  calories *= getBodyFactor(profile);

  return {
    calories: Math.round(calories),
    durationMinutes: Number((actualTotalSec / 60).toFixed(1)),
    method: "strength_sets"
  };
}

  /* Ist das eine Strongman-Einheit? Der Log traegt beides — das Preset aus
     dem Generator und die Tags. Geteilte oder von Hand bearbeitete Workouts
     verlieren manchmal eines von beidem, deshalb reicht eines. */
  function istStrongmanLog(log) {
    /* Seit dem 11.09.2026 auch das Kettlebell-Preset: kettlebell-pools.js
       baut dasselbe Zeitgeruest (Arbeit, Pause, Teile) und traegt es unter
       demselben Schluessel `strongman` (mit art: "kettlebell") — ein S&S-Tag
       ist wie ein Medley zur Haelfte vorgeschriebene Pause. */
    const preset = String(log?.preset || "").toLowerCase();
    if (preset === "strongman" || preset === "kettlebell") return true;
    const tags = Array.isArray(log?.workoutTags) ? log.workoutTags : [];
    return tags.some(t => { const k = String(t).toLowerCase(); return k === "strongman" || k === "kettlebell"; });
  }

  function estimateFromDurationFallback(log, profile) {
    const durationMinutes = getDurationMinutesFromLog(log);
    if (!durationMinutes || durationMinutes <= 0) return null;

    const movements = Array.isArray(log?.movements) ? log.movements : [];
    const bodyFactor = getBodyFactor(profile);

    /* STRONGMAN HAT SEINE EIGENE RATE. Die 10 kcal je Minute darunter
       unterstellen durchgehende Arbeit; beim Strongman ist die Haelfte bis
       zwei Drittel der Zeit vorgeschriebene Pause, und genau daher kam der
       gemessene Fehler von 120 bis 140 Prozent.

       Die 5,5 sind nicht geschaetzt, sondern aus dem STRUKTURELLEN Weg
       zurueckgerechnet (estimateStrongmanCalories): 360 Stichproben ueber
       alle fuenf Formate, drei Zeitfenster, drei Level, vier Wuerfe und
       zwei Profile ergaben 4,1 bis 10,9 kcal/min ohne bodyFactor, Median
       5,54. Der Rueckfall trifft damit im Mittel dasselbe wie der genaue
       Weg — er weiss nur nicht, WAS gemacht wurde. */
    if (istStrongmanLog(log)) {
      return {
        calories: Math.round(durationMinutes * 5.5 * bodyFactor),
        durationMinutes: Number(durationMinutes.toFixed(1)),
        method: "strongman_duration_fallback"
      };
    }

    let avgPerMinute = 10;

    if (movements.some(name => /burpee/i.test(name))) avgPerMinute += 1.2;
    if (movements.some(name => /row|bike|ski|run/i.test(name))) avgPerMinute += 1.5;
    if (movements.some(name => /thruster|wall ball|devil/i.test(name))) avgPerMinute += 1.0;
    if (movements.some(name => /snatch|clean|jerk|squat/i.test(name))) avgPerMinute += 0.8;

    const estimated = durationMinutes * avgPerMinute * bodyFactor;

    return {
      calories: Math.round(estimated),
      durationMinutes: Number(durationMinutes.toFixed(1)),
      method: "duration_fallback"
    };
  }

  function parseEmomMinutes(text) {
    const raw = String(text || "");
    const match = raw.match(/E\d*MOM\s+(\d+)\s*min/i);
    return match ? Number(match[1]) : null;
  }

function getEmomMinuteBlocksFromText(text, profile) {
  const raw = String(text || "").replace(/\u00a0/g, " ");
  const blocks = [];

  const matches = [...raw.matchAll(/Min\s*(\d+)\s*:\s*([\s\S]*?)(?=Min\s*\d+\s*:|$)/gi)];

  matches.forEach(match => {
    const minuteNumber = Number(match[1]);
    const content = String(match[2] || "").trim();

    if (!content) return;

    const parsed = parseWorkoutLineCalories(content, profile);

    // Auch eine nicht erkannte Minute bleibt ein Block (mit 0 kcal). Sonst
    // wuerde sie aus dem Zyklus fallen und "(minute-1) % blocks.length"
    // verschoebe alle folgenden Minuten auf die falsche Uebung.
    if (!parsed) {
      blocks.push({
        minuteNumber,
        raw: content,
        isRest: false,
        targetUnits: 0,
        caloriesTotal: 0,
        unitLabel: "reps",
        unitType: "unknown"
      });
      return;
    }

    blocks.push({
      minuteNumber,
      raw: content,
      isRest: parsed.entryType === "rest",
      targetUnits: Number(parsed.units || 0),
      caloriesTotal: Number(parsed.calories || 0),
      unitLabel: parsed.unitLabel || "reps",
      unitType: parsed.unitType || "reps"
    });
  });

  return blocks;
}

  function estimateCaloriesFromSingleEmomBlock(block, profile) {
    if (!block) return 0;

    if (Number.isFinite(block.caloriesTotal)) {
      return block.caloriesTotal;
    }

    return 0;
  }

  function estimateEmomCaloriesFromResult(log, profile) {
    const text = getWorkoutText(log, profile?.gender);
    const blocks = getEmomMinuteBlocksFromText(text, profile);

    if (!blocks.length) return null;

    const result = log?.result || {};
    const totalMinutes = parseEmomMinutes(text) || 0;

    // ===== Vollständig geschafft =====
    if (result.completed === true) {
      let total = 0;

      for (let minute = 1; minute <= totalMinutes; minute++) {
        const blockIndex = (minute - 1) % blocks.length;
        const block = blocks[blockIndex];
        total += estimateCaloriesFromSingleEmomBlock(block, profile);
      }

      return {
        calories: Math.round(total * 10) / 10,
        durationMinutes: totalMinutes || null,
        method: "emom_completed"
      };
    }

    // ===== Nicht vollständig geschafft =====
    const fullMinutes = Number(result.fullMinutes || 0);
    const partialMinute = Number(result.partialMinute || (fullMinutes + 1));
    const partialUnitsDone = Number(result.partialUnitsDone || 0);

    let total = 0;

    // volle Minuten vollständig rechnen
    for (let minute = 1; minute <= fullMinutes; minute++) {
      const blockIndex = (minute - 1) % blocks.length;
      const block = blocks[blockIndex];
      total += estimateCaloriesFromSingleEmomBlock(block, profile);
    }

    // anteilige nächste Minute
    if (partialMinute > 0) {
      const blockIndex = (partialMinute - 1) % blocks.length;
      const block = blocks[blockIndex];

      if (block) {
        const fullBlockCalories = estimateCaloriesFromSingleEmomBlock(block, profile);
        const targetUnits = Number(block.targetUnits || 0);

        if (targetUnits > 0 && partialUnitsDone > 0) {
          const ratio = Math.max(0, Math.min(1, partialUnitsDone / targetUnits));
          total += fullBlockCalories * ratio;
        }
      }
    }

    return {
      calories: Math.round(total * 10) / 10,
      durationMinutes: partialMinute > 0 ? partialMinute : fullMinutes,
      method: "emom_partial"
    };
  }

  function extractWeightKgFromLine(line) {
    const raw = String(line || "");

    const match = raw.match(/,\s*(\d+(?:[.,]\d+)?)\s*kg\b/i);
    if (!match) return null;

    const value = parseNumber(match[1]);
    return Number.isFinite(value) ? value : null;
  }

  function getWeightedCaloriesMultiplier(movementName, weightKg, profile) {
    if (!Number.isFinite(weightKg) || weightKg <= 0) return 1;

    const normalized = normalizeMovementName(movementName);

    const referenceByMovement = {
      thrusters: 43,
      deadlifts: 100,
      backsquats: 100,
      frontsquats: 80,
      overheadsquats: 43,
      pushpress: 43,
      pushjerks: 60,

      snatches: 43,
      powersnatches: 43,
      squatsnatches: 43,
      hangpowersnatches: 40,
      hangsquatsnatches: 40,

      powercleans: 60,
      squatcleans: 60,
      hangcleans: 55,
      hangpowercleans: 55,
      hangsquatcleans: 55,
      cleanandjerks: 60,

      dumbbellsnatches: 22.5,
      dumbbellthrusters: 22.5,
      dumbbellcleans: 22.5,
      dumbbellpowercleans: 22.5,
      dumbbellhangcleans: 22.5,
      dumbbellhangpowercleans: 22.5,
      dumbbellwalkinglunges: 22.5,
      dumbbellboxstepovers: 22.5,
      devilspress: 22.5,
      dumbbellsquatsnatches: 22.5,
      dumbbellhangsnatches: 22.5,

      kettlebellswings: 24,
      singlearmkettlebellswings: 24,
      kettlebellgobletsquats: 24,
      singlekettlebellsnatches: 24,
      doublekettlebellsnatches: 16,
      kettlebellsquatsnatches: 16,

      sandbagsquats: 60,
      sandbagcleans: 60,
      sandbagovershoulder: 60,

      wallballshots: 9,
      sumodeadlifthighpulls: 35,
      benchpress: 70,
      shoulderpress: 43,

      splitjerk: 60,
      musclesnatches: 40,
      musclecleans: 50,
      powercleanandjerks: 60,
      hangcleanandjerks: 60,

      singledumbbelloverheadsquats: 20,
      singlekettlebelloverheadsquats: 20,
      snatchbalance: 60,
      snatchpull: 85,
      highhangpowersnatch: 45,
      tallsnatch: 30,
      hangsquatsnatch: 55,
      tempooverheadsquat: 50,
      snatchpushpress: 55,

      powerclean: 60,
      cleanpull: 90,
      musclecleanfrontsquat: 50,

      backsquat: 100,
      frontsquat: 80,

    };

    const reference = referenceByMovement[normalized];
    if (!Number.isFinite(reference) || reference <= 0) return 1;

    const athleteWeight = Number(profile?.weightKg || 0);

    let ratio = weightKg / reference;

    if (athleteWeight > 0) {
      const bodyRatio = weightKg / athleteWeight;
      ratio *= 0.9 + Math.min(0.35, bodyRatio * 0.12);
    }

    const BARBELL_HEAVY = [
      "deadlifts",
      "backsquats",
      "frontsquats",
      "overheadsquats",
      "thrusters",
      "pushpress",
      "pushjerks",
      "benchpress",

      "snatches",
      "powersnatches",
      "squatsnatches",

      "powercleans",
      "squatcleans",
      "cleanandjerks",

      "splitjerk",
      "powercleanandjerks",
      "hangcleanandjerks"
    ];

    const SANDBAG_SLED = [
      "sandbagsquats",
      "sandbagcleans",
      "sandbagovershoulder",
      "sledpush",
      "sledpull"
    ];

    const MEDIUM_WEIGHT = [
      "dumbbellthrusters",
      "dumbbellcleans",
      "dumbbellpowercleans",
      "dumbbellhangcleans",
      "dumbbellsnatches",
      "dumbbellsquatsnatches",
      "devilspress",

      "kettlebellswings",
      "kettlebellgobletsquats",
      "singlekettlebellsnatches",
      "doublekettlebellsnatches",

      "wallballshots"
    ];

    const isHeavy =
      BARBELL_HEAVY.includes(normalized) ||
      SANDBAG_SLED.includes(normalized);

    const isMedium =
      MEDIUM_WEIGHT.includes(normalized);

    let multiplier;

    if (isHeavy) {
      // 🔥🔥🔥 heavy (stärker für OLY / Squats / schwere Lifts)
      multiplier = 0.55 + (Math.pow(Math.max(0.1, ratio), 1.15) * 0.95);
    }
    else if (isMedium) {
      // 🔥🔥 medium
      multiplier = 0.72 + (Math.pow(Math.max(0.1, ratio), 0.82) * 0.52);
    }
    else {
      // 🔥 light
      multiplier = 0.88 + (Math.sqrt(Math.max(0.1, ratio)) * 0.24);
    }

    return Math.max(0.75, Math.min(2.5, multiplier));
    }
/* ===== Box-Whiteboard-Schreibweisen (22.09.2026) =====
   Das Wochenprogramm von CrossFit Munich kommt als Whiteboard-Text in die
   App (Box-Reiter). Gemessen an vier Wochen (204 Uebungszeilen) verstand der
   Parser 80 — der Rest scheiterte an Schreibweisen, nicht an Uebungen:
   Paare Maenner/Frauen ("30/21 cal", "3/3 Single Arm ..."), "cal. any
   machine", Boxhoehen "60/50cm", Seiten "— Right", "(6/side)", Alternativen
   ("Row/Ski or 60/42cal.", "Double Unders/40 Single Unders") und Spannen
   ("5–8 strict Pull ups"). Diese Funktion glaettet genau das, ohne die
   Uebung zu veraendern; unbekannte Namen faengt lockereNamen() unten. */
function bereinigeWhiteboardZeile(z, gender) {
  const frau = gender === "female";
  let s = String(z || "");
  // "Box Squat: x 6 reps @ 65–70% of 1RM Back Squat" (CrossFit Munich 29.09.)
  // -> "6 Box Squat": die Box stellt den Namen VOR die Wiederholungen. Die
  // Prozentlast sagt dem Rechner nichts (kein kg), sie faellt weg.
  s = s.replace(/^([A-Za-z][A-Za-z '&-]{1,40}?)\s*:\s*x?\s*(\d+)\s*reps?\b.*$/i, "$2 $1");
  s = s.replace(/\s*[—–-]\s*(right|left|rechts|links)\s*$/i, "");
  // "1.round: 15 WBS" (Hyrox) -> die Rundenmarke ist keine Uebung
  s = s.replace(/^\d+\s*\.\s*round\s*:\s*/i, "");
  // "600 Meter Run", "100–Meter Farmer's Carry" -> "600 m Run"
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*[—–-]?\s*meters?\b/gi, "$1 m");
  // "250-m row" / "25m/side": die Box bindet das m mit Strich an die Zahl
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*[—–-]\s*m\b/gi, "$1 m");
  // "45sec." / "45secs" / "45 seconds" -> "45 sec" (ohne Leerzeichen und mit
  // Punkt erkennt der Zeilenparser die Dauer sonst nicht)
  s = s.replace(/(\d+)\s*sec(?:s|onds?)?\.?(?=\s|$)/gi, "$1 sec");
  // ", 32 / 22.5 kgs" -> die eigene Last; "kgs" -> "kg"
  s = s.replace(/,?\s*(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)\s*kgs?\b/gi, (_, m, w) => ", " + (frau ? w : m) + " kg");
  s = s.replace(/\bkgs\b/gi, "kg");
  // Lasten ohne Einheit am Ende ("@9/6", "@2x16/12", "(2x11,5)") sagen dem Rechner nichts
  s = s.replace(/\s*@\s*\d+\s*x\s*\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?\s*$/i, "");
  s = s.replace(/\s*@\s*\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?\s*$/i, "");
  s = s.replace(/\s*\(\s*\d+\s*x\s*\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?\s*\)\s*$/i, "");
  s = s.replace(/\s*\/\s*front\s+rack\s*$/i, "");
  s = s.replace(/\s*\(\s*\d+\s*\/\s*(?:side|arm|leg|seite|bein)\s*\)/gi, "");
  s = s.replace(/,?\s*\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?\s*cm\b/gi, "");
  // Zahlenpaar vorn: der Wert des eigenen Geschlechts (Maenner zuerst, wie
  // die Box schreibt)
  s = s.replace(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)(?=\s|[—–-]?\s*(?:cal|m\b))/i, (_, m, w) => (frau ? w : m));
  // Kalorien auf "irgendeiner Maschine": eine Kalorie ist eine Kalorie
  // kein \b vor "cal": die Box schreibt "30/21cal." ohne Leerzeichen
  s = s.replace(
    /cal(?:orie)?s?\.?\s*(?:on\s+)?(?:any\s+machine|cardio\s+machine|machine\s+of\s+choice|machine|erg|ab|assault\s*bike|echo\s*bike|bike\s*erg|air\s*bike)\b/i,
    "cal row"
  );
  // "C2 Bike" / "Concept2 Rower": die Marke sagt der Rechnung nichts
  s = s.replace(/\b(?:c2|concept\s*2)\s+(bike|row(?:er)?|ski)\b/gi,
    (_, g) => (/^row/i.test(g) ? "Row" : /^bike/i.test(g) ? "Bike" : "Ski"));
  s = s.replace(/\bfarmers?\s+carry\b/i, "Farmers Carry");
  s = s.replace(/^max\s*[-–]?\s*cal(?:ories)?\b/i, "Max Reps cal row");
  // Alternativen: die erste Wahl zaehlt
  s = s.replace(/\s+or\s+.*$/i, "");
  s = s.replace(/\b(row|ski)\s*\/\s*(?:ski|row)\b/i, "$1");
  s = s.replace(/\s*\/\s*\d*\s*single\s+unders?\b/i, "");
  // Spanne "5–8 ..." -> obere Zahl
  s = s.replace(/^(\d+)\s*[-–]\s*(\d+)(?=\s+[A-Za-z(])/, "$2");
  return s.trim();
}

/* Namen, die der Katalog nur ohne Zusatz kennt: erst die Zusaetze weg
   ("Alternating", "Single Arm", "Bodyweight", "Heavy", ...), dann bekannte
   Umschreibungen, zuletzt das Geraet ("Dumbbell Push Press" -> "Push Press":
   fuer die Kalorien dieselbe Bewegung). Liefert Kandidaten in dieser
   Reihenfolge; der Aufrufer nimmt den ersten, den der Katalog kennt. */
const WHITEBOARD_ZUSAETZE = /\b(alternating|alt\.?|single[- ]arm|bodyweight|weighted|heavy|light|high|low|seated|banded|deficit|feet[- ]elevated|tempo|paused?|wide[- ]grip|pronated|supinated|overhand|monster[- ]band|goblet[- ]hold|front[- ]foot[- ]elevated|strict|abmat|touch[-– ]and[-– ]go)\b/gi;
const WHITEBOARD_GERAETE = /\b(dumbbell|dumbbells|db|kettlebell|kb|barbell|bb|plate|single|double|2x|1x)\b/gi;
const WHITEBOARD_UMSCHREIBUNGEN = [
  [/\btoes?[\s-]+to[\s-]+bars?\b|\bt2b\b/i, "Toes to Bar"],
  [/\bfarmers?\s+carry\b/i, "Farmer’s Carry"],
  [/\bsquat\s+snatch(?:es)?\b/i, "Snatch"],
  [/\bsquat\s+clean\s+and\s+jerks?\b/i, "Clean and Jerk"],
  [/\bhang\s+clean\s+and\s+jerks?\b/i, "Hang Clean and Jerk"],
  [/\bdevil'?s?\s+press(?:es)?\b/i, "Devil’s Press"],
  [/\bburpees?\s+over\s+(?:the\s+)?(?:db|dumbbells?)\b/i, "Burpees over Dumbbell"],
  [/\bburpees?\s+over\s+(?:the\s+)?(?:bb|barbell|bar)\b/i, "Burpees over Bar (Lateral)"],
  [/\bburpees?\s+(?:to|over)\s+(?:plate|target)\b/i, "Burpees"],
  [/\b(?:reverse\s+)?lunge\s+steps?\b/i, "Lunges"],
  [/\bwalking\s+lunges?\b/i, "Lunges"],
  [/\breverse\s+lunges?\b/i, "Lunges"],
  [/\bcurtsy\s+lunges?\b/i, "Lunges"],
  [/\bhamstring\s+curls?\b/i, "Nordic Hamstring Curls"],
  [/\bbicep\s+curls?\b|\bdb\s+curls?\b|\bcurls\b/i, "Dumbbell Bicep Curls"],
  [/\breverse\s+fl(?:y|ies|ys|yes)\b|rear\s+delt\s+fl(?:y|ies|ys)\b/i, "Reverse Flyes"],
  [/\bfl(?:y|ies|ys|yes)\b/i, "Dumbbell Flyes"],
  [/\btricep\s+extensions?\b/i, "Overhead Tricep Extensions"],
  [/\brenegade\s+rows?\b/i, "Dumbbell Bent-over Rows"],
  [/\bbarbell\s+rows?\b|\bbent[- ]?over\s+rows?\b/i, "Bent-over Rows"],
  [/\bwbs\b|\bwall\s*balls?\b/i, "Wall Balls"],
  [/\bwb\s+lunges?\b|\bsplit\s+squats?\b|\bcurtsy\s+lunges?\b/i, "Lunges"],
  [/\bwall\s+walks?\b/i, "Wall Walks"],
  [/\bbox\s+squats?\b/i, "Back Squat"],
  [/\b(?:db|dumbbell)\s+press(?:es)?\b/i, "Shoulder Press"],
  [/\bmatador\s+dips?\b|\bparallette\s+dips?\b/i, "Dips"],
  [/\b(?:kb|kettlebell|db|dumbbell)?\s*overhead\s+carry\b/i, "Overhead Carry"],
  [/\b(?:dumbbell|db)\s+rows?\b/i, "Dumbbell Bent-over Rows"],
  [/\bstrict\s+press(?:es)?\b|\bshoulder\s+press(?:es)?\b/i, "Shoulder Press"],
  [/\bburpees?\b/i, "Burpees"],
  [/\bring\s+rows?\b/i, "Ring Rows"],
  [/\bhandstand\s+push[- ]?ups?\b/i, "Handstand Push-Ups"],
  [/\bpush[- ]?ups?\s+on\s+db\b/i, "Push Ups"],
  [/\btuck\s+crunch(?:es)?\b|\bcrunch(?:es)?\b/i, "Sit Ups"],
  [/\brussian\s+twists?\b/i, "Russian Twists"],
  [/\bground\s+to\s+overhead\b/i, "Ground to Overhead"],
  [/\b(?:rdl|romanian\s+deadlifts?)\b/i, "Romanian Deadlift"],
  [/\bside\s+plank\b/i, "Side Plank"],
  [/\bbox\s+jumps?\b(?!\s+over)/i, "Box Jumps"],
  [/\bbox\s+jump\s+overs?\b/i, "Box Jump Overs"],
  [/\bbox\s+step[- ]?(?:ups?)\b/i, "Box Step-Ups"],
  [/\bbox\s+step[- ]?overs?\b/i, "Box Step-Overs"],
  [/\bface\s+pulls?\b/i, "Face Pulls"],
  [/\blateral\s+walks?\b/i, "Lunges"],
  [/\bpower\s+or\s+squat\s+snatch\b/i, "Snatch"],
  /* Aus 39.746 belegten Workouts (docs/wod-recherche): die haeufigsten
     Schreibweisen, die der Rechner bis zum 25.09.2026 nicht traf. Die
     Bewegung steht jeweils im Katalog, nur anders geschrieben. */
  [/^squats?$/i, "Air Squats"],                                    // blankes "Squats" = Luftkniebeuge
  // Goblet Hold Squats (CrossFit Munich 01.10.): Halt unten, Arbeit wie Goblet Squat.
  [/\bgoblet\s+hold\s+squats?\b/i, "Kettlebell Goblet Squats"],
  [/\bgoblet\s+squats?\b/i, "Kettlebell Goblet Squats"],
  [/\b(?:russian|american)\s+(?:kettlebell\s+)?swings?\b/i, "Kettlebell Swings"],
  [/^swings?$/i, "Kettlebell Swings"],
  [/\bkbs\b/i, "Kettlebell Swings"],
  [/\bhspus?\b/i, "Handstand Push-Ups"],
  [/\bjumping\s+pull[\s-]?ups?\b/i, "Pull Ups"],                  // Skalierung, dieselbe Bewegung
  [/\bdu'?s\b|\bdus\b/i, "Double Unders"],
  [/\bmed(?:icine)?[\s-]?ball\s+cleans?\b/i, "Medicine-Ball Cleans"],
  [/\bball\s+slams?\b|\bslam\s+balls?\b/i, "Med Ball Slams"],
  [/\bs2oh\b|\bshoulder\s+to\s+overhead\b/i, "Shoulder to Overhead"],
  [/\bsdhp\b|\bsumo\s+deadlift\s+high\s+pulls?\b/i, "Sumo Deadlift High Pull"],
  [/\bg2oh\b/i, "Ground to Overhead"],
];
function lockereNamen(name) {
  const aus = [];
  const merk = (k) => { const t = String(k || "").replace(/\s+/g, " ").trim(); if (t && !aus.includes(t)) aus.push(t); };
  // "alt. DB Snatches": der Punkt hinter "alt" wuerde sonst als ". Snatches" stehen bleiben
  const roh = String(name || "").replace(/\balt\.\s*/gi, "alt ")
    // Kuerzel der Geraete ausschreiben: "DB Snatches" steht in der Tabelle als "Dumbbell Snatches"
    .replace(/\bDB\b/g, "Dumbbell").replace(/\bKB\b/g, "Kettlebell").replace(/\bBB\b/g, "Barbell");
  const ohneZusatz = roh.replace(WHITEBOARD_ZUSAETZE, " ");
  merk(ohneZusatz);
  for (const [re, ziel] of WHITEBOARD_UMSCHREIBUNGEN) {
    if (re.test(roh)) merk(ziel);
  }
  const ohneGeraet = ohneZusatz.replace(WHITEBOARD_GERAETE, " ").replace(/\s+/g, " ").trim();
  // Bleibt nur ein Ergometer-Wort uebrig ("Dumbbell Row" -> "Row"), ist das
  // keine Umschreibung, sondern ein anderes Geraet — nicht anbieten.
  if (!/^(row|rows|ski|bike|run)$/i.test(ohneGeraet)) merk(ohneGeraet);
  return aus;
}

function parseWorkoutLineCalories(line, profile) {
  const raw = String(line || "").replace(/\u00a0/g, " ");
  const clean = bereinigeWhiteboardZeile(
    raw
      .trim()
      .replace(/^[•\-\s]+/, "")
      .trim(),
    profile?.gender
  );

  if (!clean) return null;
  if (/^AMRAP\b/i.test(clean)) return null;
  if (/^BUY-IN:?$/i.test(clean)) return null;
  if (/^CASH-OUT:?$/i.test(clean)) return null;
  if (/^-{4,}$/.test(clean)) return null;

  if (/^rest$/i.test(clean) || /^\d+\s*min\s+Rest\b/i.test(clean)) {
    return {
      raw: clean,
      units: 0,
      calories: 0,
      entryType: "rest",
      unitType: "rest",
      unitLabel: "",
      movementName: "Rest"
    };
  }

  // ===== Vervielfacher "4x 100 m Sprint" (Hero-Katalog: FEEKS u.a.) =====
  let nx = clean.match(/^(\d+)\s*x\s+(.+)$/i);
  if (nx) {
    const innen = parseWorkoutLineCalories(nx[2], profile);
    if (innen && innen.entryType !== "rest") {
      const n = parseNumber(nx[1]) || 1;
      return { ...innen, raw: clean, units: innen.units * n, calories: innen.calories * n };
    }
  }

  // ===== Namenszeilen mit Kommaliste ("Kraus: 200 m Run, 30 Pull-Ups, ...") =====
  // Der Split verlangt eine Ziffer nach dem Komma, damit "1,5x Koerpergewicht"
  // nicht auseinandergerissen wird.
  const benannt = clean.replace(/^[A-Za-z .'’-]+:\s*/, "");
  const teile = benannt.split(/,\s+(?=\d)/);
  if (teile.length >= 2) {
    const geparst = teile
      .map(t => parseWorkoutLineCalories(t.trim(), profile))
      .filter(p => p && p.entryType !== "rest");
    if (geparst.length >= 2) {
      return {
        raw: clean,
        units: geparst.reduce((s, p) => s + p.units, 0),
        calories: geparst.reduce((s, p) => s + p.calories, 0),
        entryType: "direct",
        unitType: "mixed",
        unitLabel: "",
        movementName: "Kombination"
      };
    }
  }

  // ===== Minuten-Stationen ("1 min Squat Cleans", "3 min Rope Climbs") =====
  // Feste Uhr: die Minute IST die Dosis. Raten je Minute nach Uebungsklasse,
  // gewichtsskaliert ueber bodyFactor weiter unten nicht noetig — die Werte
  // sind fuer ~80 kg kalibriert und werden ueber weightKg angepasst.
  const minStation = clean.match(/^(\d+)\s*min\s+(.+)$/i);
  if (minStation && !/Zeit/i.test(minStation[2])) {
    const minuten = parseNumber(minStation[1]) || 0;
    const wasRoh = minStation[2].replace(/\(.*?\)/g, "").replace(/@.*$/, "").trim();
    const stationsRaten = {
      deadhang: 3, ropeclimbs: 12, airsquats: 11, pushups: 9, burpees: 14,
      squatcleans: 12, deadlifts: 12, jerks: 12, pushjerks: 12, shuttlesprints: 13
    };
    const schluessel = normalizeMovementName(wasRoh.replace(/an der Stange/i, "").trim());
    const rate = stationsRaten[schluessel] ?? 10;
    const gewicht = (profile?.weightKg || 80) / 80;
    return {
      raw: clean,
      units: minuten,
      calories: minuten * rate * gewicht,
      entryType: "direct",
      unitType: "duration",
      unitLabel: "min",
      movementName: wasRoh
    };
  }

  // ===== "3 min Zeit fuer 400 m Run" (MANUEL) =====
  const zeitFuer = clean.match(/^\d+\s*min\s+Zeit\s+f(?:ue|ü)r\s+(.+)$/i);
  if (zeitFuer) return parseWorkoutLineCalories(zeitFuer[1], profile);

  // ===== "Max Reps X" / "Max-Set X" / "Max Deadlifts" (NUKES, T.J., DOMINIC) =====
  // Ohne gemeldete Zahl rechnen wir mit 20 Wiederholungen je Max-Fenster —
  // bewusst konservativ, ein Pulsgurt schlaegt die Schaetzung ohnehin.
  const maxRep = clean.match(/^Max[- ]?(?:Reps?|Set)?s?\.?\s+(.+)$/i);
  if (maxRep && !/^\d/.test(maxRep[1])) {
    const innen = parseWorkoutLineCalories(`20 ${maxRep[1]}`, profile);
    if (innen && innen.entryType !== "rest") {
      return { ...innen, raw: clean };
    }
  }

  // ===== Calories first =====
  let match =
    clean.match(/^(\d+(?:[.,]\d+)?)\s*(bike|row|ski(?:\s*erg)?)\s*(cal|cals|calories)\b/i) ||
    clean.match(/^(\d+(?:[.,]\d+)?)\s*(cal|cals|calories)\s*(bike|row|ski(?:\s*erg)?)\b/i);

  if (match) {
    const calories = parseNumber(match[1]) || 0;
    const machine = clean.toLowerCase().includes("bike")
      ? "Bike"
      : clean.toLowerCase().includes("row")
        ? "Row"
        : "Ski Erg";

    return {
      raw: clean,
      units: calories,
      calories,
      entryType: "direct",
      unitType: "calories",
      unitLabel: "cal",
      movementName: machine
    };
  }

  // ===== Distance =====
  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+Row\b/i);
  if (match) {
    const meters = parseNumber(match[1]) || 0;
    return {
      raw: clean,
      units: meters,
      calories: estimateRowCaloriesFromMeters(meters, profile?.weightKg),
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Row"
    };
  }

  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+Ski\s*Erg\b/i);
  if (match) {
    const meters = parseNumber(match[1]) || 0;
    return {
      raw: clean,
      units: meters,
      calories: estimateSkiCaloriesFromMeters(meters, profile?.weightKg),
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Ski Erg"
    };
  }

  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+Bike\b/i);
  if (match) {
    const meters = parseNumber(match[1]) || 0;
    return {
      raw: clean,
      units: meters,
      calories: estimateBikeCaloriesFromMeters(meters),
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Bike"
    };
  }

  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+Run\b/i);
  if (match) {
    const meters = parseNumber(match[1]) || 0;
    return {
      raw: clean,
      units: meters,
      calories: (meters / 1000) * (profile.weightKg || 75),
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Run"
    };
  }

  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*km\s+Run\b/i);
  if (match) {
    const km = parseNumber(match[1]) || 0;
    return {
      raw: clean,
      units: km,
      calories: km * (profile.weightKg || 75),
      entryType: "distance",
      unitType: "distance",
      unitLabel: "km",
      movementName: "Run"
    };
  }

  // "1 Mile Run" stand seit Murph im Katalog, wurde aber nie gezaehlt —
  // gefunden bei der Validierung der Hero-Erweiterung am 24.08.2026.
  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*Miles?\s+Run\b/i);
  if (match) {
    const meters = (parseNumber(match[1]) || 0) * 1609;
    return {
      raw: clean,
      units: meters,
      calories: (meters / 1000) * (profile.weightKg || 75),
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Run"
    };
  }

  // Sprints als Lauf zaehlen ("100 m Sprint", "45 m Sprint")
  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+(?:Shuttle\s+)?Sprint\b/i);
  if (match) {
    const meters = parseNumber(match[1]) || 0;
    return {
      raw: clean,
      units: meters,
      calories: (meters / 1000) * (profile.weightKg || 75) * 1.1,
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Run"
    };
  }

  // "300 m Shuttle Run (...)" — die Gesamtstrecke zaehlt
  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+Shuttle\s+Run\b/i);
  if (match) {
    const meters = parseNumber(match[1]) || 0;
    return {
      raw: clean,
      units: meters,
      calories: (meters / 1000) * (profile.weightKg || 75) * 1.15,
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Run"
    };
  }

  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+Sled\s+Push\b/i);
  if (match) {
    const meters = parseNumber(match[1]) || 0;
    const loadKg = extractSledLoadKgFromLine(clean);
    return {
      raw: clean,
      units: meters,
      calories: sledCaloriesFromMeters(meters, loadKg, 0.55),
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Sled Push"
    };
  }

  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+Sled\s+Pull\b/i);
  if (match) {
    const meters = parseNumber(match[1]) || 0;
    const loadKg = extractSledLoadKgFromLine(clean);
    return {
      raw: clean,
      units: meters,
      calories: sledCaloriesFromMeters(meters, loadKg, 0.5),
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Sled Pull"
    };
  }

  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+Farmer'?s\s+Carry\b/i);
  if (match) {
    const meters = parseNumber(match[1]) || 0;
    const loadKg = extractSledLoadKgFromLine(clean);
    return {
      raw: clean,
      units: meters,
      calories: carryCaloriesFromMeters(meters, loadKg, 0.32),
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Farmer’s Carry"
    };
  }

  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+Sandbag\s+Carry\b/i);
  if (match) {
    const meters = parseNumber(match[1]) || 0;
    const loadKg = extractSledLoadKgFromLine(clean);
    return {
      raw: clean,
      units: meters,
      calories: carryCaloriesFromMeters(meters, loadKg, 0.34),
      entryType: "distance",
      unitType: "distance",
      unitLabel: "m",
      movementName: "Sandbag Carry"
    };
  }

  /* Generischer Distanz-Zweig (24.08.2026): "30 m Bear Crawl", "50 m
     Waiter's Carry", "15 m Kettlebell Overhead Carry", "20 m Handstand
     Walk" — alles mit kcalPerMeter in MOVEMENT_DATA, das oben keinen
     eigenen Festzweig hat. Ohne diesen Zweig fielen solche Zeilen STILL
     durch (Brenton stand bei 65 statt ~110 kcal, Terrys Bear Crawls
     zaehlten nie). Lange Strecken werden wie bei den Carries gedaempft. */
  match = clean.match(/^(\d+(?:[.,]\d+)?)\s*m\s+(.+)$/i);
  if (match) {
    const distMovement = getMovementData(
      match[2]
        .replace(/,\s*\d+(?:[.,]\d+)?\s*kg\b.*$/i, "")
        .replace(/\(.*?\)/g, "")
        .replace(/@.*$/, "")
        .replace(/\b(links|rechts|im Wechsel)\b.*$/i, "")
        .trim()
    );
    if (distMovement && distMovement.type === "distance" && distMovement.kcalPerMeter) {
      const meters = parseNumber(match[1]) || 0;
      const loadKg = extractSledLoadKgFromLine(clean);
      return {
        raw: clean,
        units: meters,
        calories: carryCaloriesFromMeters(meters, loadKg, distMovement.kcalPerMeter),
        entryType: "distance",
        unitType: "distance",
        unitLabel: "m",
        movementName: match[2].trim()
      };
    }
  }

  // ===== Zeit-Angaben ("40s Ski", "45 Sekunden Farmers Hold") =====
  // Erst die Ergometer, dann jede Bewegung mit `type: "time"` aus der
  // Tabelle. Bis zum 28.08.2026 zaehlten hier NUR die Maschinen — ein
  // "45 Sekunden Farmers Hold" fiel still durch, weil es fuer Holds keinen
  // Typ gab. Was danach immer noch niemand kennt ("40s Plank"), faellt
  // weiterhin durch.
  match = clean.match(/^(\d+)\s*(?:s|sec|secs|sek|seconds|sekunden)\.?\s+(.+)$/i);
  if (match) {
    const rest = match[2].toLowerCase();
    const machine =
      rest.includes("bike") ? "bike" :
      rest.includes("row")  ? "row"  :
      rest.includes("ski")  ? "ski"  :
      rest.includes("run")  ? "run"  :
      null;

    if (!machine) {
      const zeitName = match[2]
        .replace(/,\s*\d+(?:[.,]\d+)?\s*kg\b.*$/i, "")
        .replace(/\(.*?\)/g, "")
        .replace(/@.*$/, "")
        .trim();
      const zeitMovement = getMovementData(zeitName);

      if (zeitMovement && zeitMovement.type === "time" && zeitMovement.kcalPerMinute) {
        const seconds = parseNumber(match[1]) || 0;
        return {
          raw: clean,
          units: seconds,
          calories: (seconds / 60) * zeitMovement.kcalPerMinute * getBodyFactor(profile),
          /* "direct", NICHT "duration": estimateFromLog summiert nur die
             Toepfe direct / distance / reps. Siehe den Minuten-Zweig oben,
             der es genauso haelt. */
          entryType: "direct",
          unitType: "duration",
          unitLabel: "s",
          movementName: zeitName
        };
      }
    }

    if (machine) {
      const seconds = parseNumber(match[1]) || 0;
      return {
        raw: clean,
        units: seconds,
        calories: estimateCardioCaloriesFromSeconds(seconds, machine, profile?.weightKg),
        /* BEFUND 28.08.2026, aelter als der Zeit-Typ: hier stand
           `entryType: "duration"`, und estimateFromLog summiert nur direct,
           distance und reps. Jede Zeile der Form "40s Ski", "30 sec Bike"
           oder "45 Sek Row" wurde also berechnet und dann STILL verworfen —
           ein Workout, das nur daraus besteht, fiel auf den Dauer-Rueckfall.
           Niemand liest "duration" irgendwo aus, der Wert war ein Sackgasse. */
        entryType: "direct",
        unitType: "duration",
        unitLabel: "s",
        movementName:
          machine === "bike" ? "Bike" :
          machine === "row"  ? "Row"  :
          machine === "run"  ? "Run"  :
          "Ski Erg"
      };
    }
  }

  // ===== Generic reps =====
  match = clean.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (!match) return null;

  const amount = parseNumber(match[1]) || 0;
  if (amount <= 0) return null;

    const lineWeightKg = extractWeightKgFromLine(clean);

    /* Klammern (Boxhoehe, Seillaenge), nicht-numerische @-Lasten
       ("@ Koerpergewicht") und deutsche Zusaetze ("links", "im Wechsel")
       duerfen den Namens-Lookup nicht scheitern lassen. Numerische Lasten
       sind an dieser Stelle laengst zu ", NN kg" normalisiert. */
    const nurKgWeg = match[2]
      .replace(/,\s*\d+(?:[.,]\d+)?\s*kg\b.*$/i, "")
      .trim();
    const gestrippt = nurKgWeg
      .replace(/\(.*?\)/g, "")
      .replace(/@.*$/, "")
      .replace(/\b(links|rechts|im Wechsel|to Target|an der Stange|auf Kurzhanteln|je Arm|mit Kurzhanteln)\b.*$/i, "")
      /* "3 Wiederholungen Sandbag Over Shoulder" — so schreibt der
         Strongman-Bauplan seine Stationen, und so steht es im geteilten
         Text. Ohne dieses Wort scheiterte der Namens-Lookup an JEDER
         Strongman-Zeile mit Wiederholungen (28.08.2026). */
      .replace(/^Wiederholungen\s+/i, "")
      .trim();

    /* Erst der volle Name (die Klammer kann Teil des Katalognamens sein:
       "Burpees over Bar (Facing)"), dann die gestrippte Fassung. */
    let movementName = nurKgWeg;
    let movement = getMovementData(nurKgWeg);
    if (!movement) { movement = getMovementData(gestrippt); movementName = gestrippt; }
    /* Whiteboard-Schreibweisen ("Alternating Dumbbell Hang Snatch",
       "Single Arm Dumbbell Push Press", "Toe to bar"): Zusaetze weg,
       Umschreibungen, zuletzt das Geraet — s. lockereNamen(). */
    if (!movement) {
      for (const kandidat of lockereNamen(gestrippt)) {
        movement = getMovementData(kandidat);
        if (movement) { movementName = kandidat; break; }
      }
    }
    if (!movement) return null;

    const bodyFactor = getBodyFactor(profile);
    const weightMultiplier = getWeightedCaloriesMultiplier(
      movementName,
      lineWeightKg,
      profile
    );

    if (movement.type === "reps" && movement.kcalPerRep) {
      return {
        raw: clean,
        units: amount,
        calories: amount * movement.kcalPerRep * bodyFactor * weightMultiplier,
        entryType: "reps",
        unitType: "reps",
        unitLabel: "reps",
        movementName,
        weightKg: lineWeightKg,
        weightMultiplier
      };
    }

    if (movement.type === "shuttle" && movement.kcalPerRep) {
      return {
        raw: clean,
        units: amount,
        calories: amount * movement.kcalPerRep * bodyFactor,
        entryType: "reps",
        unitType: "reps",
        unitLabel: "reps",
        movementName,
        weightKg: null,
        weightMultiplier: 1
      };
    }

    if (movement.type === "distance" && movement.kcalPerMeter) {
      return {
        raw: clean,
        units: amount,
        calories: amount * movement.kcalPerMeter,
        entryType: "distance",
        unitType: "distance",
        unitLabel: "m",
        movementName,
        weightKg: lineWeightKg,
        weightMultiplier
      };
    }

  return null;
}
function extractWorkoutEntries(text, roundMultiplier, profile) {
  const raw = String(text || "");
  const lines = raw.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const entries = [];

  let currentSection = "";

  lines.forEach(line => {
    const upper = line.toUpperCase();

    if (upper.startsWith("BUY-IN")) {
      currentSection = "BUY-IN";
      return;
    }

    if (upper.startsWith("CASH-OUT")) {
      currentSection = "CASH-OUT";
      return;
    }

    const parsed = parseWorkoutLineCalories(line, profile);
    if (!parsed || parsed.entryType === "rest") return;

    const effectiveMultiplier = getLineMultiplier(line, currentSection, roundMultiplier);

    entries.push({
      ...parsed,
      line,
      section: currentSection || "MAIN",
      calories: parsed.calories * effectiveMultiplier
    });
  });

  return entries;
}

function buildAmrapPartialFromBlocks(mainBlocks, extraUnits) {
  let remaining = Number(extraUnits || 0);
  let partialCalories = 0;
  const segments = [];

  for (const block of mainBlocks) {
    if (remaining <= 0) break;

    const targetUnits = Number(block.units || 0);
    if (targetUnits <= 0) continue;

    const doneUnits = Math.min(remaining, targetUnits);
    const ratio = doneUnits / targetUnits;
    const blockCalories = Number(block.calories || 0) * ratio;

    partialCalories += blockCalories;

    segments.push({
      raw: block.raw,
      doneUnits,
      targetUnits,
      calories: blockCalories
    });

    remaining -= doneUnits;
  }

  return {
    partialCalories,
    segments
  };
}

function buildAmrapPartialSummary(segments) {
  if (!Array.isArray(segments) || !segments.length) return "";

  return segments
    .map(segment => {
      const movementLabel = String(segment.raw || "")
        .replace(/^(\d+(?:[.,]\d+)?)\s+/, "")
        .replace(/,\s*\d+(?:[.,]\d+)?\s*kg\b.*$/i, "")
        .trim();

      const value = Number(segment.doneUnits || 0);

      if (!movementLabel || value <= 0) return "";

      if (Number.isInteger(value)) {
        return `${value} ${movementLabel}`;
      }

      return `${Number(value.toFixed(1))} ${movementLabel}`;
    })
    .filter(Boolean)
    .join(" + ");
}



  function getAmrapStructureFromText(text, profile) {
    let raw = String(text || "").replace(/\u00a0/g, " ");

    // Bullets immer in eigene Zeilen drücken
    raw = raw.replace(/\s*•\s*/g, "\n• ");

    // BUY-IN / CASH-OUT sauber trennen
    raw = raw.replace(/\s*BUY-IN:\s*/gi, "\nBUY-IN:\n");
    raw = raw.replace(/\s*CASH-OUT:\s*/gi, "\nCASH-OUT:\n");

    // Trenner in eigene Zeile
    raw = raw.replace(/\s*-{4,}\s*/g, "\n--------------------\n");

    const lines = raw
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean);

    const mainBlocks = [];
    const extraBlocks = [];

    /* Hero-Erweiterung 24.08.2026: AMRAPs mit Vor- oder Nacharbeit ("2400 m
       Run, dann AMRAP ...", "Bei 20:00 danach ...") und WODs auf fester Uhr
       ohne AMRAP-Kopf ("3 Rounds fuer Wiederholungen" mit Minuten-Stationen).
       Vorarbeit zaehlt EINMAL, nur der AMRAP-Block skaliert mit den Runden.
       Steht im Text gar kein AMRAP, ist ALLES Einmal-Arbeit — multipliziert
       mit dem Runden-Kopf ("3 Rounds fuer Wiederholungen" x3). */
    const hatAmrapKopf = /(?:^|\n)\s*(?:·\s*)?(?:Dann\s+)?AMRAP\b/im.test(String(text || ""))
      || /AMRAP:/i.test(String(text || ""));
    const einmalFaktor = hatAmrapKopf ? 1 : Math.max(1, getRoundMultiplier(text));

    let currentSection = hatAmrapKopf ? "vorarbeit" : "einmal";

    lines.forEach(line => {
      if (/AMRAP\b/i.test(line)) { currentSection = "main"; return; }
      if (/^-{4,}$/.test(line)) return;

      if (/^BUY-IN:?$/i.test(line) || /^CASH-OUT:?$/i.test(line)) {
        currentSection = "extra";
        return;
      }

      const normalizedLine = line.replace(/^[•\-\s]+/, "").trim();

      if (/^BUY-IN:?$/i.test(normalizedLine) || /^CASH-OUT:?$/i.test(normalizedLine)) {
        currentSection = "extra";
        return;
      }

      // Nach dem AMRAP-Block: Zeitfenster ("21:00-23:00") oder "Bei 20:00" /
      // "Dann:" leiten Einmal-Arbeit ein.
      if (currentSection === "main" &&
          (/^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(normalizedLine) ||
           /^Bei \d/.test(normalizedLine) ||
           /^(?:Dann|Then)[,:]?\s*$/i.test(normalizedLine))) {
        currentSection = "einmal";
        return;
      }

      const parsed = parseWorkoutLineCalories(normalizedLine, profile);
      if (!parsed) return;

      if (currentSection === "extra") {
        extraBlocks.push(parsed);
      } else if (currentSection === "main") {
        mainBlocks.push(parsed);
      } else {
        // vorarbeit/einmal: zaehlt genau einmal (bzw. x Rundenkopf ohne AMRAP)
        parsed.calories *= einmalFaktor;
        parsed.units *= einmalFaktor;
        extraBlocks.push(parsed);
      }
    });

    return {
      mainBlocks,
      extraBlocks
    };
  }

  function estimateAmrapCaloriesFromResult(log, profile) {
    const text = getWorkoutText(log, profile?.gender);
    const structure = getAmrapStructureFromText(text, profile);

    const mainBlocks = structure.mainBlocks || [];
    const extraBlocks = structure.extraBlocks || [];

    if (!mainBlocks.length && !extraBlocks.length) return null;

    const result = log?.result || {};
    const rounds = Number(result.rounds || 0);
    const reps = Number(result.reps || 0);

    const mainCaloriesPerRound = mainBlocks.reduce((sum, block) => {
      return sum + Number(block.calories || 0);
    }, 0);

    const extraCalories = extraBlocks.reduce((sum, block) => {
      return sum + Number(block.calories || 0);
    }, 0);

    let total = 0;
    total += mainCaloriesPerRound * rounds;

    const partial = buildAmrapPartialFromBlocks(mainBlocks, reps);
    total += partial.partialCalories;

    // Buy-In / Cash-Out nur einmal
    total += extraCalories;

    return {
      calories: Math.round(total * 10) / 10,
      durationMinutes: getDurationMinutesFromLog(log),
      method: "amrap_logged_rounds",
      partialSummary: buildAmrapPartialSummary(partial.segments)
    };
  }


    function buildFortimePartialFromBlocks(mainBlocks, extraUnits) {
      let remaining = Number(extraUnits || 0);
      let partialCalories = 0;
      const segments = [];

      for (const block of mainBlocks) {
        if (remaining <= 0) break;

        const targetUnits = Number(block.units || 0);
        if (!Number.isFinite(targetUnits) || targetUnits <= 0) continue;

        const doneUnits = Math.min(remaining, targetUnits);
        const ratio = doneUnits / targetUnits;
        const blockCalories = Number(block.calories || 0) * ratio;

        partialCalories += blockCalories;

        segments.push({
          raw: block.raw,
          doneUnits,
          targetUnits,
          calories: blockCalories
        });

        remaining -= doneUnits;
      }

      return {
        partialCalories,
        segments
      };
    }

      function getFortimeStructureFromText(text, profile) {
        let raw = String(text || "").replace(/\u00a0/g, " ");

        raw = raw.replace(/\s*•\s*/g, "\n• ");
        raw = raw.replace(/\s*BUY-IN:\s*/gi, "\nBUY-IN:\n");
        raw = raw.replace(/\s*CASH-OUT:\s*/gi, "\nCASH-OUT:\n");
        raw = raw.replace(/\s*-{4,}\s*/g, "\n--------------------\n");

        const lines = raw
          .split(/\n+/)
          .map(line => line.trim())
          .filter(Boolean);

        let repScheme = null;

        for (const line of lines) {
          if (/^\d+(?:-\d+)+$/.test(line)) {
            repScheme = line
              .split("-")
              .map(value => Number(value))
              .filter(value => Number.isFinite(value) && value > 0);
            break;
          }
        }

        const structure = {
          buyIn: [],
          main: [],
          cashOut: []
        };

        /* Mehrteilige WODs (Hero-Katalog: "Dann 3 Rounds:", "Then, 9 rounds
           of:") tragen je Abschnitt einen eigenen Multiplikator. Der alte Weg
           liess getRoundMultiplier das ERSTE "N Rounds" im Text auf ALLES
           wirken — bei FERN wurden so auch die 3200-m-Laeufe verneunfacht. */
        const hatAbschnitte = /(?:^|\n)\s*(?:·\s*)?(?:Dann|Then)\b/im.test(String(text || ""));
        structure.hatAbschnitte = hatAbschnitte;
        let abschnittMult = 1;

        let currentSection = "main";
        const mainMovements = [];
        const ladderExpanded = [];

        lines.forEach(line => {
          if (/^BUY-IN:?$/i.test(line)) {
            currentSection = "buyIn";
            return;
          }

          if (/^CASH-OUT:?$/i.test(line)) {
            currentSection = "cashOut";
            return;
          }

          if (hatAbschnitte) {
            const abschnitt = line.match(/^(?:·\s*)?(?:Dann|Then)[,:]?\s*(\d+)\s+Rounds?\b/i)
              || line.match(/^(?:·\s*)?(\d+)\s+Rounds?:$/i);
            if (abschnitt) { abschnittMult = Number(abschnitt[1]) || 1; return; }
            if (/^(?:·\s*)?(?:Dann|Then)[,:]?\s*$/i.test(line)) { abschnittMult = 1; return; }
            const kopfRunden = line.match(/^(\d+)\s+Rounds?\s+For\s+Time\b/i);
            if (kopfRunden) { abschnittMult = Number(kopfRunden[1]) || 1; }
          }

          if (
            /^For Time\b/i.test(line) ||
            /^\d+\s+Rounds?\s+For\s+Time\b/i.test(line) ||
            /^For Time\s*\(Chipper/i.test(line)
          ) {
            currentSection = "main";
            return;
          }

          if (/^-{4,}$/.test(line)) return;

          const normalizedLine = line.replace(/^[•\-\s]+/, "").trim();
          if (!normalizedLine) return;

          if (/^\d+(?:-\d+)+$/.test(normalizedLine)) {
            return;
          }

          const ladderMatch = normalizedLine.match(/^(\d+(?:-\d+)+)\s+(.+)$/);
          if (ladderMatch && currentSection === "main") {
            const ladderReps = ladderMatch[1]
              .split("-")
              .map(n => Number(n.trim()))
              .filter(n => Number.isFinite(n) && n > 0);

            const movementLabel = ladderMatch[2]
              .replace(/,\s*\d+(?:[.,]\d+)?\s*kg\b.*$/i, "")
              .trim();

            ladderReps.forEach(rep => {
              const parsed = parseWorkoutLineCalories(`${rep} ${movementLabel}`, profile);
              if (parsed && parsed.entryType !== "rest") {
                ladderExpanded.push(parsed);
              }
            });

            return;
          }

          if (repScheme && currentSection === "main") {
            /* Eine Zeile mit EIGENER Dosis ("7x 50 m Bear Crawl" in CARSE)
               ist kein Schema-Movement — sie wuerde sonst zu "21 7x 50 m..."
               expandiert und fiele still weg. Schema-Movements stehen ohne
               fuehrende Zahl da und parsen standalone nicht. */
            const eigenstaendig = parseWorkoutLineCalories(normalizedLine, profile);
            if (eigenstaendig && eigenstaendig.entryType !== "rest") {
              ladderExpanded.push(eigenstaendig);
              return;
            }

            const movementOnly = normalizedLine
              .replace(/,\s*\d+(?:[.,]\d+)?\s*kg\b.*$/i, "")
              .trim();

            if (!movementOnly) return;

            mainMovements.push({
              movementName: movementOnly
            });

            return;
          }

          const parsed = parseWorkoutLineCalories(normalizedLine, profile);
          if (!parsed || parsed.entryType === "rest") return;

          if (hatAbschnitte && abschnittMult !== 1) {
            parsed.calories *= abschnittMult;
            parsed.units *= abschnittMult;
          }

          if (currentSection === "main") {
            mainMovements.push(parsed);
          } else {
            structure[currentSection].push(parsed);
          }
        });

        /* Zusammenfuehren statt Verdraengen: die Schema-Expansion und die
           eigenstaendig dosierten Zeilen (ladderExpanded) ergaenzen sich —
           CARSE hat beides (21-18-15-... UND "7x 50 m Bear Crawl"). */
        if (repScheme && mainMovements.length) {
          const expanded = [];

          repScheme.forEach(rep => {
            mainMovements.forEach(mov => {
              const parsed = parseWorkoutLineCalories(
                `${rep} ${mov.movementName}`,
                profile
              );

              if (parsed && parsed.entryType !== "rest") {
                expanded.push(parsed);
              }
            });
          });

          structure.main = ladderExpanded.concat(expanded);
          return structure;
        }

        if (ladderExpanded.length) {
          structure.main = ladderExpanded;
          return structure;
        }

        structure.main = mainMovements;

        return structure;
      }

      function estimateFortimeCaloriesFromResult(log, profile) {
        const text = getWorkoutText(log, profile?.gender);
        const structure = getFortimeStructureFromText(text, profile);

        const buyInBlocks = structure.buyIn || [];
        const mainBlocks = structure.main || [];
        const cashOutBlocks = structure.cashOut || [];

        if (!buyInBlocks.length && !mainBlocks.length && !cashOutBlocks.length) {
          return null;
        }

        const result = log?.result || {};
        const isCompleted = log.resultType === "time" && result.finished !== false;

        // Mehrteilige Texte tragen ihre Multiplikatoren je Abschnitt in den
        // Bloecken selbst — ein globaler Faktor wuerde doppelt zaehlen.
        const prescribedRounds = structure.hatAbschnitte
          ? 1
          : Math.max(1, getRoundMultiplier(text));
        const completedRounds = Number(result.rounds || 0);
        const extraUnits = Number(result.reps || 0);
        const totalUnitsDone = Number(result.totalUnitsDone || 0);

        const buyInCalories = buyInBlocks.reduce((sum, block) => {
          return sum + Number(block.calories || 0);
        }, 0);

        const mainCycleCalories = mainBlocks.reduce((sum, block) => {
          return sum + Number(block.calories || 0);
        }, 0);

        const cashOutCalories = cashOutBlocks.reduce((sum, block) => {
          return sum + Number(block.calories || 0);
        }, 0);

        let total = buyInCalories;
        let partialSummary = "";

        if (isCompleted) {
          total += mainCycleCalories * prescribedRounds;
          total += cashOutCalories;

          return {
            calories: Math.round(total * 10) / 10,
            durationMinutes: getDurationMinutesFromLog(log),
            method: "fortime_completed",
            partialSummary: ""
          };
        }

        // ===== Sequential / Chipper Progress =====
        if (totalUnitsDone > 0 && (!completedRounds || completedRounds === 0) && (!extraUnits || extraUnits === 0)) {
          const partial = buildFortimePartialFromBlocks(mainBlocks, totalUnitsDone);
          total += partial.partialCalories;
          partialSummary = buildAmrapPartialSummary(partial.segments);

          return {
            calories: Math.round(total * 10) / 10,
            durationMinutes: getDurationMinutesFromLog(log),
            method: "fortime_capped_total_units",
            partialSummary
          };
        }

        // ===== Standard rounds + reps Progress =====
        total += mainCycleCalories * completedRounds;

        const partial = buildAmrapPartialFromBlocks(mainBlocks, extraUnits);
        total += partial.partialCalories;
        partialSummary = buildAmrapPartialSummary(partial.segments);

        return {
          calories: Math.round(total * 10) / 10,
          durationMinutes: getDurationMinutesFromLog(log),
          method: "fortime_capped_progress",
          partialSummary
        };
      }
    function hrCaloriesPerMinute(avgHr, profile) {
      const w = Number(profile.weightKg || 75);
      const a = Number(profile.age || 30);
      const g = profile.gender || "male";
      const hrRest = Number(profile.restingHr || 0);
      const hrMax  = Number(profile.maxHr || 0) || (220 - a);

      let kcalPerMin;
      let method;

      if (hrRest >= 30 && hrMax > hrRest + 20) {
        // %HRR-based (Swain 1994 + VO2max estimate) — more accurate for athletes
        // %HRR = %VO2max: VO2 ≈ pctHrr × VO2max
        const pctHrr = Math.max(0, Math.min(1, (avgHr - hrRest) / (hrMax - hrRest)));
        // VO2max estimate by gender + trainingLevel (ml/kg/min)
        const vo2maxTable = {
          male:   { beginner: 35, regular: 45, competitive: 58 },
          female: { beginner: 30, regular: 38, competitive: 50 }
        };
        const level = profile.trainingLevel || "regular";
        const vo2max = (vo2maxTable[g] || vo2maxTable.male)[level] || 45;
        // kcal/min = VO2 [ml/kg/min] × weight [kg] × 5 [kcal/L] / 1000
        kcalPerMin = pctHrr * vo2max * w * 5 / 1000;
        method = "hr_hrr";
      } else {
        // Keytel 2005 fallback (no resting HR available)
        if (g === "female") {
          kcalPerMin = (-20.4022 + 0.4472 * avgHr - 0.1263 * w + 0.074 * a) / 4.184;
        } else {
          kcalPerMin = (-55.0969 + 0.6309 * avgHr + 0.1988 * w + 0.2017 * a) / 4.184;
        }
        method = "hr_keytel";
      }

      if (kcalPerMin <= 0) return null;
      return { kcalPerMin, method };
    }

    // Direkter HR-Schätzer für den Timer (gleiche Formel wie estimateFromLog,
    // damit Anzeige im Log-Sheet und gespeicherter Wert identisch sind)
    function estimateHrCalories(avgHr, durationMinutes) {
      avgHr = Number(avgHr || 0);
      durationMinutes = Number(durationMinutes || 0);
      if (avgHr < 50 || durationMinutes <= 0) return null;

      const core = hrCaloriesPerMinute(avgHr, getProfileData());
      if (!core) return null;

      return {
        calories: Math.round(core.kcalPerMin * durationMinutes),
        durationMinutes: Number(durationMinutes.toFixed(1)),
        method: core.method
      };
    }

    function estimateFromLogHrBased(log, profile) {
      const avgHr = Number(log.avg_hr || 0);
      if (avgHr < 50) return null;

      const durationMinutes = getDurationMinutesFromLog(log);
      if (!durationMinutes || durationMinutes <= 0) return null;

      const core = hrCaloriesPerMinute(avgHr, profile);
      if (!core) return null;

      /* ===== INTERVALL-KORREKTUR (Benjamins Entscheidung, 31.08.2026) =====

         Keytel/HRR sind Regressionen auf STEADY-STATE-Arbeit. Eine Einheit,
         die zu zwei Dritteln aus vorgeschriebener Pause besteht (Strongman-
         E2MOM), passt nicht in ihren Gueltigkeitsbereich: dieselbe
         22-min-Einheit kam strukturell auf 94 kcal, ueber den Puls auf 230
         bis 309 (gemessen 28.08.2026).

         Flex-HR-Prinzip: die HR-Regression gilt nur fuer die ARBEITSzeit;
         die Pausen zaehlen als aktive Erholung mit 2,0 MET (Compendium of
         Physical Activities: Stehen/leichtes Hantieren zwischen Saetzen),
         also 2,0 x 3,5 x kg / 200 kcal/min. avg_hr ist fuer die Arbeitszeit
         eher zu NIEDRIG (die Pausen druecken den Schnitt) — das gleicht die
         Restueberschaetzung konservativ aus.

         Greift NUR, wenn das Log ein Zeitgeruest mit echter Arbeitszeit
         traegt (log.strongman aus strongman-pools.js). Alles andere —
         Metcons, Laeufe, Altlogs — rechnet unveraendert; an den alten
         Werten haengen XP und Historie. */
      const sm = log.strongman;
      const arbeitMin = Number(sm?.arbeitSek || 0) / 60;
      if (arbeitMin > 0 && arbeitMin < durationMinutes) {
        const pauseMin = durationMinutes - arbeitMin;
        const kg = Number(profile?.weightKg || 0) || 75;
        const erholungKcalMin = (2.0 * 3.5 * kg) / 200;
        return {
          calories: Math.round(core.kcalPerMin * arbeitMin + erholungKcalMin * pauseMin),
          durationMinutes: Number(durationMinutes.toFixed(1)),
          method: core.method + "_intervall"
        };
      }

      return {
        calories: Math.round(core.kcalPerMin * durationMinutes),
        durationMinutes: Number(durationMinutes.toFixed(1)),
        method: core.method
      };
    }

    /* ===== DIE AUFTEILUNG BEIM PARTNER-WOD =====

       Die Karte eines Partner-WODs beschreibt die Arbeit fuer ZWEI. Jeder
       strukturelle Schaetzer hier rechnet sie aber als die eines Menschen —
       er zaehlt Wiederholungen und Meter von der Karte. Wer die Haelfte
       gemacht hat, bekaeme also die doppelten Kalorien und, weil XP daran
       haengen, die doppelten Punkte.

       `log.partnerAnteil` ist der eigene Anteil zwischen 0 und 1. Fehlt er,
       wird nichts gekuerzt — jedes Einzel-WOD und jeder Altlog rechnen also
       weiter wie bisher.

       DER PULS WIRD NICHT GEKUERZT, und das ist der Kern:

         Ein Pulsgurt misst DEINEN Herzschlag ueber DEINE Zeit. Was er
         liefert, ist bereits dein eigener Verbrauch — dass daneben jemand
         stand, hat er schon eingerechnet, denn waehrend dessen Runde war
         dein Puls niedriger. Diese Zahl noch einmal zu halbieren waere
         schlicht falsch: sie wuerde die Pause zweimal abziehen.

       Erkennbar sind die Pulswege am Methodennamen: sie beginnen alle mit
       "hr_" (hr_hrr, hr_keytel). */
    function mitPartnerAnteil(schaetzung, log) {
      if (!schaetzung || !log) return schaetzung;
      const anteil = Number(log.partnerAnteil);
      if (!Number.isFinite(anteil) || anteil <= 0 || anteil >= 1) return schaetzung;
      if (/^hr_/.test(String(schaetzung.method || ""))) return schaetzung;

      const teile = schaetzung.breakdown || {};
      const skaliert = {};
      Object.keys(teile).forEach(function (k) {
        skaliert[k] = Math.round(Number(teile[k] || 0) * anteil);
      });

      return Object.assign({}, schaetzung, {
        calories: Math.round(Number(schaetzung.calories || 0) * anteil),
        breakdown: skaliert,
        partnerAnteil: anteil,
        /* Der Methodenname traegt die Kuerzung mit — sonst steht im Log eine
           Zahl, der man nicht ansieht, dass sie geteilt wurde. */
        method: String(schaetzung.method || "") + "_partner"
      });
    }

    function estimateFromLog(log) {
      return mitPartnerAnteil(estimateFromLogRoh(log), log);
    }

    function estimateFromLogRoh(log) {
      if (!log) return null;

      const profile = getProfileData();

      // HR-basiert hat Vorrang wenn Pulsdaten vorhanden
      const hrEst = estimateFromLogHrBased(log, profile);
      if (hrEst) {
        return {
          calories: hrEst.calories,
          durationMinutes: hrEst.durationMinutes,
          weightKg: profile.weightKg,
          heightCm: profile.heightCm || null,
          gender: profile.gender,
          method: hrEst.method,
          breakdown: {
            directCalories: hrEst.calories,
            distanceCalories: 0,
            repCalories: 0,
            classicSchemeCalories: 0
          }
        };
      }

      // Kraft-Session aus dem Plan-Reiter. Steht NACH der HR-Pruefung: liegt ein
      // Pulsschnitt vor (Gurt/Uhr), gewinnt die Messung immer ueber die Schaetzung.
      if (String(log.resultType || "").toLowerCase() === "strength_sets") {
        const sessionEstimate = estimateStrengthSessionCalories(log, profile);

        if (sessionEstimate) {
          return {
            calories: sessionEstimate.calories,
            durationMinutes: sessionEstimate.durationMinutes,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm || null,
            gender: profile.gender,
            method: sessionEstimate.method,
            breakdown: {
              directCalories: sessionEstimate.calories,
              distanceCalories: 0,
              repCalories: 0,
              classicSchemeCalories: 0
            }
          };
        }
      }

            const strengthEstimate = estimateStrengthBenchmarkCaloriesFromResult(log, profile);

            if (strengthEstimate) {
              return {
                calories: Math.round(strengthEstimate.calories),
                durationMinutes: strengthEstimate.durationMinutes,
                weightKg: profile.weightKg,
                heightCm: profile.heightCm || null,
                gender: profile.gender,
                method: strengthEstimate.method,
                breakdown: {
                  directCalories: Math.round(strengthEstimate.calories),
                  distanceCalories: 0,
                  repCalories: 0,
                  classicSchemeCalories: 0
                }
              };
            }


      // ===== GENERIC FOR LOAD =====
      if (String(log.resultType || "").toLowerCase() === "load") {
        const loadKg = Number(log?.result?.loadKg || 0);

        if (Number.isFinite(loadKg) && loadKg > 0) {
          const bodyFactor = getBodyFactor(profile);

          const estimated = (loadKg * 0.22 * bodyFactor) + (8 * bodyFactor);

          return {
            calories: Math.round(estimated),
            durationMinutes: null,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm || null,
            gender: profile.gender,
            method: "generic_load_estimated",
            breakdown: {
              directCalories: Math.round(estimated),
              distanceCalories: 0,
              repCalories: 0,
              classicSchemeCalories: 0
            }
          };
        }
      }

      /* STRONGMAN VOR OLY. Eine Strongman-Einheit traegt `wodType: "oly"`
         (Log-Sheet mit Gewicht je Uebung), gehoert aber nicht in die
         Oly-Rechnung — die Begruendung steht ueber
         estimateStrongmanCalories. Steht NACH der HR-Pruefung: liegt ein
         Pulsschnitt vor, gewinnt die Messung. */
      const strongmanEstimate = estimateStrongmanCalories(log, profile);
      if (strongmanEstimate) {
        return {
          calories: strongmanEstimate.calories,
          durationMinutes: strongmanEstimate.durationMinutes,
          weightKg: profile.weightKg,
          heightCm: profile.heightCm || null,
          gender: profile.gender,
          method: strongmanEstimate.method,
          breakdown: {
            directCalories: strongmanEstimate.calories,
            distanceCalories: 0,
            repCalories: 0,
            classicSchemeCalories: 0
          }
        };
      }

      /* `!istStrongmanLog` ist kein Schoenheitsfehler, sondern der Fall
         BESTANDSLOG: eine Strongman-Einheit vor dem 28.08.2026 hat kein
         Zeitgeruest, faellt oben also durch — und traegt trotzdem
         `wodType: "oly"`. Wer damals Gewichte eingetragen hat, bekam hier
         die Oly-Rechnung: 21 kcal fuer 22 Minuten (nachgemessen). Ohne
         diese Sperre bleibt genau der Fehler stehen, wegen dem dieser
         ganze Umbau da ist. */
      if (log.wodType === "oly" && !istStrongmanLog(log)) {
        const olyEstimate = estimateOlyCaloriesFromResult(log, profile);

        /* KEIN hartes `return null` mehr (28.08.2026). Ohne eingetragene
           Gewichte lieferte estimateOlyCaloriesFromResult `null`, und das
           beendete die ganze Schaetzung — der Log bekam 0 kcal und 0 XP,
           obwohl darunter noch der Textweg und der Dauer-Rueckfall stehen.
           Jetzt faellt der Weg durch wie bei jedem anderen wodType. */
        if (olyEstimate) {
          return {
            calories: Math.round(olyEstimate.calories),
            durationMinutes: olyEstimate.durationMinutes,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm || null,
            gender: profile.gender,
            method: olyEstimate.method,
            breakdown: {
              directCalories: Math.round(olyEstimate.calories),
              distanceCalories: 0,
              repCalories: 0,
              classicSchemeCalories: 0
            }
          };
        }
      }

      /* STRONGMAN OHNE ZEITGERUEST GEHT NICHT DURCH DAS TEXTPARSEN.
         Gemessen am 28.08.2026 an allen fuenf Formaten mal drei Fenstern:
         der Textweg liest die Rundenzahl nicht, weil sie beim Strongman in
         einer Kopfzeile steht ("Alle 2 Minuten, 8 Runden:") und nicht als
         "8 Rounds". Ein Medley kam deshalb auf 38 kcal — dieselben 38, ob
         es 6 oder 26 Minuten dauerte. Und eine TEILerkennung ist schlimmer
         als gar keine: sie liefert eine kleine Zahl ueber null und
         unterdrueckt damit den Rueckfall, der darunter steht.

         Betroffen sind nur geteilte und von Hand bearbeitete Einheiten —
         alles frisch Erzeugte traegt sein Zeitgeruest und ist oben schon
         beantwortet. */
      if (istStrongmanLog(log)) {
        const smFallback = estimateFromDurationFallback(log, profile);
        if (smFallback) {
          return {
            calories: smFallback.calories,
            durationMinutes: smFallback.durationMinutes,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm || null,
            gender: profile.gender,
            method: smFallback.method,
            breakdown: {
              directCalories: smFallback.calories,
              distanceCalories: 0,
              repCalories: 0,
              classicSchemeCalories: 0
            }
          };
        }
      }

      const text = getWorkoutText(log, profile?.gender);
      if (!text.trim()) return null;

      const wodType = String(log.wodType || "").toLowerCase();

      // ===== EMOM Speziallogik =====
      if (wodType === "emom") {
        const emomEstimate = estimateEmomCaloriesFromResult(log, profile);

        if (emomEstimate) {
          return {
            calories: Math.round(emomEstimate.calories),
            durationMinutes: emomEstimate.durationMinutes,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm || null,
            gender: profile.gender,
            method: emomEstimate.method,
            breakdown: {
              directCalories: Math.round(emomEstimate.calories),
              distanceCalories: 0,
              repCalories: 0,
              classicSchemeCalories: 0
            }
          };
        }
      }

      // ===== AMRAP Speziallogik =====
      if (wodType === "amrap") {
        const amrapEstimate = estimateAmrapCaloriesFromResult(log, profile);

        if (amrapEstimate) {
          return {
            calories: Math.round(amrapEstimate.calories),
            durationMinutes: amrapEstimate.durationMinutes,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm || null,
            gender: profile.gender,
            method: amrapEstimate.method,
            partialSummary: amrapEstimate.partialSummary || "",
            breakdown: {
              directCalories: Math.round(amrapEstimate.calories),
              distanceCalories: 0,
              repCalories: 0,
              classicSchemeCalories: 0
            }
          };
        }
      }

      // ===== FOR TIME / CHIPPER =====
      if (wodType === "fortime" || wodType === "chipper") {
        const fortimeEstimate = estimateFortimeCaloriesFromResult(log, profile);

        if (fortimeEstimate) {
          const adjusted = applyIntensityAdjustment(
            fortimeEstimate.calories,
            fortimeEstimate.durationMinutes
          );
          return {
            calories: Math.round(adjusted),
            durationMinutes: fortimeEstimate.durationMinutes,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm || null,
            gender: profile.gender,
            method: fortimeEstimate.method,
            partialSummary: fortimeEstimate.partialSummary || "",
            breakdown: {
              directCalories: Math.round(adjusted),
              distanceCalories: 0,
              repCalories: 0,
              classicSchemeCalories: 0
            }
          };
        }
      }

      let roundMultiplier = getRoundMultiplier(text);

      // ===== AMRAP: geloggte Runden bevorzugen =====
      if (/AMRAP\s+(\d+)/i.test(text) && log?.resultType === "rounds_reps") {
        const roundsDone = Number(log.result.rounds || 0);
        if (roundsDone > 0) {
          roundMultiplier = roundsDone;
        }
      }

      // ===== EMOM: aus Text nur als Fallback ableiten =====
      if (/E\d*MOM\s+(\d+)/i.test(text)) {
        const match = text.match(/E\d*MOM\s+(\d+)/i);
        if (match) {
          const totalMinutes = Number(match[1]);
          const lines = text.split("\n").filter(l => /Min\s*\d+/i.test(l));

          if (lines.length > 0) {
            const cycleLength = lines.length;
            const cycles = Math.floor(totalMinutes / cycleLength);
            roundMultiplier = cycles || 1;
          }
        }
      }

      const workoutEntries = extractWorkoutEntries(text, roundMultiplier, profile);
      const classicRepSchemeEntries = extractClassicRepSchemeEntries(text, profile);

      const directCalories = workoutEntries
        .filter(item => item.entryType === "direct")
        .reduce((sum, item) => sum + item.calories, 0);

      const distanceCalories = workoutEntries
        .filter(item => item.entryType === "distance")
        .reduce((sum, item) => sum + item.calories, 0);

      const repCalories = workoutEntries
        .filter(item => item.entryType === "reps")
        .reduce((sum, item) => sum + item.calories, 0);

      const classicSchemeCalories = classicRepSchemeEntries
        .reduce((sum, item) => sum + item.calories, 0);

      const totalCalories =
        directCalories + distanceCalories + repCalories + classicSchemeCalories;

      if (totalCalories <= 0) {
        const fallback = estimateFromDurationFallback(log, profile);
        if (!fallback) return null;

        return {
          calories: fallback.calories,
          durationMinutes: fallback.durationMinutes,
          weightKg: profile.weightKg,
          heightCm: profile.heightCm || null,
          gender: profile.gender,
          method: fallback.method,
          breakdown: {
            directCalories: 0,
            distanceCalories: 0,
            repCalories: 0,
            classicSchemeCalories: 0
          }
        };
      }

      const durationMinutes = getDurationMinutesFromLog(log);

      return {
        calories: Math.round(totalCalories),
        durationMinutes: durationMinutes ? Number(durationMinutes.toFixed(1)) : null,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm || null,
        gender: profile.gender,
        method: "parsed_workout",
        breakdown: {
          directCalories: Math.round(directCalories),
          distanceCalories: Math.round(distanceCalories),
          repCalories: Math.round(repCalories),
          classicSchemeCalories: Math.round(classicSchemeCalories)
        }
      };
    }

  window.CalorieEstimator = {
    normalizeMovementName,
    getMovementData,
    getDurationMinutesFromLog,
    estimateFromLog,
    estimateHrCalories,
    estimateStrengthSessionCalories,
    estimateStrongmanCalories,
    /* Herausgereicht fuer den Test der Namensumstellung (27.08.2026): das WOD
       heisst jetzt "TOTAL", Bestandslogs tragen "CROSSFIT TOTAL" — beide
       muessen erkannt werden, und das laesst sich nur pruefen, wenn man die
       Erkennung aufrufen kann. */
    getStrengthBenchmarkType,
    /* Herausgereicht fuer die Box-Anbindung (22.09.2026): welche Zeile eines
       Box-Whiteboards der Rechner versteht, laesst sich nur Zeile fuer Zeile
       messen (tests/box-kalorien.test.mjs). */
    parseWorkoutLineCalories,
    bereinigeWhiteboardZeile,
    lockereNamen
  };
})();
