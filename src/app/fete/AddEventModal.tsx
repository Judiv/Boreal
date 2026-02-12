"use client";

import { useState } from "react";
import { X, Calendar, MapPin, AlignLeft, Link as LinkIcon, Music, Image as ImageIcon, Loader2, Clock } from "lucide-react";
import styles from "./modal.module.css"; 
import { addEvent } from "./actions";
import ImageSelector from "@/components/ImageSelector"; 

export default function AddEventModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (selectedImage) {
      formData.set("image", selectedImage);
    }

    try {
      await addEvent(formData);
      onClose();
    } catch (error) {
      alert("Erreur lors de la création de l'événement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Organiser une Fête</h2>
          <button onClick={onClose} className={styles.closeBtn}><X /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* IMAGE SECTOR */}
          <div className={styles.inputGroup}>
            <label><ImageIcon size={16} /> Affiche de la soirée</label>
            <ImageSelector 
              onFilesSelected={(files) => setSelectedImage(files[0] || null)} 
              multiple={false} 
            />
          </div>

          {/* NOM DE L'EVENT */}
          <div className={styles.inputGroup}>
            <label>Nom de l'événement</label>
            <input name="titre" type="text" placeholder="Ex: Soirée Post-Partiels" required />
          </div>

          {/* DATES GRID */}
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label><Calendar size={16} /> Début</label>
              <input name="date" type="datetime-local" required />
            </div>
            <div className={styles.inputGroup}>
              <label><Clock size={16} /> Fin (Optionnel)</label>
              <input name="dateFin" type="datetime-local" />
            </div>
          </div>

          {/* LIEU */}
          <div className={styles.inputGroup}>
            <label><MapPin size={16} /> Lieu</label>
            <input name="lieu" type="text" placeholder="Ex: K'fet, Résidence..." required />
          </div>

          {/* DESCRIPTION */}
          <div className={styles.inputGroup}>
            <label><AlignLeft size={16} /> Description / Infos</label>
            <textarea name="description" rows={3} placeholder="Détails, thèmes, dresscode..." />
          </div>

          {/* LIENS GRID */}
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label><LinkIcon size={16} /> Billetterie</label>
              <input name="lienBilletterie" type="url" placeholder="https://shotgun..." />
            </div>
            <div className={styles.inputGroup}>
              <label><Music size={16} /> Playlist</label>
              <input name="playlistUrl" type="url" placeholder="https://spotify..." />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Publication...
              </>
            ) : (
              "Publier l'événement"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}