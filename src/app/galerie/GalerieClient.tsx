"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EditFolderModal from "./EditFolderModal";
import { 
  FolderPlus, Images, Calendar, ArrowRight, 
  User, Trash2, Pencil // ✅ Ajout de Pencil pour l'édition
} from "lucide-react";
import { deleteFolder } from "./actions"; 
import CreateFolderModal from "./CreateFolderModal";
import styles from "./galerie.module.css";

export default function GalerieClient({ folders, canManage }: { folders: any[], canManage: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const [editingFolder, setEditingFolder] = useState<any>(null);

  // ✅ Suppression
  const handleDelete = async (e: React.MouseEvent, id: number, name: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    if (confirm(`Es-tu sûr de vouloir supprimer l'album "${name}" et toutes ses photos ?`)) {
      try {
        await deleteFolder(id);
        router.refresh();
      } catch (error) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  // ✅ Édition
  const handleEditClick = (e: React.MouseEvent, folder: any) => {
    e.preventDefault(); // Empêche d'ouvrir l'album
    e.stopPropagation(); // Empêche le clic de remonter au Link
    setEditingFolder(folder);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>GALERIE <span>PHOTOS</span></h1>
          <p className={styles.subtitle}>Revivez les meilleurs moments de la communauté</p>
        </div>

        {canManage && (
          <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
            <FolderPlus size={20} />
            <span>Créer un album</span>
          </button>
        )}
      </header>

      <section className={styles.gridSection}>
        {folders.length === 0 ? (
          <div className={styles.empty}>
            <Images size={48} className="opacity-20 mb-4" />
            <p>Aucun album photo pour le moment.</p>
          </div>
        ) : (
          <div className={styles.folderGrid}>
            {folders.map(folder => {
              const hasPhotos = folder.photos && folder.photos.length > 0;
              const randomPhoto = hasPhotos 
                ? folder.photos[Math.floor(Math.random() * folder.photos.length)].url 
                : null;

              return (
                <Link href={`/galerie/${folder.id}`} key={folder.id} className={styles.folderCard}>
                  
                  {/* ✅ ACTIONS DE GESTION (Edit & Delete) */}
                  {canManage && (
                    <div className={styles.actionGroup}>
                      <button 
                        className={styles.editBtn}
                        onClick={(e) => handleEditClick(e, folder)}
                        title="Modifier l'album"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={(e) => handleDelete(e, folder.id, folder.nom)}
                        title="Supprimer l'album"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  <div className={styles.folderIconWrapper}>
                    {randomPhoto ? (
                      <img src={randomPhoto} alt="" className={styles.folderAffiche} />
                    ) : (
                      <Images size={32} className={styles.folderIcon} />
                    )}
                    <div className={styles.photoCount}>{folder._count.photos}</div>
                  </div>
                  
                  <div className={styles.folderContent}>
                    <h3 className={styles.folderName}>{folder.nom}</h3>
                    
                    <div className={styles.folderDetails}>
                      <div className={styles.folderMeta}>
                        <User size={12} /> <span>{folder.auteur || "Auteur inconnu"}</span>
                      </div>
                      <div className={styles.folderMeta}>
                        <Calendar size={12} />
                        <span>{new Date(folder.createdAt).toLocaleDateString('fr-FR', { year: 'numeric' })}</span>
                      </div>
                    </div>

                    {folder.description && <p className={styles.folderDescription}>{folder.description}</p>}

                    <div className={styles.viewLink}>
                      Voir l'album <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {isModalOpen && <CreateFolderModal onClose={() => setIsModalOpen(false)} />}

      {/* ✅ RENDU DE LA MODAL D'ÉDITION */}
      {editingFolder && (
        <EditFolderModal 
          folder={editingFolder} 
          onClose={() => setEditingFolder(null)} 
        />
      )}
    </>
  );
}