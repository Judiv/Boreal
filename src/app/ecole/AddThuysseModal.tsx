"use client";

import { useState } from "react";
import { X, Link as LinkIcon, Tag, AlignLeft } from "lucide-react";
import { addThuysse } from "./actions"; // Assure-toi que l'action est dans le même dossier
import styles from "./AddThuysseModal.module.css";

export default function AddThuysseModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      await addThuysse(formData);
      onClose();
    } catch (e) {
      alert("Erreur lors de l'ajout de la Thuysse");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Lueur décorative en arrière-plan */}
        <div className={styles.modalGlow} />
        
        <header className={styles.header}>
          <div className={styles.iconTitle}>
            <LinkIcon className="text-blue-500" size={24} />
            <h2>Nouvelle Thuysse</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </header>

        <form action={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>
              <Tag size={12} /> Nom de la ressource
            </label>
            <input 
              name="nom" 
              type="text" 
              placeholder="Ex: Drive Mécanique 1A" 
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>
              <LinkIcon size={12} /> Lien URL
            </label>
            <input 
              name="url" 
              type="url" 
              placeholder="https://drive.google.com/..." 
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>
              <AlignLeft size={12} /> Description
            </label>
            <textarea 
              name="description" 
              placeholder="Cours, TD, annales et partiels corrigés..." 
              rows={3} 
            />
          </div>

          <div className={styles.footer}>
            <button 
              type="button" 
              onClick={onClose} 
              className={styles.cancelBtn}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Publier la Thuysse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}