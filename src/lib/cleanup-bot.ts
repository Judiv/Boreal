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