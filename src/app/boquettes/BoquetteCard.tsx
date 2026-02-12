"use client";

import { useState } from "react";
import styles from "./BoquetteCard.module.css";
import { MapPin, Power, Edit2, Users, Beer, Trash2 } from "lucide-react"; // ✅ Ajout de Beer
import Image from "next/image";
import { deleteBoquette, toggleBoquetteStatus, sendRotanceRequest } from "./actions"; // ✅ Ajout de sendRotanceRequest
import EditBoquetteModal from "./EditBoquetteModal";

export default function BoquetteCard({ boquette, canManage }: any) {
  const [isOpen, setIsOpen] = useState(boquette.isOpen);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRotanceLoading, setIsRotanceLoading] = useState(false); // ✅ État pour le bouton Rotance
  
  const managers = boquette.managers || [];

  const handleDelete = async () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la boquette "${boquette.nom}" ?`)) {
      await deleteBoquette(boquette.id);
    }
  };

  const handleToggle = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    try { 
      await toggleBoquetteStatus(boquette.id); 
    } catch (e) { 
      setIsOpen(!nextState); 
    }
  };

  // ✅ Logique d'envoi de la Rotance
  const handleRotance = async () => {
    setIsRotanceLoading(true);
    try {
      await sendRotanceRequest(boquette.id);
      alert("Demande de rotance envoyée aux gérants ! 🚀");
    } catch (e) {
      alert("Impossible d'envoyer la demande.");
    } finally {
      setIsRotanceLoading(false);
    }
  };

  return (
    <div className={`${styles.card} ${isOpen ? styles.cardOpen : ""}`}>
      <div className={styles.imageWrapper}>
        <div className={`${styles.statusBadge} ${isOpen ? styles.statusOpen : styles.statusClosed}`}>
          {isOpen ? "Ouvert" : "Fermé"}
        </div>
        <Image 
          src={boquette.imageUrl && boquette.imageUrl.trim() !== "" 
            ? boquette.imageUrl 
            : "/placeholder-boquette.jpg"
          } 
          alt={boquette.nom} 
          fill
          unoptimized
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        <h2 className={styles.boquetteName}>{boquette.nom}</h2>
        <div className={styles.location}>
          <MapPin size={14} /> {boquette.lieu}
        </div>
        <p className={styles.description}>{boquette.description}</p>

        {/* AFFICHAGE DES MANAGERS */}
        <div className={styles.managersSection}>
          <div className={styles.avatarGroup}>
            {managers.slice(0, 3).map((m: any) => (
              <div key={m.id} className={styles.avatarWrapper}>
                <div className={styles.avatar}>{m.prenom[0]}</div>
                <div className={styles.tooltip}>{m.prenom} {m.nom}</div>
              </div>
            ))}
            {managers.length > 3 && (
              <div className={styles.avatar} style={{ background: '#3f3f46' }}>
                +{managers.length - 3}
              </div>
            )}
          </div>
          <span className={styles.managerText}>
            {managers.length > 0 ? "Équipe de gestion" : "Aucun gestionnaire"}
          </span>
        </div>

        <div className={styles.actionsWrapper}>
          {/* ✅ BOUTON ROTANCE : Visible par tous si fermé */}
          {!isOpen && (
            <button 
              className={styles.rotanceBtn} 
              onClick={handleRotance}
              disabled={isRotanceLoading}
            >
              <Beer size={16} className={isRotanceLoading ? styles.spin : ""} />
              {isRotanceLoading ? "APPEL..." : "ROTANCE ?"}
            </button>
          )}

          {/* ACTIONS DE GESTION */}
          {canManage && (
            <div className={styles.adminActions}>
              <button 
                className={styles.editBtn} 
                onClick={() => setIsEditOpen(true)}
                title="Modifier"
              >
                <Edit2 size={18} />
              </button>
              <button 
                className={styles.deleteBtn} 
                onClick={handleDelete}
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={handleToggle}
                className={`${styles.toggleBtn} ${isOpen ? styles.btnClose : styles.btnOpen}`}
              >
                <Power size={16} />
                {isOpen ? "FERMER" : "OUVRIR"}
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditOpen && (
        <EditBoquetteModal 
          boquette={boquette} 
          onClose={() => setIsEditOpen(false)} 
        />
      )}
    </div>
  );
}