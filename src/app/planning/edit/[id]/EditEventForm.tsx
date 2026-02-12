// src/app/planning/edit/[id]/EditEventForm.tsx
"use client";

import { updateEvent } from "../../actions";
import styles from "../../form.module.css";
import { Type, Calendar, MapPin, AlignLeft, Clock, X, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import CategorySelector from "@/components/CategorySelector";

interface CategoryOption {
  id: string;
  label: string;
}

export default function EditEventForm({ 
  event, 
  userRole, 
  categories = [] 
}: { 
  event: any, 
  userRole: string, 
  categories: CategoryOption[] 
}) {
  
  // ✅ État initial basé sur le type actuel de l'event
  const [selectedType, setSelectedType] = useState(event.type || "");
  const isComits = selectedType === "COMITS";

  return (
    <div className={styles.wrapper}>
      {/* 🔴 EFFET AURORE ROUGE SI COMITS */}
      <div className={isComits ? styles.auroraComits : styles.auroraBlob} />

      <form 
        action={updateEvent} 
        className={`${styles.formCard} ${isComits ? styles.formCardComits : ""}`}
      >
        <Link href="/" className={styles.closeButton} title="Annuler">
          <X size={20} />
        </Link>

        {/* Champ caché pour l'ID de l'event pour l'action server */}
        <input type="hidden" name="id" value={event.id} />

        <div className={styles.header}>
          <h1 className={`${styles.title} ${isComits ? styles.titleComits : ""}`}>
            Modifier <span>l'Event</span>
          </h1>
          <p className={styles.subtitle}>
             {userRole === "SUPER_ADMIN" ? "Mode Admin : Accès total." : "Mettez à jour les informations de votre événement."}
          </p>
        </div>

        {/* --- TITRE --- */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}><Type size={12}/> Titre</label>
          <input name="titre" type="text" required defaultValue={event.titre} className={styles.input} />
        </div>

        {/* --- CATÉGORIE DYNAMIQUE --- */}
        <div className={styles.fieldGroup}>
          <CategorySelector 
              name="type" 
              label="Catégorie de l'événement" 
              categories={categories} 
              defaultValue={event.type}
              onChange={(val) => setSelectedType(val)} 
          />
        </div>

        {/* --- DATES --- */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
              <label className={styles.label}><Calendar size={12}/> Début</label>
              <input 
                name="dateDebut" 
                type="datetime-local" 
                required 
                defaultValue={event.dateDebut} 
                className={styles.input} 
              />
          </div>
          <div className={styles.fieldGroup}>
              <label className={styles.label}><Clock size={12}/> Fin</label>
              <input 
                name="dateFin" 
                type="datetime-local" 
                required 
                defaultValue={event.dateFin ? event.dateFin : ""} 
                className={styles.input} 
              />
          </div>
        </div>

        {/* --- LIEU --- */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}><MapPin size={12}/> Lieu</label>
          <input name="lieu" type="text" defaultValue={event.lieu || ""} className={styles.input} placeholder="Ex: Grand Amphi..." />
        </div>

        {/* --- DESCRIPTION --- */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}><AlignLeft size={12}/> Description</label>
          <textarea name="description" rows={4} defaultValue={event.description || ""} className={styles.textarea} placeholder="Détails de l'événement..."></textarea>
        </div>

        {/* --- VALIDATION --- */}
        <button 
            type="submit" 
            className={`${styles.submitButton} ${isComits ? styles.submitButtonComits : ""}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Save size={18} /> Enregistrer les modifications
          </div>
        </button>
      </form>
    </div>
  );
}