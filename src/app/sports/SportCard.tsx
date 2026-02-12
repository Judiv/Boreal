"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, UserPlus, UserMinus, Users, CalendarPlus } from "lucide-react";
import styles from "./sports.module.css";
import { toggleRegistration, deleteSport } from "./actions";
import SportModalWrapper from "./SportModalWrapper";
import AddSessionModal from "./AddSessionModal";

// ✅ Fonction utilitaire pour rediriger vers l'API Uploads
const getSafeUrl = (url: string | null) => {
  if (!url || url.trim() === "") return "/default-sport.jpg";
  if (url.startsWith("/api/uploads/") || url.startsWith("http")) return url;
  // Extrait le nom du fichier pour l'envoyer à l'API
  const filename = url.split("/").pop();
  return `/api/uploads/${filename}`;
};

export default function SportCard({ sport, canManage, isRegistered: initialRegistered }: any) {
  const [isRegistered, setIsRegistered] = useState(initialRegistered);
  const [count, setCount] = useState(sport._count?.members || 0);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  const handleToggle = async () => {
    const nextState = !isRegistered;
    setIsRegistered(nextState);
    setCount((prev: number) => (nextState ? prev + 1 : prev - 1));
    try {
      await toggleRegistration(sport.id);
    } catch (error) {
      setIsRegistered(!nextState);
      setCount((prev: number) => (!nextState ? prev + 1 : prev - 1));
    }
  };

  // ✅ On sécurise l'URL de l'image pour Docker
  const finalSrc = getSafeUrl(sport.imageUrl);

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image 
          src={finalSrc} 
          alt={sport.name} 
          fill
          unoptimized
          className={styles.image}
          priority
        />
        
        <div className={styles.memberBadge}>
          <Users size={14} />
          <span>{count} GADZ</span>
        </div>
      </div>

      <div className={styles.content}>
        <h2 className={styles.sportName}>{sport.name}</h2>
        <p className={styles.description}>{sport.description}</p>

        <div className={styles.actionsWrapper}>
          <button
            onClick={handleToggle}
            className={`${styles.registerBtn} ${isRegistered ? styles.btnRegistered : styles.btnNotRegistered}`}
          >
            {isRegistered ? <UserMinus size={18} /> : <UserPlus size={18} />}
            {isRegistered ? "QUITTER" : "REJOINDRE"}
          </button>

          {canManage && (
            <div className={styles.adminActions}>
              <button 
                onClick={() => setIsSessionModalOpen(true)}
                className={styles.actionIconBtn}
                title="Programmer une séance"
              >
                <CalendarPlus size={18} />
              </button>

              <SportModalWrapper sportToEdit={sport} />
              
              <button 
                onClick={() => confirm("Supprimer ce sport ?") && deleteSport(sport.id)} 
                className={styles.deleteBtn}
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {isSessionModalOpen && (
        <AddSessionModal 
          sport={sport} 
          onClose={() => setIsSessionModalOpen(false)} 
        />
      )}
    </div>
  );
}