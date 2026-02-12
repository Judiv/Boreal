"use server";

import { revalidatePath } from "next/cache";

/**
 * Action serveur pour forcer la mise à jour du solde Borgia
 * sans recharger la page complète.
 */
export async function refreshBorgiaBalance() {
  try {
    // On appelle ta route GET /api/borgia/balance (ou l'URL correspondante)
    // Cela force le scraper à s'exécuter côté serveur
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/borgia/balance`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error("Échec de la récupération du solde");
    }

    // Déclenche la revalidation de la page d'accueil (ou du layout)
    // pour mettre à jour les composants utilisant le solde
    revalidatePath("/");
    
    return await response.json();
  } catch (error) {
    console.error("Erreur lors du rafraîchissement Borgia:", error);
    return { error: "Impossible d'actualiser le solde" };
  }
}