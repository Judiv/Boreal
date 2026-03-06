import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';

/**
 * Bot de nettoyage du stockage Boreal + Purge des vieux Logs
 * Scanne /public/uploads et supprime les fichiers orphelins.
 * Supprime les logs vieux de plus de 30 jours.
 */
export async function globalStorageCleanup() {
  const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
  
  console.log("--- [BOT] DÉBUT DU NETTOYAGE ---");
  console.log("Cible :", uploadDir);

  try {
    // 1. Gestion des fichiers sur le disque
    const items = await fs.readdir(uploadDir, { withFileTypes: true });
    const filesOnDisk = items
      .filter(i => i.isFile())
      .map(i => i.name);
    
    console.log(`Fichiers détectés sur disque : ${filesOnDisk.length}`);

    // 2. Récupération de toutes les références en DB
    const [news, boquettes, photos, thuysses, events, sports, attachments] = await Promise.all([
      prisma.news.findMany({ select: { imageUrl: true, pdfUrl: true } }),
      prisma.boquette.findMany({ select: { imageUrl: true } }),
      prisma.photo.findMany({ select: { url: true } }),
      prisma.thuysse.findMany({ select: { url: true } }),
      prisma.event.findMany({ select: { imageUrl: true } }),
      prisma.sport.findMany({ select: { imageUrl: true } }),
      prisma.attachment.findMany({ select: { url: true } }),
    ]);

    // 3. Set de comparaison (Casse normalisée)
    const validFiles = new Set<string>();
    const register = (url: string | null | undefined) => {
      if (url) {
        const name = path.basename(url).toLowerCase().trim();
        validFiles.add(name);
      }
    };

    news.forEach(n => { register(n.imageUrl); register(n.pdfUrl); });
    boquettes.forEach(b => register(b.imageUrl));
    photos.forEach(p => register(p.url));
    thuysses.forEach(t => register(t.url));
    events.forEach(e => register(e.imageUrl));
    sports.forEach(s => register(s.imageUrl));
    attachments.forEach(a => register(a.url));

    let deletedFilesCount = 0;
    let bytesSaved = 0;
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    // 4. Boucle de suppression des fichiers
    for (const fileName of filesOnDisk) {
      if (['.gitignore', '.keep', 'web.config'].includes(fileName.toLowerCase())) continue;

      const diskNameLower = fileName.toLowerCase().trim();

      if (!validFiles.has(diskNameLower)) {
        const fullPath = path.join(uploadDir, fileName);
        
        try {
          const stats = await fs.stat(fullPath);
          
          if (now - stats.mtimeMs > ONE_HOUR) {
            bytesSaved += stats.size;
            await fs.unlink(fullPath);
            deletedFilesCount++;
            console.log(`✅ [CLEANUP] Fichier supprimé : ${fileName}`);
          }
        } catch (err) {
          console.error(`❌ [CLEANUP] Erreur fichier ${fileName} :`, err);
        }
      }
    }

    // --- 🛡️ 5. OPTIMISATION : PURGE DES VIEUX LOGS ---
    console.log("--- [BOT] PURGE DES ANCIENS LOGS ---");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedLogs = await prisma.log.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    });
    console.log(`✅ [CLEANUP] ${deletedLogs.count} anciens logs supprimés (RGPD/Optimisation).`);

    const spaceSavedMB = (bytesSaved / (1024 * 1024)).toFixed(2);
    console.log(`--- [BOT] FIN : ${deletedFilesCount} fichiers et ${deletedLogs.count} logs supprimés ---`);

    return {
      success: true,
      deletedCount: deletedFilesCount,
      deletedLogsCount: deletedLogs.count, // On renvoie aussi le compte des logs
      spaceSavedMB,
      timestamp: Date.now()
    };

  } catch (error: any) {
    console.error("🔥 [BOT] ERREUR FATALE :", error);
    return { 
      success: false, 
      error: error.message || "Erreur lors du nettoyage" 
    };
  }
}

export async function runFullMaintenance() {
  // On utilise des dates basées sur l'UTC pour éviter les décalages Serveur/Client
  const now = new Date();
  
  // --- CALCUL DU LUNDI DE LA SEMAINE PASSÉE (00:00:00.000 UTC) ---
  const lastMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOfWeek = lastMonday.getUTCDay(); // 0 (Dim) à 6 (Sam)
  const diffToThisMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // On recule jusqu'au lundi de cette semaine, puis -7 jours pour la semaine passée
  lastMonday.setUTCDate(lastMonday.getUTCDate() - diffToThisMonday - 7);
  lastMonday.setUTCHours(0, 0, 0, 0);

  // --- CALCUL DU SEUIL POUR LES NOTIFICATIONS (7 jours pile en arrière UTC) ---
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

  try {
    const report = await prisma.$transaction(async (tx) => {
      
      // 1. Suppression des Events & Planning (Semaine passée terminée)
      const oldPlanning = await tx.planningEvent.deleteMany({
        where: { dateFin: { lt: lastMonday } }
      });

      const oldEvents = await tx.event.deleteMany({
        where: { date: { lt: lastMonday } }
      });

      // 2. Nettoyage Ride & Sport (Terminé à l'instant T UTC)
      const oldRides = await tx.ride.deleteMany({
        where: { dateHeure: { lt: now } }
      });

      const oldSportSessions = await tx.sportSession.deleteMany({
        where: { endDate: { lt: now } }
      });

      // 3. Sécurité : Tokens de mot de passe expirés
      const expiredTokens = await tx.passwordResetToken.deleteMany({
        where: { expires: { lt: now } }
      });

      // 4. CORRECTION NOTIFICATIONS : 
      // Si tu veux tout supprimer (même non lues), enlève "isRead: true"
      const cleanedNotifs = await tx.notification.deleteMany({
        where: { 
          // On garde isRead: true si tu ne veux supprimer que les lues
          isRead: true, 
          createdAt: { lt: sevenDaysAgo } 
        }
      });

      // 5. Purge des Logs (3 mois glissants UTC)
      const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      const deletedLogs = await tx.log.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } }
      });

      return {
        planningDeleted: oldPlanning.count,
        eventsDeleted: oldEvents.count,
        ridesDeleted: oldRides.count,
        sportsDeleted: oldSportSessions.count,
        tokensCleared: expiredTokens.count,
        logsCleared: deletedLogs.count,
        notifsCleared: cleanedNotifs.count,
        cutoffDateUTC: lastMonday.toUTCString()
      };
    });

    console.log(`✅ Maintenance UTC terminée. Seuil : ${report.cutoffDateUTC}`);
    return { success: true, report };
  } catch (error) {
    console.error("❌ Erreur Maintenance :", error);
    return { success: false, error };
  }
}

export async function runGlobalBotMaintenance() {
  console.log("🤖 [BOT] Lancement de la maintenance globale...");
  
  // 1. Nettoyage des fichiers et vieux logs (30j)
  const storageResult = await globalStorageCleanup();
  
  // 2. Nettoyage de la base de données (Events, Rides, Sports, etc.)
  const dbResult = await runFullMaintenance();

  return {
    storage: storageResult,
    database: dbResult,
    completedAt: new Date().toISOString()
  };
}