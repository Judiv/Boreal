import cron from 'node-cron';
import { globalStorageCleanup } from './cleanup-bot';
import { prisma } from './prisma';

/**
 * Initialisation des tâches automatiques du système
 */
export function initCronJobs() {
  // '0 3 * * *' = Exécution tous les jours à 03:00 du matin
  cron.schedule('0 3 * * *', async () => {
    console.log("🕒 [SYSTEM-CRON] Lancement de la maintenance nocturne...");
    
    try {
      // 1. Exécution du bot (Nettoyage fichiers + Purge logs > 30 jours)
      const result = await globalStorageCleanup();
      
      // 2. Enregistrement du rapport dans la table Log
      await prisma.log.create({
        data: {
          action: result.success ? "CLEANUP_AUTO_SUCCESS" : "CLEANUP_AUTO_ERROR",
          details: result.success 
            ? `Maintenance réussie : ${result.deletedCount} fichiers orphelins supprimés (${result.spaceSavedMB} Mo libérés) et ${result.deletedLogsCount ?? 0} anciens logs purgés.`
            : `Échec de la maintenance : ${result.error}`,
          // Pas de userId car c'est une action système (Automatique)
        }
      });

      if (result.success) {
        console.log(`✅ [SYSTEM-CRON] Maintenance terminée avec succès.`);
      }
      
    } catch (err: any) {
      console.error("🔥 [SYSTEM-CRON] Erreur critique lors de l'exécution :", err);
      
      // Log de l'erreur fatale pour diagnostic dans l'interface
      try {
        await prisma.log.create({
          data: {
            action: "CLEANUP_AUTO_CRITICAL",
            details: `Erreur fatale système : ${err.message}`,
          }
        });
      } catch (logErr) {
        console.error("Impossible d'écrire le log d'erreur en base de données.");
      }
    }
  }, {
    scheduled: true,
    timezone: "Europe/Paris"
  });

  console.log("🤖 Bot de maintenance planifié pour 03:00 (Fichiers & Logs)");
}