"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Pour le rafraîchissement
import { createFolder } from "@/app/galerie/actions";
import { X, FolderPlus, User, AlignLeft, Tag } from "lucide-react";
import styles from "./CreateFolderModal.module.css";

export default function CreateFolderModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      await createFolder(formData);
      router.refresh(); // ✅ Force Next.js à re-fetch les dossiers
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
        {/* Effet de lueur en arrière-plan de la modal */}
        <div className={styles.modalGlow} />
        
        <header className={styles.header}>
          <div className={styles.iconTitle}>
            <FolderPlus className="text-blue-500" size={24} />
            <h2>Nouvel Album</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </header>

        <form action={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label><Tag size={14} /> Titre</label>
            <input name="nom" type="text" placeholder="Ex: Gala 2024" required />
          </div>

          <div className={styles.inputGroup}>
            <label><User size={14} /> Auteur</label>
            <input name="auteur" type="text" placeholder="Ex: Commission Photo" required />
          </div>

          <div className={styles.inputGroup}>
            <label><AlignLeft size={14} /> Description</label>
            <textarea name="description" placeholder="Quelques mots..." rows={3} />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Création..." : "Créer l'album"}
          </button>
        </form>
      </div>
    </div>
  );
}