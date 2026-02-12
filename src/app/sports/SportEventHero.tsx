"use client";

import { MapPin, Calendar, Ticket, Play, Trash2, Edit3, Zap } from "lucide-react";
import { deleteSportEvent } from "./actions";
import SportEventModal from "./SportEventModal"; 
import { useState } from "react";
import styles from "./sports.module.css";

// ✅ Fonction utilitaire pour rediriger vers l'API Uploads
const getSafeUrl = (url: string | null) => {
  if (!url) return "";
  if (url.startsWith("/api/uploads/") || url.startsWith("http")) return url;
  // Extrait le nom du fichier pour l'envoyer à l'API
  const filename = url.split("/").pop();
  return `/api/uploads/${filename}`;
};

export default function SportEventHero({ event, canManage }: { event: any, canManage: boolean }) {
  // ✅ On sécurise l'URL du média (Vidéo ou Image de fond)
  const safeTrailerUrl = getSafeUrl(event.trailerUrl);
  
  const isVideo = safeTrailerUrl?.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || safeTrailerUrl?.includes("video/upload");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleDelete = async () => {
    if (confirm("Supprimer définitivement cet événement ?")) {
      try {
        await deleteSportEvent(event.id);
      } catch (error) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className={styles.heroEvent}>
      {/* BOUTONS ADMIN : EDIT & DELETE */}
      {canManage && (
        <div className={styles.adminActionsHero}>
          <button 
            onClick={() => setIsEditOpen(true)} 
            className={styles.iconBtn}
            title="Modifier l'événement"
          >
            <Edit3 size={18} />
          </button>
          <button 
            onClick={handleDelete} 
            className={`${styles.iconBtn} ${styles.deleteBtnHero}`}
            title="Supprimer l'événement"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      {/* BACKGROUND MEDIA - Utilise safeTrailerUrl */}
      {isVideo ? (
        <video 
          src={safeTrailerUrl} 
          autoPlay 
          muted 
          loop 
          playsInline
          className={styles.videoBg} 
        />
      ) : (
        <img 
          src={safeTrailerUrl || "/default.jpg"} 
          alt="" 
          className={styles.rotatingBg} 
        />
      )}
      
      <div className={styles.heroOverlay} />

      {/* CONTENT */}
      <div className={styles.heroContent}>
        <div className="flex items-center gap-3 mb-6">
          <div className={styles.statusBadge}>
            <Zap size={14} className={styles.zapIcon} />
            <span>Major Event</span>
          </div>
        </div>

        <h3 className={styles.heroTitle}>{event.titre}</h3>

        <div className={styles.metaContainer}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Localisation</span>
            <div className={styles.metaValue}>
              <MapPin size={20} className="text-purple-500" /> {event.lieu}
            </div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Date de l'event</span>
            <div className={styles.metaValue}>
              <Calendar size={20} className="text-purple-500" />
              {new Date(event.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>

        <div className={styles.actionGroup}>
          {event.billetterieUrl && (
            <a href={event.billetterieUrl} target="_blank" className={styles.cyberBtn} rel="noopener noreferrer">
              <Ticket size={20} /> PRENDRE SA PLACE
            </a>
          )}
          
          {/* Bouton Trailer externe (YouTube/Vimeo) - On ne touche pas à getSafeUrl ici car c'est un lien externe */}
          {event.externalTrailerUrl && (
            <button 
              onClick={() => window.open(event.externalTrailerUrl, '_blank')}
              className={styles.trailerBtn}
            >
              <div className={styles.playIconWrapper}>
                <Play size={16} fill="currentColor" />
              </div>
              <span>Regarder le trailer</span>
            </button>
          )}
        </div>
      </div>

      {/* MODAL D'ÉDITION */}
      {isEditOpen && (
        <SportEventModal 
          eventToEdit={event} 
          onClose={() => setIsEditOpen(false)} 
        />
      )}
    </div>
  );
}