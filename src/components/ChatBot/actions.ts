"use server";

import { prisma } from "@/lib/prisma";

export async function askMistral(prompt: string) {
  try {
    // 1. Récupération des données fraîches du site
    const now = new Date();
    const upcomingEvents = await prisma.event.findMany({
      where: { date: { gte: now } },
      take: 3,
      orderBy: { date: 'asc' },
      select: { titre: true, date: true, lieu: true }
    });

    const latestNews = await prisma.news.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: { titre: true }
    });

    // 2. Construction du contexte dynamique
    const eventContext = upcomingEvents.length > 0 
      ? upcomingEvents.map(e => `- ${e.titre} le ${e.date.toLocaleDateString('fr-FR')} à ${e.lieu}`).join("\n")
      : "Aucun événement prévu pour le moment.";

    const newsContext = latestNews.length > 0
      ? latestNews.map(n => `- ${n.titre}`).join("\n")
      : "Pas de news récentes.";

    // 3. Prompt Système enrichi
    const systemInstructions = `
      Tu es Boreal AI, l'assistant des étudiants Gadzarts. 
      Voici les infos actuelles du site pour t'aider à répondre :
      
      PROCHAINES FÊTES :
      ${eventContext}
      
      DERNIÈRES NEWS :
      ${newsContext}
      
      CONSIGNES :
      - Si l'utilisateur demande "C'est quand la prochaine soirée ?", utilise les infos ci-dessus.
      - Sois amical, concis et utilise le jargon Gadzarts.
      - Réponds toujours en français.
    `;

    // 4. Appel à Mistral (Ollama)
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: `${systemInstructions}\n\nUtilisateur: ${prompt}\nAssistant:`,
        stream: false
      }),
    });

    if (!response.ok) throw new Error("Erreur serveur IA");

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Erreur ChatBot:", error);
    return "Je n'arrive pas à joindre l'Usine, mais jette un œil à l'onglet Fête pour les prochaines soirées ! 🛠️";
  }
}