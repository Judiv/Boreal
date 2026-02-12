"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Trophy, AlignLeft, Loader2, Edit2 } from "lucide-react";
import { upsertSport } from "./actions";
import ImageSelector from "@/components/ImageSelector";
import styles from "./sports.module.css";

export default function SportModalWrapper({ sportToEdit = null }: { sportToEdit?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    // ✅ On ajoute manuellement le fichier sélectionné au FormData
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      // ✅ On envoie le FormData (qui contient binaire + textes) à l'action
      await upsertSport(sportToEdit?.id || null, formData);
      setIsOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => setIsOpen(false)} className={styles.closeBtn}>
          <X size={24} />
        </button>
        
        <h2 className={styles.modalTitle}>{sportToEdit ? "MODIFIER " + sportToEdit.name : "NOUVEAU SPORT"}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className={styles.fieldLabel}>Illustration</label>
            <ImageSelector 
              onFilesSelected={(files) => setSelectedFile(files[0])} 
              multiple={false} 
            />
          </div>

          <div className={styles.inputGroup}>
            <Trophy size={18} />
            <input name="name" defaultValue={sportToEdit?.name} required />
          </div>

          <div className={styles.inputGroup}>
            <AlignLeft size={18} />
            <textarea name="description" defaultValue={sportToEdit?.description} rows={3} />
          </div>

          <button type="submit" disabled={loading} className={styles.primaryBtn}>
            {loading ? <Loader2 className={styles.spinning} /> : "VALIDER"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {!sportToEdit ? (
        <button onClick={() => setIsOpen(true)} className={styles.primaryBtn} style={{width: 'auto'}}>
          <Plus size={20} /> AJOUTER UN SPORT
        </button>
      ) : (
        <button onClick={() => setIsOpen(true)} className={styles.actionIconBtn}>
          <Edit2 size={16} />
        </button>
      )}

      {/* ✅ createPortal garantit que le modal est devant tout (z-index) */}
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}