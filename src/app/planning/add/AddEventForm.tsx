"use client";

import { createEvent } from "../actions";
import styles from "../form.module.css";
import { Type, Calendar, MapPin, AlignLeft, Clock, X, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import CategorySelector from "@/components/CategorySelector";

interface CategoryOption {
  id: string;
  label: string;
}

export default function AddEventForm({ 
  userRole, 
  categories 
}: { 
  userTags: string[], 
  userRole: string, 
  categories: CategoryOption[] 
}) {
  
  // État pour gérer le style spécifique "COMITS" (Rouge)
  const [selectedType, setSelectedType] = useState("");
  const isComits = selectedType === "COMITS";

  return (
    <div className={styles.wrapper}>
      {/* 🔴 EFFET AURORE ROUGE SI COMITS, SINON BLEU */}
      <div className={isComits ? styles.auroraComits : styles.auroraBlob} />

      <form 
        action={createEvent} 
        className={`${styles.formCard} ${isComits ? styles.formCardComits : ""}`}
      >
        <Link href="/" className={styles.closeButton} title="Annuler">
          <X size={20} />
        </Link>

        <div className={styles.header}>
          <h1 className={`${styles.title} ${isComits ? styles.titleComits : ""}`}>
            Ajouter un <span>Event</span>
          </h1>
          <p className={styles.subtitle}>
             {userRole === "SUPER_ADMIN" 
               ? "Mode Admin : Toutes les catégories sont débloquées."
               : `Vous pouvez publier dans ${categories.length} catégorie(s).`
             }
          </p>
        </div>

        {/* --- TITRE --- */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}><Type size={12}/> Titre</label>
          <input name="titre" type="text" required placeholder="Ex: Gala, Match, AG..." className={styles.input} autoFocus />
        </div>

        {/* --- CATÉGORIE DYNAMIQUE --- */}
        <div className={styles.fieldGroup}>
          <CategorySelector 
            name="type" 
            label="Catégorie de l'événement" 
            categories={categories}
            placeholder="Sélectionner le type d'event..."
            onChange={(val) => setSelectedType(val)} 
          />
        </div>

        {/* --- DATES --- */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
              <label className={styles.label}><Calendar size={12}/> Début</label>
              <input name="dateDebut" type="datetime-local" required className={styles.input} />
          </div>
          <div className={styles.fieldGroup}>
              <label className={styles.label}><Clock size={12}/> Fin</label>
              <input name="dateFin" type="datetime-local" required className={styles.input} />
          </div>
        </div>

        {/* --- LIEU --- */}
         <div className={styles.fieldGroup}>
          <label className={styles.label}><MapPin size={12}/> Lieu</label>
          <input name="lieu" type="text" placeholder="Ex: Grand Amphi, Foyer..." className={styles.input} />
        </div>

        {/* --- DESCRIPTION --- */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}><AlignLeft size={12}/> Description</label>
          <textarea name="description" rows={3} className={styles.textarea} placeholder="Précisez les détails de l'événement..."></textarea>
        </div>

        {/* --- VALIDATION --- */}
        <button 
            type="submit" 
            disabled={!selectedType}
            className={`${styles.submitButton} ${isComits ? styles.submitButtonComits : ""}`}
            style={{ opacity: !selectedType ? 0.5 : 1 }}
        >
            <div className="flex items-center justify-center gap-2">
                <Send size={18} />
                {selectedType ? "Inscrire au planning" : "Choisir une catégorie"}
            </div>
        </button>
      </form>
    </div>
  );
}