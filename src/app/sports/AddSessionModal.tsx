"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Clock, User, AlignLeft, Loader2, MapPin } from "lucide-react";
import { addSportSession } from "./actions";
import styles from "./sports.module.css";

export default function AddSessionModal({ sport, onClose }: { sport: any, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await addSportSession(sport.id, formData);
      onClose();
    } catch (err) {
      alert("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeBtn}><X /></button>

        <h2 className={styles.modalTitle}>Programmer : {sport.name}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* DATES */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={styles.fieldLabel}>Début</label>
              <div className={styles.inputGroup}>
                <Calendar size={16} className="text-purple-500" />
                <input name="startDate" type="datetime-local" required className="bg-transparent text-white outline-none w-full text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={styles.fieldLabel}>Fin</label>
              <div className={styles.inputGroup}>
                <Clock size={16} className="text-purple-500" />
                <input name="endDate" type="datetime-local" required className="bg-transparent text-white outline-none w-full text-sm" />
              </div>
            </div>
          </div>

          {/* LIEU ✅ NOUVEAU CHAMP */}
          <div className="flex flex-col gap-1">
            <label className={styles.fieldLabel}>Lieu de la séance</label>
            <div className={styles.inputGroup}>
              <MapPin size={16} className="text-red-400" />
              <input name="lieu" type="text" placeholder="Gymnase, Stade, Parc..." required className="bg-transparent text-white outline-none w-full" />
            </div>
          </div>

          {/* GÉRANTS */}
          <div className="flex flex-col gap-1">
            <label className={styles.fieldLabel}>Gérants associés</label>
            <div className={styles.inputGroup}>
              <User size={16} className="text-blue-400" />
              <input name="managers" type="text" placeholder="Qui gère la séance ?" required className="bg-transparent text-white outline-none w-full" />
            </div>
          </div>

          {/* INFOS COMPLÉMENTAIRES */}
          <div className="flex flex-col gap-1">
            <label className={styles.fieldLabel}>Infos supplémentaires</label>
            <div className={styles.inputGroup}>
              <AlignLeft size={16} className="text-gray-400" />
              <textarea name="description" placeholder="Matériel à prévoir, consignes..." rows={2} className="bg-transparent text-white outline-none w-full" />
            </div>
          </div>

          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "CRÉER LA SÉANCE"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}