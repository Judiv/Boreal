// src/app/galerie/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/auth";
import { notFound } from "next/navigation";
import AlbumClient from "./AlbumClient";
import styles from "../galerie.module.css";

// ✅ On précise que params est une Promise
export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params; // 👈 On attend la résolution ici
  const albumId = parseInt(resolvedParams.id);

  if (isNaN(albumId)) notFound();

  const album = await prisma.galleryFolder.findUnique({
    where: { id: albumId },
    include: { 
      photos: { orderBy: { createdAt: 'desc' } } 
    }
  });

  if (!album) notFound();

  const canManage = await hasPermission("manage_photos");

  return (
    <div className={styles.container}>
      <div className={styles.bgDecor}>
        <div className={styles.blob} />
        <div className={styles.gridOverlay} />
      </div>

      <AlbumClient album={album} canManage={canManage} />
    </div>
  );
}