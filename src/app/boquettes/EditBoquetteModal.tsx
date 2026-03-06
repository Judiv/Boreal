"use client";

import React from "react";
import Portal from "@/components/Portal";
import ImageSelector from "@/components/ImageSelector";
import TagSelector from "@/components/TagSelector"; 
import styles from "./boquettes.module.css"; // ✅ Liaison avec ton fichier CSS
import { X, Save, MapPin, Type, AlignLeft, ImageIcon, Tag, ShieldCheck } from "lucide-react";
import { updateBoquetteInfo, createBoquette } from "./actions";

export default function EditBoquetteModal({ 
  boquette, 
  onClose, 
  isCreation, 
  availableTags = [] 
}: any) {

  // Extraction propre des noms de tags pour le sélecteur
  const tagList = availableTags.map((t: any) => t.id || t.name);

  return (
    <Portal>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          
          <header className={styles.header}>
            <h2 className={styles.title}>
              {isCreation ? "Nouvelle " : "Édition "} 
              <span>{isCreation ? "Boquette" : boquette?.nom}</span>
            </h2>
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={22} />
            </button>
          </header>

          <form 
            action={async (formData) => {
              if (isCreation) {
                await createBoquette(formData);
              } else {
                await updateBoquetteInfo(formData);
              }
              onClose();
            }} 
            className={styles.form}
          >
            {/* ✅ CORPS DU FORMULAIRE SCROLLABLE */}
            <div className={styles.formBody}>
                {!isCreation && <input type="hidden" name="id" value={boquette?.id} />}

                <div className={styles.field}>
                  <label><Type size={16}/> Nom de la Boquette</label>
                  <input name="nom" defaultValue={boquette?.nom} required className={styles.input} placeholder="Ex: La Zone" />
                </div>

                <div className={styles.field}>
                  <label><MapPin size={16}/> Localisation</label>
                  <input name="lieu" defaultValue={boquette?.lieu} required className={styles.input} placeholder="Ex: Bâtiment Résidence" />
                </div>

                <div className={styles.field}>
                  <label><ShieldCheck size={16}/> Groupe Responsable (Propriétaire)</label>
                  <TagSelector 
                    name="requiredTag" 
                    defaultValue={boquette?.requiredTag} 
                    tags={tagList}
                    placeholder="Choisir le groupe..."
                    multiple={false}
                  />
                </div>

                {/* ✅ MODIFICATION DES TAGS D'ACCÈS DÉBLOQUÉE + MULTI-SÉLECTION */}
                <div className={styles.field}>
                  <label><Tag size={16}/> Groupes ayant accès (Multiples)</label>
                  <TagSelector 
                    name="allowedTags" 
                    defaultValue={boquette?.allowedTags || []} 
                    tags={tagList}
                    multiple={true}
                    placeholder="Ajouter des groupes autorisés..."
                  />
                </div>

                <div className={styles.field}>
                  <label><ImageIcon size={16}/> Image de couverture</label>
                  <ImageSelector defaultValue={boquette?.imageUrl} name="imageUrl" />
                </div>

                <div className={styles.field}>
                  <label><AlignLeft size={16}/> Description</label>
                  <textarea 
                    name="description" 
                    defaultValue={boquette?.description} 
                    rows={4} 
                    className={styles.textarea} 
                    placeholder="Horaires, ambiance, spécialités..."
                  />
                </div>
            </div>

            {/* ✅ PIED DE PAGE FIXE */}
            <div className={styles.footer}>
              <button type="button" onClick={onClose} className={styles.cancelBtn}>Annuler</button>
              <button type="submit" className={styles.submitBtn}>
                <Save size={20} /> {isCreation ? "Créer" : "Sauvegarder"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}