"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFolder } from "@/app/galerie/actions";
import { X, Pencil, User, AlignLeft, Tag } from "lucide-react";
import styles from "./CreateFolderModal.module.css"; // On utilise le même fichier CSS

export default function EditFolderModal({ folder, onClose }: { folder: any, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      await updateFolder(folder.id, formData);
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalGlow} />
        
        <header className={styles.header}>
          <div className={styles.iconTitle}>
            <Pencil className="text-blue-400" size={24} />
            <h2>Modifier l'album</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </header>

        <form action={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label><Tag size={14} /> Titre</label>
            <input name="nom" type="text" defaultValue={folder.nom} required />
          </div>

          <div className={styles.inputGroup}>
            <label><User size={14} /> Auteur</label>
            <input name="auteur" type="text" defaultValue={folder.auteur} required />
          </div>

          <div className={styles.inputGroup}>
            <label><AlignLeft size={14} /> Description</label>
            <textarea name="description" defaultValue={folder.description || ""} rows={3} />
          </div>

          {/* ✅ Nouveau footer avec les deux boutons */}
          <div className={styles.footer}>
            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Mettre à jour"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}