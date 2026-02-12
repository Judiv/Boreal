// src/app/boquettes/EditBoquetteModal.tsx
"use client";

import Portal from "@/components/Portal";
import ImageSelector from "@/components/ImageSelector";
import TagSelector from "@/components/TagSelector"; // ✅ On utilise bien le TagSelector
import styles from "./EditBoquetteModal.module.css";
import { X, Save, MapPin, Type, AlignLeft, ImageIcon, Tag } from "lucide-react";
import { updateBoquetteInfo, createBoquette } from "./actions";

export default function EditBoquetteModal({ 
  boquette, 
  onClose, 
  isCreation, 
  availableTags = [] // ✅ Reçoit la liste filtrée (id, label) du bouton
}: any) {

  // On transforme les objets {id, label} en liste de strings pour le TagSelector si nécessaire
  // (Selon comment ton TagSelector est codé, il prend souvent juste un tableau de strings)
  const tagList = availableTags.map((t: any) => t.id);

  return (
    <Portal>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          
          <header className={styles.header}>
            <h2 className={styles.title}>
              {isCreation ? "Ajouter une " : "Modifier "} 
              <span>{isCreation ? "Boquette" : boquette?.nom}</span>
            </h2>
            <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
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
            {/* ID caché pour la modification */}
            {!isCreation && <input type="hidden" name="id" value={boquette?.id} />}

            <div className={styles.field}>
              <label><Type size={14}/> Nom de la Boquette</label>
              <input name="nom" defaultValue={boquette?.nom} required className={styles.input} placeholder="Ex: La Zone, Le Troqu's..." />
            </div>

            <div className={styles.field}>
              <label><MapPin size={14}/> Localisation</label>
              <input name="lieu" defaultValue={boquette?.lieu} required className={styles.input} placeholder="Ex: Sous-sol, Bâtiment A..." />
            </div>

            {/* ✅ LOGIQUE DU TAG : Sélecteur à la création, Verrouillé à l'édition */}
            <div className={styles.field}>
              {isCreation ? (
                <TagSelector 
                  name="requiredTag" 
                  label="Tag de gestion (Propriétaire)" 
                  tags={tagList} // Liste des tags autorisés pour l'utilisateur
                />
              ) : (
                <>
                  <label><Tag size={14}/> Tag associé (non modifiable)</label>
                  <div className={styles.disabledTagDisplay}>
                     <Tag size={12} className="opacity-50" />
                     <span>#{boquette?.requiredTag}</span>
                     <input type="hidden" name="requiredTag" value={boquette?.requiredTag} />
                  </div>
                </>
              )}
            </div>

            <div className={styles.field}>
              <label><ImageIcon size={14}/> Image de couverture</label>
              <ImageSelector defaultValue={boquette?.imageUrl} />
            </div>

            <div className={styles.field}>
              <label><AlignLeft size={14}/> Description</label>
              <textarea 
                name="description" 
                defaultValue={boquette?.description} 
                rows={4} 
                className={styles.textarea} 
                placeholder="Décrivez l'ambiance, les horaires ou les services..."
              />
            </div>

            <div className={styles.footer}>
              <button type="button" onClick={onClose} className={styles.cancelBtn}>Annuler</button>
              <button type="submit" className={styles.submitBtn}>
                <Save size={18} /> {isCreation ? "Créer la Boquette" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}