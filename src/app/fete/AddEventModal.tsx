"use client";

import { useState } from "react";
import { X, Calendar, MapPin, AlignLeft, Link as LinkIcon, Music, Image as ImageIcon, Loader2, Clock, PartyPopper } from "lucide-react";
import styles from "./EditEventModal.module.css"; // On réutilise le même CSS pour la cohérence
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
        <div className={styles.modalGlow} />
        
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.iconCircle}>
              <PartyPopper size={20} className="text-purple-400" />
            </div>
            <div>
              <h2>Organiser une Fête</h2>
              <p className={styles.subtitle}>Nouvel événement déjanté</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </header>

        {/* ZONE DE SCROLL */}
        <div className={styles.scrollArea}>
          <form onSubmit={handleSubmit} id="add-event-form" className={styles.form}>
            {/* IMAGE SECTOR */}
            <div className={styles.inputGroup}>
              <label><ImageIcon size={14} /> Affiche de la soirée</label>
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
                <label><Calendar size={14} /> Début</label>
                <input name="date" type="datetime-local" required />
              </div>
              <div className={styles.inputGroup}>
                <label><Clock size={14} /> Fin (Optionnel)</label>
                <input name="dateFin" type="datetime-local" />
              </div>
            </div>

            {/* LIEU */}
            <div className={styles.inputGroup}>
              <label><MapPin size={14} /> Lieu</label>
              <input name="lieu" type="text" placeholder="Ex: K'fet, Résidence..." required />
            </div>

            {/* DESCRIPTION */}
            <div className={styles.inputGroup}>
              <label><AlignLeft size={14} /> Description / Infos</label>
              <textarea name="description" rows={3} placeholder="Détails, thèmes, dresscode..." />
            </div>

            {/* LIENS GRID */}
            <div className={styles.linksGrid}>
              <div className={styles.inputGroup}>
                <label><LinkIcon size={14} /> Billetterie</label>
                <input name="lienBilletterie" type="url" placeholder="https://shotgun..." />
              </div>
              <div className={styles.inputGroup}>
                <label><Music size={14} /> Playlist</label>
                <input name="playlistUrl" type="url" placeholder="https://spotify..." />
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER FIXE */}
        <footer className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>Annuler</button>
          <button form="add-event-form" type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Publication...
              </>
            ) : (
              "Publier l'événement"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}