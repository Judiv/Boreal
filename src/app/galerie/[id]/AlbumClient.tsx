"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { ArrowLeft, Upload, Trash2, Expand } from "lucide-react";
import Link from "next/link";
import styles from "../galerie.module.css";
import PhotoModal from "../PhotoModal";
import UploadPhotosModal from "../UploadPhotosModal";
import { deletePhoto } from "../actions"; 

export default function AlbumClient({ album, canManage }: { album: any, canManage: boolean }) {
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const router = useRouter();

  // Fonction utilitaire pour forcer le passage par l'API
  const getSafeUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/api/uploads/")) return url;
    // Extrait le nom du fichier (dernière partie de l'URL) pour l'envoyer à l'API
    const filename = url.split("/").pop();
    return `/api/uploads/${filename}`;
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette photo ?")) return;
    try {
      await deletePhoto(photoId);
      setSelectedPhoto(null); 
      router.refresh(); 
    } catch (error) {
      alert("Erreur lors de la suppression de la photo");
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/galerie" className={styles.backLink}>
            <ArrowLeft size={16} /> Retour
          </Link>
          <h1 className={styles.title}>{album.nom}</h1>
          <p className={styles.subtitle}>Par {album.auteur} • {album.photos.length} photos</p>
        </div>

        {canManage && (
          <button 
            className={styles.addBtn} 
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload size={20} />
            <span>Ajouter des photos</span>
          </button>
        )}
      </header>

      <section className={styles.photoGrid}>
        {album.photos.map((photo: any) => {
          // On génère l'URL sécurisée pour l'API
          const safeUrl = getSafeUrl(photo.url);

          return (
            <div 
              key={photo.id} 
              className={styles.photoCard}
              onClick={() => setSelectedPhoto({ ...photo, url: safeUrl })}
            >
              {canManage && (
                <button 
                  className={styles.quickDeleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo.id);
                  }}
                  title="Supprimer la photo"
                >
                  <Trash2 size={16} />
                </button>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={safeUrl} 
                alt={photo.titre || "Photo"} 
                loading="lazy"
              />
              
              <div className={styles.photoOverlay}>
                <span className="text-white text-xs font-bold">{photo.titre}</span>
                <Expand size={18} className="text-white opacity-70" />
              </div>
            </div>
          );
        })}
      </section>

      {isUploadOpen && (
        <UploadPhotosModal 
          folderId={album.id} 
          onClose={() => setIsUploadOpen(false)}
        />
      )}

      {selectedPhoto && (
        <PhotoModal 
          photo={selectedPhoto} 
          canManage={canManage}
          onClose={() => setSelectedPhoto(null)} 
          onDelete={handleDeletePhoto} 
        />
      )}
    </>
  );
}