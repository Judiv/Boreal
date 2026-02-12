"use server";

import { fromZonedTime } from "date-fns-tz";
import logger from "@/lib/logger";

const tz = "Europe/Paris";

export async function GetCalendar(username: string | null) {
  const URI = "http://lise.ensam.eu/ical_apprenant/";
  
  if (!username) {
    logger.warn("Tentative de récupération sans username");
    return [];
  }

  try {
    const res = await fetch(`${URI}${username}`, { 
        method: "GET",
        headers: { "cache-control": "no-cache" },
        next: { revalidate: 600 } 
    });

    if (!res.ok) {
      logger.error("Erreur réponse ENSAM", { status: res.status });
      return [];
    }

    const data = await res.text();

    // On coupe par événement
    const vevents = data.split("BEGIN:VEVENT");
    vevents.shift(); // Enlève le header global

    const events = vevents.map((block, index) => {
      
      // --- 1. FONCTIONS D'EXTRACTION ROBUSTES ---
      
      // Extrait une valeur simple (ex: LOCATION:Salle 22)
      const extractSimple = (key: string) => {
        const reg = new RegExp(`${key}:(.*)`, "i");
        const match = block.match(reg);
        // On nettoie les \n et les espaces qui traînent
        return match ? match[1].replace(/\\n/g, "").trim() : "";
      };

      // Extrait une valeur dans la DESCRIPTION (ex: - MODULES : Gestion)
      // Cette Regex cherche le tiret, la clé, et prend tout jusqu'au prochain \n ou la fin de ligne
      const extractFromDesc = (key: string) => {
        // Regex expliquée :
        // - \s* : espaces optionnels
        // : \s* : les deux points
        // (.*?) : CAPTURE le contenu
        // (?:\\n|\r|\n|$) : S'arrête au prochain saut de ligne (encodé ou réel)
        const reg = new RegExp(`-\\s*${key}\\s*:\\s*(.*?)(?:\\\\n|\\r|\\n|$)`, "i");
        const match = block.match(reg);
        return match ? match[1].trim() : null;
      };

      // --- 2. EXTRACTION DES DONNÉES ---

      const dtStart = extractSimple("DTSTART");
      const dtEnd = extractSimple("DTEND");
      
      // --- CORRECTION DÉFINITIVE AVEC DATE-FNS-TZ ---
      const parseToParisTime = (dateStr: string) => {
        if (!dateStr) return new Date();
        
        // 1. On reformate la chaîne iCal (20260206T080000) en ISO (2026-02-06T08:00:00)
        // On utilise un Regex pour découper proprement les morceaux
        const formattedDate = dateStr.replace(
          /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).*$/,
          "$1-$2-$3T$4:$5:$6"
        );

        // 2. On utilise fromZonedTime pour dire :
        // "Cette date (formattedDate) correspond à l'heure locale de Paris."
        // La librairie va automatiquement calculer le bon Timestamp UTC.
        return fromZonedTime(formattedDate, "Europe/Paris");
      };

      const startDate = parseToParisTime(dtStart);
      const endDate = parseToParisTime(dtEnd);

      // Récupération via la nouvelle méthode robuste
      const typeActivite = extractFromDesc("TYPE_ACTIVITE"); // ex: CM
      const modules = extractFromDesc("MODULES"); // ex: Science de gestion...
      const intervenants = extractFromDesc("INTERVENANTS"); // ex: ZABEL Anne-Lise
      const groupes = extractFromDesc("GROUPES"); // ex: GIM1 S6

      // Fallback : Si pas de module dans la description, on prend le SUMMARY
      const rawSummary = extractSimple("SUMMARY");
      const finalTitle = modules || rawSummary;

      return {
        id: `ensam-${index}-${dtStart}`,
        // On met le titre au propre (enlève les \n qui traînent parfois)
        titre: finalTitle.replace(/\\n/g, " "), 
        dateDebut: startDate,
        dateFin: endDate,
        lieu: extractSimple("LOCATION") || "Salle inconnue",
        prof: intervenants || "N/A",
        group: groupes || "N/A",
        
        // C'est ICI que la couleur se joue : on force en MAJUSCULES
        typeCours: typeActivite,
        type: "ENSAM"
      };
    });

    logger.info("Sync réussie", { count: events.length });
    return events;

  } catch (e) {
    logger.error("Erreur Parser", { message: String(e) });
    return [];
  }
}