// src/app/galerie/page.tsx
import { prisma } from "@/lib/prisma";
import { hasPermission, getUser } from "@/lib/auth";
import GalerieClient from "./GalerieClient";
import styles from "./galerie.module.css";
import AuthGuard from "@/components/AuthGuard";

export const dynamic = "force-dynamic";

export default async function GaleriePage() {
  const user = await getUser().catch(() => null);
  // On récupère les dossiers avec leurs photos pour l'affiche aléatoire
  const folders = await prisma.galleryFolder.findMany({
    include: { 
      photos: true,
      _count: { select: { photos: true } } 
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const canManage = await hasPermission("manage_photos");

  return (
    <AuthGuard user={user}>
      <div className={styles.container}>
        <div className={styles.bgDecor}>
          <div className={styles.blob} />
          <div className={styles.gridOverlay} />
        </div>

        {/* On passe les données au composant Client qui gère la logique interactive */}
        <GalerieClient folders={folders} canManage={canManage} />
      </div>
    </AuthGuard>
  );
}