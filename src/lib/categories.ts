// src/lib/categories.ts
import { prisma } from "@/lib/prisma";

export const CATEGORY_LABELS: Record<string, string> = {
  "GENERAL": "📌 Général",
  "SPORT": "🏆 Sport / Compétition",
  "SOIREE": "🎉 Soirée / Fête",
  "COMITS": "🎭 Comits / Spectacle",
  "CULTURE": "🎨 Culture / Art",
  "INFO": "ℹ️ Information",
  "COVOITURAGE": "🚗 Covoiturage",
  "ADMINISTRATIVE": "📂 Administrative",
  "GALA": "🥂 Gala",
  "AUTRE": "📌 Autre"
};

/**
 * Récupère les catégories autorisées pour un utilisateur
 */
export async function getAuthorizedCategories(userTags: string[], isSuperAdmin: boolean) {
  if (isSuperAdmin) return Object.keys(CATEGORY_LABELS);

  // On cherche en BDD quelles catégories sont liées aux tags de l'user
  const mappings = await prisma.categoryMapping.findMany({
    where: { tag: { in: userTags } }
  });

  const authorized = mappings.map(m => m.category);
  
  // On ajoute toujours "GENERAL" et "AUTRE" par défaut si tu veux
  return Array.from(new Set([...authorized, "GENERAL", "AUTRE"]));
}