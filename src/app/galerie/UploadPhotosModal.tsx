"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Tag, MapPin, User, Loader2 } from "lucide-react";
import ImageSelector from "@/components/ImageSelector";
import { addPhotosToFolder } from "@/app/galerie/actions";
// ✅ On s'assure d'utiliser le bon fichier CSS
import styles from "./CreateFolderModal.module.css"; 

export default function UploadPhotosModal({ folderId, onClose }: { folderId: number, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return alert("Sélectionne des photos !");
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    selectedFiles.forEach((file) => {
      formData.append("photos", file); 
    });

    try {
      await addPhotosToFolder(folderId, formData);
      router.refresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalGlow} />
        
        <header className={styles.header}>
          <div className={styles.iconTitle}>
            <Upload className="text-blue-500" size={24} />
            <h2>Importer des photos</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Sélection des clichés</label>
            <ImageSelector 
              onFilesSelected={(files) => setSelectedFiles(prev => [...prev, ...files])} 
              multiple={true} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={styles.inputGroup}>
              <label><Tag size={12} /> Titre commun</label>
              <input name="titre" type="text" placeholder="Gala 2026..." />
            </div>
            <div className={styles.inputGroup}>
              <label><User size={12} /> Photographe</label>
              <input name="auteur" type="text" placeholder="Nom de l'auteur" />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label><MapPin size={12} /> Lieu</label>
            <input name="lieu" type="text" placeholder="Où a été prise la photo ?" />
          </div>

          {/* ✅ Footer avec les deux boutons */}
          <div className={styles.footer}>
            <button 
              type="button" 
              onClick={onClose} 
              className={styles.cancelBtn}
              disabled={loading}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Envoi...
                </div>
              ) : (
                `Uploader ${selectedFiles.length} photos`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}