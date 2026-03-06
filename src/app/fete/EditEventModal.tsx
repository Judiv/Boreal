"use client";

import { useState } from "react";
import { X, Save, Calendar, Clock, MapPin, AlignLeft, Link as LinkIcon, Music, Image as ImageIcon, Loader2 } from "lucide-react";
import { updateEvent } from "./actions";
import styles from "./EditEventModal.module.css";
import ImageSelector from "@/components/ImageSelector";

export default function EditEventModal({ event, onClose }: { event: any, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Formatage des dates pour les inputs datetime-local (YYYY-MM-DDTHH:mm)
  const defaultDateDebut = new Date(event.date).toISOString().slice(0, 16);
  const defaultDateFin = event.dateFin 
    ? new Date(event.dateFin).toISOString().slice(0, 16) 
    : defaultDateDebut;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    if (selectedImage) {
      formData.set("image", selectedImage);
    }
    
    try {
      await updateEvent(event.id, formData);
      onClose();
    } catch (err) {
      alert("Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalGlow} />
        
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.iconCircle}>
              <Save size={20} className="text-purple-400" />
            </div>
            <div>
              <h2>Éditer l'événement</h2>
              <p className={styles.subtitle}>ID: #{event.id}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </header>

        {/* Zone Scrollable */}
        <div className={styles.scrollArea}>
          <form onSubmit={handleSubmit} id="edit-event-form" className={styles.form}>
            {/* Section Image */}
            <div className={styles.inputGroup}>
              <label><ImageIcon size={14} /> Changer l'affiche</label>
              <ImageSelector 
                onFilesSelected={(files) => setSelectedImage(files[0] || null)} 
                multiple={false}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Nom de la fête</label>
              <input name="titre" type="text" defaultValue={event.titre} placeholder="Titre de la soirée" required />
            </div>

            {/* Grille des dates : Début et Fin */}
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label><Calendar size={14} /> Début</label>
                <input name="date" type="datetime-local" defaultValue={defaultDateDebut} required />
              </div>
              <div className={styles.inputGroup}>
                <label><Clock size={14} /> Fin</label>
                <input name="dateFin" type="datetime-local" defaultValue={defaultDateFin} />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label><MapPin size={14} /> Lieu</label>
              <input name="lieu" type="text" defaultValue={event.lieu} placeholder="Lieu" required />
            </div>

            <div className={styles.inputGroup}>
              <label><AlignLeft size={14} /> Description</label>
              <textarea name="description" defaultValue={event.description} rows={3} placeholder="Infos supplémentaires..." />
            </div>

            <div className={styles.linksGrid}>
              <div className={styles.inputGroup}>
                <label><LinkIcon size={14} /> Billetterie</label>
                <input name="lienBilletterie" type="url" defaultValue={event.lienBilletterie} placeholder="https://shotgun..." />
              </div>
              <div className={styles.inputGroup}>
                <label><Music size={14} /> Playlist</label>
                <input name="playlistUrl" type="url" defaultValue={event.playlistUrl} placeholder="https://spotify..." />
              </div>
            </div>
          </form>
        </div>

        <footer className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>Annuler</button>
          <button form="edit-event-form" type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
            {loading ? "Mise à jour..." : "Enregistrer"}
          </button>
        </footer>
      </div>
    </div>
  );
}