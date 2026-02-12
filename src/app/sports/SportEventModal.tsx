"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Video, MapPin, Link as LinkIcon, Calendar, Loader2 } from "lucide-react";
import { addSportEvent, updateSportEvent } from "./actions";
import styles from "./sports.module.css";
import MediaSelector from "../../components/MediaSelector";

// Helper pour formater la date pour l'input datetime-local (YYYY-MM-DDTHH:mm)
const formatDate = (date: Date | string) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
};

export default function SportEventModal({ eventToEdit, onClose }: { eventToEdit?: any, onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!eventToEdit;

  // Si on est en mode édition, le modal est géré par le Hero, donc on utilise useEffect
  useEffect(() => {
    if (isEdit) setIsOpen(true);
  }, [isEdit]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose(); // Notifie le parent pour démonter le composant
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (isEdit) {
        await updateSportEvent(eventToEdit.id, formData);
      } else {
        await addSportEvent(formData);
      }
      handleClose();
    } catch (error) {
      alert(isEdit ? "Erreur lors de la modification" : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const modalBody = (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button onClick={handleClose} className={styles.closeBtn}><X /></button>
        <h2 className={styles.modalTitle}>
          {isEdit ? "MODIFIER L'ÉVÉNEMENT" : "NOUVELLE COMPÉTITION"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <MediaSelector 
            defaultValue={eventToEdit?.trailerUrl} 
            onChange={() => {}} // Géré par le FormData du submit
          />

          <div className="flex flex-col gap-1 mt-2">
            <label className={styles.fieldLabel}>Lien du Trailer (Optionnel - Affiche le bouton)</label>
            <div className={styles.inputGroup}>
              <LinkIcon size={18} className="text-purple-500" />
              <input 
                name="externalTrailerUrl" 
                placeholder="Lien YouTube/Vimeo..." 
                defaultValue={eventToEdit?.externalTrailerUrl || ""}
              />
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <input 
              name="titre" 
              placeholder="Nom du tournoi..." 
              defaultValue={eventToEdit?.titre || ""}
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Début</label>
                    <input 
                    name="dateDebut" 
                    type="datetime-local" 
                    className={styles.inputGroup} 
                    defaultValue={formatDate(eventToEdit?.dateDebut)}
                    required 
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Fin</label>
                    <input 
                    name="dateFin" 
                    type="datetime-local" 
                    className={styles.inputGroup} 
                    defaultValue={formatDate(eventToEdit?.dateFin)}
                    required 
                    />
                </div>
            </div>

          <div className={styles.inputGroup}>
            <MapPin size={18} className="text-purple-500" />
            <input 
              name="lieu" 
              placeholder="Lieu" 
              defaultValue={eventToEdit?.lieu || ""}
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <LinkIcon size={18} className="text-purple-500" />
            <input 
              name="billetterieUrl" 
              placeholder="Lien Billetterie" 
              defaultValue={eventToEdit?.billetterieUrl || ""}
            />
          </div>

          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin mx-auto" size={20} />
            ) : (
              isEdit ? "ENREGISTRER LES MODIFS" : "PUBLIER L'ÉVÉNEMENT"
            )}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* N'affiche le bouton de création que si on n'est pas en mode édition */}
      {!isEdit && (
        <button onClick={() => setIsOpen(true)} className={`${styles.primaryBtn} !bg-purple-600 !text-white !border-none`}>
          <Plus size={20} /> ÉVÉNEMENT
        </button>
      )}

      {isOpen && createPortal(modalBody, document.body)}
    </>
  );
}